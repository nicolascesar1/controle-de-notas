import { addMonths, formatISO, getMonth, getYear, isBefore, parseISO, startOfDay } from "date-fns";

export const DEFAULT_CATEGORY = "Outros";
export const BILL_STATUS = {
    pending: "Pending",
    paid: "Paid",
};

const toDate = (date) => {
    if (date instanceof Date) return date;
    return parseISO(date);
};

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => cents / 100;

export const getMonthKey = (date) => {
    const parsedDate = toDate(date);
    return `${getMonth(parsedDate) + 1}-${getYear(parsedDate)}`;
};

export const splitAmountIntoInstallments = (totalValue, installmentsCount) => {
    const count = Number(installmentsCount);
    if (!Number.isInteger(count) || count <= 0) {
        throw new Error("A quantidade de parcelas deve ser um número inteiro positivo.");
    }

    const totalCents = toCents(totalValue);
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents - (baseCents * count);

    return Array.from({ length: count }, (_, index) => {
        const extraCents = index === 0 ? remainderCents : 0;
        return fromCents(baseCents + extraCents);
    });
};

export const generateInstallmentBills = ({ invoiceData, invoiceId, userId }) => {
    const installmentsCount = Number(invoiceData.installments_count);
    const supplierName = invoiceData.supplier_name || invoiceData.supplier;
    const baseDate = invoiceData.firstDueDate
        ? parseISO(invoiceData.firstDueDate)
        : parseISO(invoiceData.purchase_date);
    const amounts = splitAmountIntoInstallments(invoiceData.total_value, installmentsCount);
    const photo = invoiceData.photo_url ?? invoiceData.photo ?? null;

    return amounts.map((amount, index) => {
        const installmentIndex = index + 1;
        const dueDate = addMonths(baseDate, index);

        return {
            userId,
            invoice_id: invoiceId,
            supplier: supplierName,
            supplier_id: invoiceData.supplier_id || null,
            category: invoiceData.category || DEFAULT_CATEGORY,
            photo,
            installment_number: `${installmentIndex}/${installmentsCount}`,
            due_date: formatISO(dueDate),
            amount,
            status: BILL_STATUS.pending,
            paid_at: null,
            original_total: invoiceData.total_value,
            month_key: getMonthKey(dueDate),
            barcode: installmentIndex === 1 ? (invoiceData.barcode || "") : "",
        };
    });
};

export const calculateBillsSummary = (bills, today = new Date()) => {
    const todayStart = startOfDay(toDate(today));

    const summary = bills.reduce((acc, bill) => {
        const amountCents = toCents(bill.amount || 0);
        const isPaid = bill.status === BILL_STATUS.paid;
        const isOverdue = bill.status === BILL_STATUS.pending
            && isBefore(toDate(bill.due_date), todayStart);

        acc.total += amountCents;
        if (isPaid) acc.paid += amountCents;
        if (isOverdue) acc.overdue += amountCents;

        return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });

    return {
        total: fromCents(summary.total),
        paid: fromCents(summary.paid),
        pending: fromCents(summary.total - summary.paid),
        overdue: fromCents(summary.overdue),
    };
};
