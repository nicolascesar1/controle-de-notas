// import { addDays } from "date-fns"; // Removido para evitar conflitos

// Helper simples para somar dias sem dependência
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

// Chaves do LocalStorage
const INVOICES_KEY = "finance_app_invoices";
const BILLS_KEY = "finance_app_bills";

// Helper para gerar ID
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Cria uma nota fiscal e gera automaticamente os boletos (parcelas) - Versão LocalStorage
 */
export const createInvoice = async (invoiceData) => {
    try {
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));

        // 1. Ler dados atuais
        const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || "[]");
        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");

        // 2. Criar objeto da Nota
        const invoiceId = generateId();
        const newInvoice = {
            id: invoiceId,
            ...invoiceData,
            created_at: new Date().toISOString(),
            purchase_date: invoiceData.purchase_date // Já vem string do form
        };

        invoices.push(newInvoice);

        // 3. Gerar parcelas
        const installmentValue = invoiceData.total_value / invoiceData.installments_count;
        // Precisamos garantir que a data seja tratada corretamente com fuso horário local ao criar objeto Date
        const [year, month, day] = invoiceData.purchase_date.split('-');
        const purchaseDate = new Date(year, month - 1, day);

        for (let i = 1; i <= invoiceData.installments_count; i++) {
            const billId = generateId();

            // Data de vencimento: +30 dias, +60 dias, etc.
            const dueDate = addDays(purchaseDate, i * 30);

            const newBill = {
                id: billId,
                invoice_id: invoiceId,
                supplier: invoiceData.supplier,
                installment_number: `${i}/${invoiceData.installments_count}`,
                due_date: dueDate.toISOString(), // Salvar ISO para consistência
                amount: installmentValue,
                status: "Pending", // 'Pending' | 'Paid'
                original_total: invoiceData.total_value,
                month_key: `${dueDate.getMonth() + 1}-${dueDate.getFullYear()}`,
                barcode: i === 1 ? (invoiceData.barcode || '') : '' // Código apenas na 1ª parcela se informado
            };

            bills.push(newBill);
        }

        // 4. Salvar
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
        localStorage.setItem(BILLS_KEY, JSON.stringify(bills));

        return invoiceId;

    } catch (error) {
        console.error("Erro ao criar nota fiscal (LocalStorage):", error);
        throw error;
    }
};

/**
 * Busca boletos filtrados por mês e ano - Versão LocalStorage
 */
export const getBillsByMonth = async (month, year) => {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));

        const bills = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");

        // Filtrar
        const filteredBills = bills.filter(bill => {
            const billDate = new Date(bill.due_date);
            // Verifica mês e ano. getMonth() é 0-indexed (0=Jan, 11=Dez)
            // O parâmetro 'month' vem 1-indexed (1=Jan)
            return (billDate.getMonth() + 1) === month && billDate.getFullYear() === year;
        });

        // Ordenar por data
        return filteredBills.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    } catch (error) {
        console.error("Erro ao buscar boletos:", error);
        throw error;
    }
};

/**
 * Alterna o status do boleto - Versão LocalStorage
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
        console.error("Erro ao atualizar status:", error);
        throw error;
    }
};
