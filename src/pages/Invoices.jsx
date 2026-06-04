import React, { useState, useEffect } from 'react';
import { getInvoices, createInvoice, deleteInvoice } from '../services/storage';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import FilterBar from '../components/FilterBar';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceTable from '../components/InvoiceTable';
import EditInvoiceModal from '../components/EditInvoiceModal';
import { useConfirm } from '../context/useConfirm';
import { useToast } from '../context/useToast';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState(null);
    const { confirm } = useConfirm();
    const toast = useToast();

    const loadInvoices = async () => {
        const data = await getInvoices();
        setInvoices(data);
        setFilteredInvoices(data);
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const handleCreateInvoice = async (formData) => {
        setIsSubmitting(true);
        try {
            await createInvoice(formData);
            toast.success("Nota fiscal salva e parcelas geradas.");
            await loadInvoices();
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível criar a nota fiscal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        const confirmed = await confirm({
            title: "Excluir nota fiscal?",
            message: "Isso também excluirá todas as parcelas vinculadas a esta nota.",
            confirmLabel: "Excluir"
        });
        if (confirmed) {
            await deleteInvoice(invoiceId);
            toast.success("Nota fiscal excluída.");
            loadInvoices();
        }
    };

    const handleFilterChange = (filters) => {
        let result = invoices;

        // Filter by Supplier
        if (filters.supplier) {
            const term = filters.supplier.toLowerCase();
            result = result.filter(inv =>
                inv.supplier.toLowerCase().includes(term) ||
                (inv.invoice_number && inv.invoice_number.includes(term))
            );
        }

        // Filter by Date Range
        if (filters.startDate || filters.endDate) {
            result = result.filter(inv => {
                const date = parseISO(inv.purchase_date);
                const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : new Date(0);
                const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : new Date(8640000000000000);

                return isWithinInterval(date, { start, end });
            });
        }

        setFilteredInvoices(result);
    };

    return (
        <div className="p-4">
            <header className="dashboard-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Notas Fiscais</h2>
                    <p className="text-secondary">Gerencie e adicione suas notas</p>
                </div>
                <div>
                    <InvoiceForm onSubmit={handleCreateInvoice} isLoading={isSubmitting} />
                </div>
            </header>

            <FilterBar onFilterChange={handleFilterChange} />

            {/* Table */}
            <InvoiceTable 
                invoices={filteredInvoices} 
                onEdit={setEditingInvoice} 
                onDelete={handleDeleteInvoice} 
            />

            {editingInvoice && (
                <EditInvoiceModal
                    invoice={editingInvoice}
                    onClose={() => setEditingInvoice(null)}
                    onSave={loadInvoices}
                />
            )}
        </div>
    );
};

export default Invoices;
