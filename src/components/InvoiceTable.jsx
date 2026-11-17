import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { parseISO, format } from 'date-fns';

const InvoiceTable = ({ invoices, onEdit, onDelete }) => {
    return (
        <div className="card table-container" style={{ padding: 0 }}>
            <div className="table-responsive">
            <table className="bills-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Fornecedor</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Data</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Valor Total</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600 }}>Parcelas</th>
                        <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--slate-500)', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {!invoices || invoices.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                                Nenhuma nota encontrada.
                            </td>
                        </tr>
                    ) : (
                        invoices.map(invoice => (
                            <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '0.5rem', background: 'var(--slate-100)', borderRadius: '8px', color: 'var(--slate-500)' }}>
                                            <Package size={20} />
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{invoice.supplier}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--slate-500)' }}>
                                    {format(parseISO(invoice.purchase_date), 'dd/MM/yyyy')}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }} className="text-primary">
                                    {formatCurrency(invoice.total_value)}
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span className="badge badge-default">{invoice.installments_count}x</span>
                                </td>
                                <td align="right" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                    {onEdit && (
                                        <button 
                                            className="btn-ghost" 
                                            style={{ color: 'var(--slate-500)', padding: '6px' }}
                                            onClick={() => onEdit(invoice)}
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button 
                                            className="btn-ghost" 
                                            style={{ color: 'var(--danger)', padding: '6px' }}
                                            onClick={() => onDelete(invoice.id)}
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
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

export default InvoiceTable;
