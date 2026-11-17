import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, DollarSign, Package } from 'lucide-react';
import { getRegisteredSuppliers } from '../services/storage';
import SupplierModal from './SupplierModal';

import { addMonths, parseISO } from 'date-fns';

const getDefaultDates = () => {
    const purchaseDate = new Date();
    const firstDueDate = addMonths(purchaseDate, 1);
    return {
        purchase_date: purchaseDate.toISOString().split('T')[0],
        firstDueDate: firstDueDate.toISOString().split('T')[0]
    };
};

const InvoiceForm = ({ onSubmit, isLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        if (isExpanded) {
            getRegisteredSuppliers().then(setSuppliers);
        }
    }, [isExpanded]);

    const handleSaveSupplier = (newSupplier) => {
        getRegisteredSuppliers().then(setSuppliers);
        setFormData(prev => ({
            ...prev,
            supplier_id: newSupplier.id,
            supplier: newSupplier.name
        }));
    };

    const [formData, setFormData] = useState({
        ...getDefaultDates(),
        supplier_id: '',
        supplier: '',
        total_value: '',
        installments_count: 1
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            // Auto-calculate first due date when purchase date changes
            if (name === 'purchase_date' && value) {
                try {
                    const purchaseDate = parseISO(value);
                    const newDueDate = addMonths(purchaseDate, 1);
                    newState.firstDueDate = newDueDate.toISOString().split('T')[0];
                } catch {
                    // Invalid date, ignore
                }
            }

            if (name === 'supplier_id') {
                const selectedSupplier = suppliers.find((sup) => sup.id === value);
                newState.supplier = selectedSupplier?.name || '';
            }

            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            total_value: parseFloat(formData.total_value),
            installments_count: parseInt(formData.installments_count)
        };

        await onSubmit(payload);

        setIsExpanded(false);
        setFormData({
            ...getDefaultDates(),
            supplier_id: '',
            supplier: '',
            total_value: '',
            installments_count: 1
        });
    };

    if (!isExpanded) {
        return (
            <div>
                <button className="btn btn-primary" onClick={() => setIsExpanded(true)}>
                    <Plus size={18} />
                    <span>Nova Nota Fiscal</span>
                </button>
            </div>
        );
    }

    return (
        <>
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsExpanded(false) }}>
            <div className="modal-content">
                <div className="modal-header">
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Nova Nota Fiscal</h3>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Preencha os dados da nota para gerar as parcelas.</p>
                    </div>
                    <button type="button" className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => setIsExpanded(false)}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group col-span-2">
                                <label>Fornecedor</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <div className="input-with-icon" style={{ flex: 1 }}>
                                        <Package size={18} className="input-icon" />
                                        <select
                                            name="supplier_id"
                                            required
                                            value={formData.supplier_id}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '2.5rem' }}
                                        >
                                            <option value="" disabled>Selecione um fornecedor...</option>
                                            {suppliers.map((sup) => (
                                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn btn-ghost" 
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', height: '42px', width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '0.375rem' }}
                                        onClick={() => setIsSupplierModalOpen(true)}
                                        title="Novo Fornecedor Rápido"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>


                            <div className="form-group">
                                <label>Data da Compra</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} className="input-icon" />
                                    <input
                                        type="date"
                                        name="purchase_date"
                                        required
                                        value={formData.purchase_date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ color: 'var(--primary-600)' }}>Vencimento 1ª Parcela</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} className="input-icon" style={{ color: 'var(--primary-600)' }} />
                                    <input
                                        type="date"
                                        name="firstDueDate"
                                        required
                                        value={formData.firstDueDate}
                                        onChange={handleChange}
                                        style={{ borderColor: 'var(--primary-200)', backgroundColor: 'var(--primary-50)' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Valor Total</label>
                                <div className="input-with-icon">
                                    <DollarSign size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        name="total_value"
                                        step="0.01"
                                        min="0"
                                        required
                                        placeholder="0,00"
                                        value={formData.total_value}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Parcelamento</label>
                                <select
                                    name="installments_count"
                                    value={formData.installments_count}
                                    onChange={handleChange}
                                >
                                    <option value="1">1x - À Vista</option>
                                    <option value="2">2x Parcelas</option>
                                    <option value="3">3x Parcelas</option>
                                    <option value="4">4x Parcelas</option>
                                    <option value="5">5x Parcelas</option>
                                </select>
                            </div>

                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={() => setIsExpanded(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Processando...' : 'Gerar Contas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {isSupplierModalOpen && (
             <SupplierModal 
                 onClose={() => setIsSupplierModalOpen(false)} 
                 onSave={handleSaveSupplier} 
             />
        )}
        </>
    );
};

export default InvoiceForm;
