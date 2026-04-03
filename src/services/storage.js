import { addDays, parseISO, formatISO, getMonth, getYear, startOfDay } from "date-fns";

const INVOICES_KEY = "finance_app_invoices";
const BILLS_KEY = "finance_app_bills";
const SUPPLIERS_KEY = "finance_app_registered_suppliers";

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

        // Ensure base date uses firstDueDate if available
        const baseDate = invoiceData.firstDueDate ? parseISO(invoiceData.firstDueDate) : parseISO(invoiceData.purchase_date);

        const newInvoice = {
            id: invoiceId,
            ...invoiceData,
            created_at: formatISO(createdDate),
            purchase_date: invoiceData.purchase_date,
            category: invoiceData.category || "Outros",
            photo: invoiceData.photo || null
        };

        invoices.push(newInvoice);

        // Arithmetic cent rounding logic
        let remainingCents = 0;
        let baseInstallmentValue = invoiceData.total_value;

        if (invoiceData.installments_count > 1) {
            const centsTotal = Math.round(invoiceData.total_value * 100);
            const sliceCents = Math.floor(centsTotal / invoiceData.installments_count);
            remainingCents = centsTotal - (sliceCents * invoiceData.installments_count);
            baseInstallmentValue = sliceCents / 100;
        }

        for (let i = 1; i <= invoiceData.installments_count; i++) {
            const billId = generateId();

            // Due date: 1st installment = baseDate. Next ones +30 days each.
            const dueDate = addDays(baseDate, (i - 1) * 30);

            // Add the leftover cents to the first installment
            let amount = baseInstallmentValue;
            if (i === 1 && remainingCents > 0) {
                amount = (Math.round(baseInstallmentValue * 100) + remainingCents) / 100;
            }

            const newBill = {
                id: billId,
                invoice_id: invoiceId,
                supplier: invoiceData.supplier,
                category: invoiceData.category || "Outros",
                photo: invoiceData.photo || null,
                installment_number: `${i}/${invoiceData.installments_count}`,
                due_date: formatISO(dueDate),
                amount: amount,
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

export const updateInvoice = async (id, updates) => {
    try {
        const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
        const updated = invoices.map(inv => {
            if (inv.id === id) return { ...inv, ...updates };
            return inv;
        });
        localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoice = async (id) => {
    try {
        const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
        const filtered = invoices.filter(inv => inv.id !== id);
        localStorage.setItem(INVOICES_KEY, JSON.stringify(filtered));

        // Optionally, one might want to delete associated bills. We'll leave them alone or delete them?
        // Deleting the invoice should delete its bills to keep it consistent.
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
        const filteredBills = bills.filter(b => b.invoice_id !== id);
        localStorage.setItem(BILLS_KEY, JSON.stringify(filteredBills));

        return true;
    } catch (error) {
        console.error("Error deleting invoice:", error);
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

/**
 * Loads registered suppliers. Handles DB migration if ran for first time.
 */
export const getRegisteredSuppliers = async () => {
    try {
        let suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY));
        
        if (!suppliers) {
            // Auto-Migration
            const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
            const names = invoices.map(inv => inv.supplier).filter(Boolean);
            const uniqueNames = [...new Set(names)].sort((a, b) => a.localeCompare(b));
            
            suppliers = uniqueNames.map(name => ({
                id: generateId(),
                name: name,
                created_at: new Date().toISOString()
            }));
            
            localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
        }

        // Return strictly sorted by name
        return suppliers.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return [];
    }
};

/**
 * Adds a new explicit supplier.
 */
export const addSupplier = async (name, contactInfo = {}) => {
    try {
        let suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY));
        if (!suppliers) suppliers = await getRegisteredSuppliers();
        
        const trimmedName = name.trim();
        if (suppliers.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
            throw new Error("Fornecedor já existente!");
        }
        
        const newSupplier = {
            id: generateId(),
            name: trimmedName,
            created_at: new Date().toISOString(),
            ...contactInfo
        };
        
        suppliers.push(newSupplier);
        localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
        return newSupplier;
    } catch (error) {
        console.error("Error adding supplier:", error);
        throw error;
    }
};

/**
 * Deletes a registered supplier.
 */
export const deleteSupplier = async (id) => {
    try {
        const suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || "[]");
        const filtered = suppliers.filter(s => s.id !== id);
        localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
    }
};

/**
 * Fetches a single supplier by ID.
 */
export const getSupplierById = async (id) => {
    try {
        const suppliers = await getRegisteredSuppliers();
        return suppliers.find(s => s.id === id) || null;
    } catch (error) {
        console.error("Error fetching supplier:", error);
        return null;
    }
};

/**
 * Updates a registered supplier's data.
 */
export const updateSupplier = async (id, updates) => {
    try {
        const suppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || "[]");
        const updatedSuppliers = suppliers.map(supplier => {
            if (supplier.id === id) {
                return { ...supplier, ...updates };
            }
            return supplier;
        });
        localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(updatedSuppliers));
        return true;
    } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
    }
};

/**
 * --- MOCK DATA PARA DEMONSTRAÇÃO (HARDCODED) ---
 * Executado automaticamente se o banco de dados estiver apagado.
 */
export const initializeDummyData = () => {
    // Se não existir o banco de fornecedores carregado, injetamos todos os dados falsos.
    const currentSuppliers = JSON.parse(localStorage.getItem(SUPPLIERS_KEY) || "[]");
    
    if (currentSuppliers.length === 0) {
        const suppliers = [
            { id: "sup_1", name: "Distribuidora Ambev", contact_name: "Carlos Silva", phone: "(11) 99999-1111", email: "carlos@ambev.com.br" },
            { id: "sup_2", name: "Coca-Cola Femsa", contact_name: "Mariana Costa", phone: "(11) 98888-2222", email: "mariana@coca.com.br" },
            { id: "sup_3", name: "Indústria Bauducco", contact_name: "Roberto Campos", phone: "(11) 97777-3333", email: "roberto@bauducco.com.br" },
            { id: "sup_4", name: "Unilever Brasil", contact_name: "Ana Ferreira", phone: "(11) 96666-4444", email: "ana@unilever.com" },
            { id: "sup_5", name: "Nestlé", contact_name: "João Mendes", phone: "(11) 95555-5555", email: "joao@nestle.com" },
            { id: "sup_6", name: "Atacadão de Embalagens", contact_name: "Pedro", phone: "", email: "" }
        ];
        localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));

        const now = Date.now();
        const Day = 86400000;

        const invoices = [
            { id: "inv_1", supplier: "Distribuidora Ambev", purchase_date: new Date(now - 40 * Day).toISOString(), total_value: 3500.00, installments_count: 3 },
            { id: "inv_2", supplier: "Coca-Cola Femsa", purchase_date: new Date(now - 15 * Day).toISOString(), total_value: 1200.00, installments_count: 1 },
            { id: "inv_3", supplier: "Nestlé", purchase_date: new Date(now - 5 * Day).toISOString(), total_value: 850.50, installments_count: 2 },
            { id: "inv_4", supplier: "Unilever Brasil", purchase_date: new Date(now - 60 * Day).toISOString(), total_value: 5000.00, installments_count: 4 },
            { id: "inv_5", supplier: "Distribuidora Ambev", purchase_date: new Date(now - 2 * Day).toISOString(), total_value: 2000.00, installments_count: 2 }
        ];
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));

        const bills = [
            // inv_1 - Ambev (3x) - comprada há 40 dias
            { id: "b_1", invoice_id: "inv_1", supplier: "Distribuidora Ambev", amount: 1166.66, due_date: new Date(now - 10 * Day).toISOString(), status: "Paid", installment_number: 1 },
            { id: "b_2", invoice_id: "inv_1", supplier: "Distribuidora Ambev", amount: 1166.67, due_date: new Date(now + 2 * Day).toISOString(), status: "Pending", installment_number: 2 }, // Vence em 2 dias
            { id: "b_3", invoice_id: "inv_1", supplier: "Distribuidora Ambev", amount: 1166.67, due_date: new Date(now + 32 * Day).toISOString(), status: "Pending", installment_number: 3 },

            // inv_2 - Coca (1x) - comprada há 15 dias
            { id: "b_4", invoice_id: "inv_2", supplier: "Coca-Cola Femsa", amount: 1200.00, due_date: new Date(now + 15 * Day).toISOString(), status: "Pending", installment_number: 1 },

            // inv_3 - Nestle (2x) - comprada há 5 dias
            { id: "b_5", invoice_id: "inv_3", supplier: "Nestlé", amount: 425.25, due_date: new Date(now + 25 * Day).toISOString(), status: "Pending", installment_number: 1 },
            { id: "b_6", invoice_id: "inv_3", supplier: "Nestlé", amount: 425.25, due_date: new Date(now + 55 * Day).toISOString(), status: "Pending", installment_number: 2 },

            // inv_4 - Unilever (4x) - comprada há 60 dias
            { id: "b_7", invoice_id: "inv_4", supplier: "Unilever Brasil", amount: 1250.00, due_date: new Date(now - 30 * Day).toISOString(), status: "Paid", installment_number: 1 },
            { id: "b_8", invoice_id: "inv_4", supplier: "Unilever Brasil", amount: 1250.00, due_date: new Date(now).toISOString(), status: "Pending", installment_number: 2 }, // VENCE EXATAMENTE HOJE (Alert red bar)
            { id: "b_9", invoice_id: "inv_4", supplier: "Unilever Brasil", amount: 1250.00, due_date: new Date(now + 30 * Day).toISOString(), status: "Pending", installment_number: 3 },
            { id: "b_10", invoice_id: "inv_4", supplier: "Unilever Brasil", amount: 1250.00, due_date: new Date(now + 60 * Day).toISOString(), status: "Pending", installment_number: 4 },

            // inv_5 - Ambev (2x) - comprada há 2 dias
            { id: "b_11", invoice_id: "inv_5", supplier: "Distribuidora Ambev", amount: 1000.00, due_date: new Date(now + 5 * Day).toISOString(), status: "Pending", installment_number: 1 }, // Vence em 5 dias
            { id: "b_12", invoice_id: "inv_5", supplier: "Distribuidora Ambev", amount: 1000.00, due_date: new Date(now + 35 * Day).toISOString(), status: "Pending", installment_number: 2 },
            
            // Random overdue bill fantasma (Bauducco) - Venceu ontem
            { id: "b_13", invoice_id: "inv_0", supplier: "Indústria Bauducco", amount: 550.00, due_date: new Date(now - 1 * Day).toISOString(), status: "Pending", installment_number: 1 },
            
            // Mais uma para encher o gráfico lá na frente
            { id: "b_14", invoice_id: "inv_0", supplier: "Atacadão de Embalagens", amount: 800.00, due_date: new Date(now + 12 * Day).toISOString(), status: "Pending", installment_number: 1 },
        ];
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
        localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    }
};

// Executa automaticamente
initializeDummyData();
