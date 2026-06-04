import { parseISO, formatISO } from "date-fns";
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDoc,
    writeBatch
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, auth, storage } from "../firebase/config";
import { DEFAULT_CATEGORY, generateInstallmentBills, getMonthKey } from "../utils/financialRules";

const INVOICES_COLLECTION = "invoices";
const BILLS_COLLECTION = "bills";
const SUPPLIERS_COLLECTION = "suppliers";

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    return user.uid;
};

const stripFirestoreId = (data) => {
    const rest = { ...(data || {}) };
    delete rest.id;
    return rest;
};

const commitInChunks = async (operations, chunkSize = 450) => {
    for (let i = 0; i < operations.length; i += chunkSize) {
        const batch = writeBatch(db);
        operations.slice(i, i + chunkSize).forEach((operation) => operation(batch));
        await batch.commit();
    }
};

const uploadInvoicePhoto = async (photo, userId) => {
    if (!photo || typeof photo !== "string" || !photo.startsWith("data:image/")) {
        return photo || null;
    }

    const photoRef = ref(storage, `users/${userId}/invoices/${crypto.randomUUID()}.jpg`);
    await uploadString(photoRef, photo, "data_url");
    return getDownloadURL(photoRef);
};

/**
 * Creates an invoice and automatically generates the bills (installments).
 * Uses Firebase Firestore for persistence.
 */
export const createInvoice = async (invoiceData) => {
    try {
        const userId = getUserId();
        const supplierName = invoiceData.supplier_name || invoiceData.supplier;
        const photoUrl = await uploadInvoicePhoto(invoiceData.photo, userId);
        const invoicePayload = {
            ...stripFirestoreId(invoiceData),
            photo: photoUrl
        };
        
        // 1. Create Invoice Document
        const invoiceRef = await addDoc(collection(db, INVOICES_COLLECTION), {
            ...invoicePayload,
            userId,
            supplier: supplierName,
            supplier_id: invoiceData.supplier_id || null,
            created_at: formatISO(new Date()),
            category: invoiceData.category || DEFAULT_CATEGORY,
            photo: photoUrl
        });

        const invoiceId = invoiceRef.id;

        const batch = writeBatch(db);
        const bills = generateInstallmentBills({
            invoiceData: { ...invoiceData, photo_url: photoUrl },
            invoiceId,
            userId
        });
        bills.forEach((billData) => {
            const billRef = doc(collection(db, BILLS_COLLECTION));
            batch.set(billRef, billData);
        });

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
        await updateDoc(billRef, {
            status: nextStatus,
            paid_at: nextStatus === "Paid" ? formatISO(new Date()) : null
        });
        return nextStatus;
    } catch (error) {
        console.error("Error updating status:", error);
        throw error;
    }
};

export const updateBill = async (id, updates) => {
    try {
        const billRef = doc(db, BILLS_COLLECTION, id);
        const normalizedUpdates = { ...updates };
        if (normalizedUpdates.due_date) {
            const dueDate = parseISO(normalizedUpdates.due_date);
            normalizedUpdates.month_key = getMonthKey(dueDate);
        }
        if (normalizedUpdates.status === "Paid" && !normalizedUpdates.paid_at) {
            normalizedUpdates.paid_at = formatISO(new Date());
        }
        if (normalizedUpdates.status === "Pending") {
            normalizedUpdates.paid_at = null;
        }
        await updateDoc(billRef, normalizedUpdates);
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
            where("userId", "==", userId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
    } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
    }
};

export const updateInvoice = async (id, updates) => {
    try {
        const userId = getUserId();
        const invoiceRef = doc(db, INVOICES_COLLECTION, id);
        const currentInvoiceSnap = await getDoc(invoiceRef);
        if (!currentInvoiceSnap.exists()) throw new Error("Nota fiscal não encontrada");

        const currentInvoice = { id: currentInvoiceSnap.id, ...currentInvoiceSnap.data() };
        const normalizedUpdates = { ...stripFirestoreId(updates) };
        if (normalizedUpdates.supplier_name) {
            normalizedUpdates.supplier = normalizedUpdates.supplier_name;
            delete normalizedUpdates.supplier_name;
        }

        const operations = [(batch) => batch.update(invoiceRef, normalizedUpdates)];

        const billsQuery = query(
            collection(db, BILLS_COLLECTION),
            where("userId", "==", userId),
            where("invoice_id", "==", id)
        );
        const billsSnapshot = await getDocs(billsQuery);
        billsSnapshot.forEach((billDoc) => {
            const billUpdates = {};
            if (normalizedUpdates.supplier !== undefined) billUpdates.supplier = normalizedUpdates.supplier;
            if (normalizedUpdates.supplier_id !== undefined) billUpdates.supplier_id = normalizedUpdates.supplier_id;
            if (normalizedUpdates.category !== undefined) billUpdates.category = normalizedUpdates.category;
            if (normalizedUpdates.photo !== undefined) billUpdates.photo = normalizedUpdates.photo;

            if (Object.keys(billUpdates).length > 0) {
                operations.push((batch) => batch.update(billDoc.ref, billUpdates));
            }
        });

        if (currentInvoice.userId !== userId) throw new Error("Usuário não autorizado");
        await commitInChunks(operations);
        return true;
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
};

export const deleteInvoice = async (id) => {
    try {
        const userId = getUserId();
        // 1. Delete associated bills
        const q = query(
            collection(db, BILLS_COLLECTION),
            where("userId", "==", userId),
            where("invoice_id", "==", id)
        );
        const billsSnapshot = await getDocs(q);
        const operations = [];
        billsSnapshot.forEach((billDoc) => {
            operations.push((batch) => batch.delete(billDoc.ref));
        });

        // 2. Delete invoice
        operations.push((batch) => batch.delete(doc(db, INVOICES_COLLECTION, id)));

        await commitInChunks(operations);
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
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
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
        const userId = getUserId();
        const supplier = await getSupplierById(id);
        if (!supplier) throw new Error("Fornecedor não encontrado.");

        const invoicesById = await getDocs(query(
            collection(db, INVOICES_COLLECTION),
            where("userId", "==", userId),
            where("supplier_id", "==", id)
        ));
        const invoicesByName = await getDocs(query(
            collection(db, INVOICES_COLLECTION),
            where("userId", "==", userId),
            where("supplier", "==", supplier.name)
        ));

        if (!invoicesById.empty || !invoicesByName.empty) {
            throw new Error("Este fornecedor possui notas vinculadas. Edite ou exclua as notas antes de remover o fornecedor.");
        }

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
        const userId = getUserId();
        const docRef = doc(db, SUPPLIERS_COLLECTION, id);
        const currentSupplierSnap = await getDoc(docRef);
        if (!currentSupplierSnap.exists()) throw new Error("Fornecedor não encontrado.");
        const currentSupplier = { id: currentSupplierSnap.id, ...currentSupplierSnap.data() };
        if (currentSupplier.userId !== userId) throw new Error("Usuário não autorizado.");

        const normalizedUpdates = { ...stripFirestoreId(updates) };
        if (normalizedUpdates.name) normalizedUpdates.name = normalizedUpdates.name.trim();

        const operations = [(batch) => batch.update(docRef, normalizedUpdates)];

        if (normalizedUpdates.name && normalizedUpdates.name !== currentSupplier.name) {
            const invoiceSnapshots = await Promise.all([
                getDocs(query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId), where("supplier_id", "==", id))),
                getDocs(query(collection(db, INVOICES_COLLECTION), where("userId", "==", userId), where("supplier", "==", currentSupplier.name)))
            ]);
            const billSnapshots = await Promise.all([
                getDocs(query(collection(db, BILLS_COLLECTION), where("userId", "==", userId), where("supplier_id", "==", id))),
                getDocs(query(collection(db, BILLS_COLLECTION), where("userId", "==", userId), where("supplier", "==", currentSupplier.name)))
            ]);

            const touched = new Set();
            invoiceSnapshots.flatMap(snapshot => snapshot.docs).forEach((invoiceDoc) => {
                if (touched.has(invoiceDoc.ref.path)) return;
                touched.add(invoiceDoc.ref.path);
                operations.push((batch) => batch.update(invoiceDoc.ref, { supplier: normalizedUpdates.name, supplier_id: id }));
            });
            billSnapshots.flatMap(snapshot => snapshot.docs).forEach((billDoc) => {
                if (touched.has(billDoc.ref.path)) return;
                touched.add(billDoc.ref.path);
                operations.push((batch) => batch.update(billDoc.ref, { supplier: normalizedUpdates.name, supplier_id: id }));
            });
        }

        await commitInChunks(operations);
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
