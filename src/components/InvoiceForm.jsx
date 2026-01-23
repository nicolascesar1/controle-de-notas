import React, { useState } from 'react';
import { Plus, X, Calendar, DollarSign, Package, Barcode } from 'lucide-react';

import { addDays, parseISO } from 'date-fns';

const InvoiceForm = ({ onSubmit, isLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const initialDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        supplier: '',
        invoice_number: '',
        purchase_date: today,
        firstDueDate: initialDueDate,
        total_value: '',
        installments_count: 1,
        barcode: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            // Auto-calculate first due date when purchase date changes
            if (name === 'purchase_date' && value) {
                try {
                    const purchaseDate = parseISO(value);
                    const newDueDate = addDays(purchaseDate, 30);
                    newState.firstDueDate = newDueDate.toISOString().split('T')[0];
                } catch (e) {
                    // Invalid date, ignore
                }
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
            supplier: '',
            invoice_number: '',
            purchase_date: new Date().toISOString().split('T')[0],
            firstDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            total_value: '',
            installments_count: 1,
            barcode: ''
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
                                <div className="input-with-icon">
                                    <Package size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="supplier"
                                        required
                                        placeholder="Ex: Coca-Cola, Kalunga..."
                                        value={formData.supplier}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Número da Nota</label>
                                <div className="input-with-icon">
                                    <span className="input-icon" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>#</span>
                                    <input
                                        type="text"
                                        name="invoice_number"
                                        required
                                        placeholder="000.000.000"
                                        value={formData.invoice_number}
                                        onChange={handleChange}
                                    />
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

                            <div className="form-group col-span-2">
                                <label>Código de Barras (1ª Parcela)</label>
                                <div className="input-with-icon">
                                    <Barcode size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="barcode"
                                        placeholder="Escaneie ou digite..."
                                        value={formData.barcode}
                                        onChange={handleChange}
                                    />
                                </div>
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
    );
};

export default InvoiceForm;
