import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { getInvoices } from '../services/storage';
import { formatCurrency } from '../utils/format';
import { parseISO, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import FilterBar from '../components/FilterBar';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);

    useEffect(() => {
        const loadInvoices = async () => {
            const data = await getInvoices();
            setInvoices(data);
            setFilteredInvoices(data);
        };
        loadInvoices();
    }, []);

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
                    <p className="text-secondary">Gerencie suas notas importadas</p>
                </div>
            </header>

            <FilterBar onFilterChange={handleFilterChange} />

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Fornecedor</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Nº Nota</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Data</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Valor Total</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Parcelas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                                    Nenhuma nota encontrada com os filtros selecionados.
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.5rem', background: 'var(--slate-100)', borderRadius: '8px', color: 'var(--slate-500)' }}>
                                                <Package size={20} />
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{invoice.supplier}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--slate-500)' }}>{invoice.invoice_number || '-'}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--slate-500)' }}>
                                        {format(parseISO(invoice.purchase_date), 'dd/MM/yyyy')}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }} className="text-primary">
                                        {formatCurrency(invoice.total_value)}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span className="badge badge-default">{invoice.installments_count}x</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Invoices;
