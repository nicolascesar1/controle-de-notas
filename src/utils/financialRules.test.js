import { describe, expect, it } from "vitest";
import {
    calculateBillsSummary,
    generateInstallmentBills,
    getMonthKey,
    splitAmountIntoInstallments,
} from "./financialRules";

const baseInvoice = {
    supplier_name: "Fornecedor Teste",
    supplier_id: "supplier-1",
    purchase_date: "2026-01-31",
    total_value: 100,
    installments_count: 3,
    category: "Material",
    barcode: "123456",
};

describe("financialRules", () => {
    it("generates installments using calendar months from the first due date", () => {
        const bills = generateInstallmentBills({
            invoiceData: {
                ...baseInvoice,
                firstDueDate: "2026-01-31",
            },
            invoiceId: "invoice-1",
            userId: "user-1",
        });

        expect(bills).toHaveLength(3);
        expect(bills.map((bill) => bill.installment_number)).toEqual(["1/3", "2/3", "3/3"]);
        expect(bills.map((bill) => bill.due_date.slice(0, 10))).toEqual([
            "2026-01-31",
            "2026-02-28",
            "2026-03-31",
        ]);
        expect(bills.map((bill) => bill.month_key)).toEqual(["1-2026", "2-2026", "3-2026"]);
    });

    it("splits cents without losing or creating money", () => {
        expect(splitAmountIntoInstallments(100, 3)).toEqual([33.34, 33.33, 33.33]);
        expect(splitAmountIntoInstallments(10.01, 2)).toEqual([5.01, 5]);
        expect(splitAmountIntoInstallments(0.05, 4)).toEqual([0.02, 0.01, 0.01, 0.01]);

        const sum = splitAmountIntoInstallments(199.99, 6)
            .reduce((total, amount) => Math.round((total + amount) * 100) / 100, 0);

        expect(sum).toBe(199.99);
    });

    it("builds complete bill payloads for persistence", () => {
        const [firstBill, secondBill] = generateInstallmentBills({
            invoiceData: {
                ...baseInvoice,
                installments_count: 2,
                total_value: 50.01,
            },
            invoiceId: "invoice-9",
            userId: "user-9",
        });

        expect(firstBill).toMatchObject({
            userId: "user-9",
            invoice_id: "invoice-9",
            supplier: "Fornecedor Teste",
            supplier_id: "supplier-1",
            category: "Material",
            amount: 25.01,
            status: "Pending",
            paid_at: null,
            original_total: 50.01,
            barcode: "123456",
        });
        expect(secondBill).toMatchObject({
            amount: 25,
            barcode: "",
        });
    });

    it("derives month_key from dates and ISO strings", () => {
        expect(getMonthKey(new Date(2026, 5, 4, 12))).toBe("6-2026");
        expect(getMonthKey("2026-12-01")).toBe("12-2026");
    });

    it("calculates summary totals and overdue pending bills", () => {
        const summary = calculateBillsSummary([
            { amount: 100, status: "Paid", due_date: "2026-05-10" },
            { amount: 50.5, status: "Pending", due_date: "2026-05-31" },
            { amount: 20, status: "Pending", due_date: "2026-06-04" },
            { amount: 30, status: "Pending", due_date: "2026-06-05" },
        ], new Date(2026, 5, 4, 10));

        expect(summary).toEqual({
            total: 200.5,
            paid: 100,
            pending: 100.5,
            overdue: 50.5,
        });
    });

    it("calculates summary values in cents to avoid floating point noise", () => {
        const summary = calculateBillsSummary([
            { amount: 0.1, status: "Paid", due_date: "2026-06-01" },
            { amount: 0.2, status: "Pending", due_date: "2026-06-01" },
        ], new Date(2026, 5, 4, 10));

        expect(summary).toMatchObject({
            total: 0.3,
            paid: 0.1,
            pending: 0.2,
            overdue: 0.2,
        });
    });

    it("does not count paid bills as overdue", () => {
        const summary = calculateBillsSummary([
            { amount: 75, status: "Paid", due_date: "2026-01-01" },
        ], new Date(2026, 5, 4, 10));

        expect(summary.overdue).toBe(0);
    });
});
