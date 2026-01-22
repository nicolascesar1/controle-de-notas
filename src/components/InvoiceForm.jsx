import React, { useState } from 'react';
import { Plus, X, Calendar, DollarSign, Package, Barcode } from 'lucide-react';

const InvoiceForm = ({ onSubmit, isLoading }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        supplier: '',
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        total_value: '',
        installments_count: 1,
        barcode: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare payload
        const payload = {
            ...formData,
            total_value: parseFloat(formData.total_value),
            installments_count: parseInt(formData.installments_count)
        };

        // Call parent handler and wait for it
        // O parent (Dashboard) deve retornar a Promise do createInvoice
        await onSubmit(payload);

        // Se chegou aqui (sem erro), fecha e limpa
        setIsExpanded(false);
        setFormData({
            supplier: '',
            invoice_number: '',
            purchase_date: new Date().toISOString().split('T')[0],
            total_value: '',
            installments_count: 1,
            barcode: ''
        });
    };

    if (!isExpanded) {
        return (
            <div className="new-invoice-trigger">
                <button className="btn btn-primary trigger-btn" onClick={() => setIsExpanded(true)}>
                    <Plus size={18} />
                    <span>Nova Nota Fiscal</span>
                </button>
            </div>
        );
    }

    return (
        <div className="form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsExpanded(false) }}>
            <div className="card invoice-form-modal">
                <div className="form-header">
                    <div>
                        <h3 className="form-title">Nova Nota Fiscal</h3>
                        <p className="form-subtitle">Preencha os dados da nota para gerar as parcelas.</p>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setIsExpanded(false)}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group span-full">
                            <label>Fornecedor</label>
                            <div className="input-wrapper">
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
                            <div className="input-wrapper">
                                <span className="input-icon text-muted">#</span>
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
                            <div className="input-wrapper">
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
                            <label>Valor Total</label>
                            <div className="input-wrapper">
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

                        <div className="form-group span-full">
                            <label>Código de Barras (1ª Parcela)</label>
                            <div className="input-wrapper">
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

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setIsExpanded(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? (
                                <span>Processando...</span>
                            ) : (
                                <span>Gerar Contas</span>
                            )}
                        </button>
                    </div>
                </form>

                <style>{`
            .new-invoice-trigger {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 2rem;
            }
            .form-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(2px);
                padding: 1rem;
            }
            .invoice-form-modal {
                width: 100%;
                max-width: 600px;
                animation: scaleIn 0.2s ease-out;
            }
            @keyframes scaleIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .form-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 2rem;
            }
            .form-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 0.25rem;
            }
            .form-subtitle {
                color: var(--text-muted);
                font-size: 0.875rem;
            }
            .btn-close {
                color: var(--text-muted);
                padding: 0.5rem;
                border-radius: 50%;
            }
            .btn-close:hover { background-color: var(--bg-app); color: var(--text-primary); }
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            .span-full { grid-column: span 2; }
            
            .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
            .form-group label {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--text-secondary);
            }
            
            .input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }
            .input-icon {
                position: absolute;
                left: 1rem;
                color: var(--text-muted);
                pointer-events: none;
            }
            .input-wrapper input, .input-wrapper select {
                padding-left: 2.75rem; /* Space for icon */
            }
            .text-muted { color: var(--text-muted); font-weight: 600; font-size: 1.1rem;}

            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                padding-top: 1.5rem;
                border-top: 1px solid var(--border-color);
            }
            .btn-ghost {
                background: transparent;
                color: var(--text-secondary);
            }
            .btn-ghost:hover { background-color: var(--bg-app); }
            
            @media (max-width: 600px) {
                .form-grid { grid-template-columns: 1fr; }
                .span-full { grid-column: span 1; }
            }
        `}</style>
            </div>
        </div>
    );
};

export default InvoiceForm;
