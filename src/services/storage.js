import { addDays, parseISO, formatISO, getMonth, getYear, startOfDay } from "date-fns";

const INVOICES_KEY = "finance_app_invoices";
const BILLS_KEY = "finance_app_bills";

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Creates an invoice and automatically generates the bills (installments).
 * Uses LocalStorage for persistence.
 * @param {Object} invoiceData 
 */
export const createInvoice = async (invoiceData) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");

        const invoiceId = generateId();
        const createdDate = new Date();

        // Ensure purchase_date is treated correctly (as local date from input)
        // input type="date" returns YYYY-MM-DD
        const purchaseDate = parseISO(invoiceData.purchase_date);

        const newInvoice = {
            id: invoiceId,
            ...invoiceData,
            created_at: formatISO(createdDate),
            purchase_date: invoiceData.purchase_date
        };

        invoices.push(newInvoice);

        const installmentValue = invoiceData.total_value / invoiceData.installments_count;

        for (let i = 1; i <= invoiceData.installments_count; i++) {
            const billId = generateId();

            // Due date: +30 days, +60 days, etc. based on purchase date
            const dueDate = addDays(purchaseDate, i * 30);

            const newBill = {
                id: billId,
                invoice_id: invoiceId,
                supplier: invoiceData.supplier,
                installment_number: `${i}/${invoiceData.installments_count}`,
                due_date: formatISO(dueDate),
                amount: installmentValue,
                status: "Pending", // 'Pending' | 'Paid'
                original_total: invoiceData.total_value,
                month_key: `${getMonth(dueDate) + 1}-${getYear(dueDate)}`,
                barcode: i === 1 ? (invoiceData.barcode || '') : ''
            };

            bills.push(newBill);
        }

        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
        localStorage.setItem(BILLS_KEY, JSON.stringify(bills));

        return invoiceId;

    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

/**
 * Fetches bills filtered by month and year.
 * @param {number} month - 1-indexed month (1 = January)
 * @param {number} year 
 */
export const getBillsByMonth = async (month, year) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));

        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");

        const filteredBills = bills.filter(bill => {
            const billDate = parseISO(bill.due_date);
            // billDate is parsed from ISO, so we can trust date-fns functions
            // getMonth returns 0-indexed
            return (getMonth(billDate) + 1) === month && getYear(billDate) === year;
        });

        // Sort by due date
        return filteredBills.sort((a, b) => parseISO(a.due_date) - parseISO(b.due_date));

    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

/**
 * Toggles the status of a bill.
 * @param {string} billId 
 * @param {string} currentStatus 
 */
export const toggleBillStatus = async (billId, currentStatus) => {
    try {
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");

        const updatedBills = bills.map(bill => {
            if (bill.id === billId) {
                return {
                    ...bill,
                    status: currentStatus === "Pending" ? "Paid" : "Pending"
                };
            }
            return bill;
        });

        localStorage.setItem(BILLS_KEY, JSON.stringify(updatedBills));

        return currentStatus === "Pending" ? "Paid" : "Pending";
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
};

export const updateBill = async (id, updates) => {
    try {
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
        const updatedBills = bills.map(bill => {
            if (bill.id === id) {
                return { ...bill, ...updates };
            }
            return bill;
        });
        localStorage.setItem(BILLS_KEY, JSON.stringify(updatedBills));
        return true;
    } catch (error) {
        console.error("Error updating bill:", error);
        throw error;
    }
};

/**
 * Fetches all invoices.
 */
export const getInvoices = async () => {
    try {
        const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
        return invoices.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
    }
};

/**
 * Fetches all bills (installments).
 */
export const getBills = async () => {
    try {
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
        return bills;
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};
