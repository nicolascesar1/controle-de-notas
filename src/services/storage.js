import { addDays, parseISO, formatISO, getMonth, getYear } from "date-fns";
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    getDoc,
    writeBatch
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

const INVOICES_COLLECTION = "invoices";
const BILLS_COLLECTION = "bills";
const SUPPLIERS_COLLECTION = "suppliers";

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    return user.uid;
};

/**
 * Creates an invoice and automatically generates the bills (installments).
 * Uses Firebase Firestore for persistence.
 */
export const createInvoice = async (invoiceData) => {
    try {
        const userId = getUserId();
        
        // 1. Create Invoice Document
        const invoiceRef = await addDoc(collection(db, INVOICES_COLLECTION), {
            ...invoiceData,
            userId,
            created_at: formatISO(new Date()),
            category: invoiceData.category || "Outros",
            photo: invoiceData.photo || null
        });

        const invoiceId = invoiceRef.id;

        // 2. Generate Bills (Installments)
        const baseDate = invoiceData.firstDueDate ? parseISO(invoiceData.firstDueDate) : parseISO(invoiceData.purchase_date);
        
        let remainingCents = 0;
        let baseInstallmentValue = invoiceData.total_value;

        if (invoiceData.installments_count > 1) {
            const centsTotal = Math.round(invoiceData.total_value * 100);
            const sliceCents = Math.floor(centsTotal / invoiceData.installments_count);
            remainingCents = centsTotal - (sliceCents * invoiceData.installments_count);
            baseInstallmentValue = sliceCents / 100;
        }

        const batch = writeBatch(db);

        for (let i = 1; i <= invoiceData.installments_count; i++) {
            const dueDate = addDays(baseDate, (i - 1) * 30);
            let amount = baseInstallmentValue;
            
            if (i === 1 && remainingCents > 0) {
                amount = (Math.round(baseInstallmentValue * 100) + remainingCents) / 100;
            }

            const billData = {
                userId,
                invoice_id: invoiceId,
                supplier: invoiceData.supplier,
                category: invoiceData.category || "Outros",
                photo: invoiceData.photo || null,
                installment_number: `${i}/${invoiceData.installments_count}`,
                due_date: formatISO(dueDate),
                amount: amount,
                status: "Pending",
                original_total: invoiceData.total_value,
                month_key: `${getMonth(dueDate) + 1}-${getYear(dueDate)}`,
                barcode: i === 1 ? (invoiceData.barcode || '') : ''
            };

            const billRef = doc(collection(db, BILLS_COLLECTION));
            batch.set(billRef, billData);
        }

        await batch.commit();
        return invoiceId;

    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
};

/**
 * Fetches bills filtered by month and year.
 */
export const getBillsByMonth = async (month, year) => {
    try {
        const userId = getUserId();
        const q = query(
            collection(db, BILLS_COLLECTION),
            where("userId", "==", userId),
            where("month_key", "==", `${month}-${year}`)
        );

        const snapshot = await getDocs(q);
        const bills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return bills.sort((a, b) => parseISO(a.due_date) - parseISO(b.due_date));
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

/**
 * Toggles the status of a bill.
 */
export const toggleBillStatus = async (billId, currentStatus) => {
    try {
        const billRef = doc(db, BILLS_COLLECTION, billId);
        const nextStatus = currentStatus === "Pending" ? "Paid" : "Pending";
        await updateDoc(billRef, { status: nextStatus });
        return nextStatus;
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
};

export const updateBill = async (id, updates) => {
    try {
        const billRef = doc(db, BILLS_COLLECTION, id);
        await updateDoc(billRef, updates);
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
        const userId = getUserId();
        const q = query(
            collection(db, INVOICES_COLLECTION),
            where("userId", "==", userId),
            orderBy("purchase_date", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
    }
};

export const updateInvoice = async (id, updates) => {
    try {
        const invoiceRef = doc(db, INVOICES_COLLECTION, id);
        await updateDoc(invoiceRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoice = async (id) => {
    try {
        // 1. Delete associated bills
        const q = query(collection(db, BILLS_COLLECTION), where("invoice_id", "==", id));
        const billsSnapshot = await getDocs(q);
        const batch = writeBatch(db);
        billsSnapshot.forEach((billDoc) => {
            batch.delete(billDoc.ref);
        });

        // 2. Delete invoice
        batch.delete(doc(db, INVOICES_COLLECTION, id));

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
};

/**
 * Fetches all bills.
 */
export const getBills = async () => {
    try {
        const userId = getUserId();
        const q = query(collection(db, BILLS_COLLECTION), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw error;
    }
};

/**
 * Loads registered suppliers.
 */
export const getRegisteredSuppliers = async () => {
    try {
        const userId = getUserId();
        const q = query(
            collection(db, SUPPLIERS_COLLECTION),
            where("userId", "==", userId),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const userId = getUserId();
        const trimmedName = name.trim();
        
        // Check uniqueness (client side check for better UX)
        const suppliers = await getRegisteredSuppliers();
        if (suppliers.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
            throw new Error("Fornecedor já existente!");
        }
        
        const newSupplier = {
            userId,
            name: trimmedName,
            created_at: new Date().toISOString(),
            ...contactInfo
        };
        
        const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), newSupplier);
        return { id: docRef.id, ...newSupplier };
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
        await deleteDoc(doc(db, SUPPLIERS_COLLECTION, id));
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
        const docRef = doc(db, SUPPLIERS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
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
        const docRef = doc(db, SUPPLIERS_COLLECTION, id);
        await updateDoc(docRef, updates);
        return true;
    } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
    }
};

/**
 * We no longer need dummy data initialization automatically on every load.
 * We will provide a way to seed data if needed, or just let the user start fresh.
 */
export const initializeDummyData = async () => {
    // Optional implementation for training/demo purposes
};
