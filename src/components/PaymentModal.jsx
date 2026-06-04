import React, { useState } from 'react';
import { formatISO } from 'date-fns';
import { Calendar, DollarSign, FileText, Wallet, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

const todayInputValue = () => new Date().toISOString().split('T')[0];

const PaymentModal = ({ bill, onClose, onConfirm, isSaving }) => {
    const [formData, setFormData] = useState({
        paid_at: todayInputValue(),
        paid_amount: bill?.amount || '',
        payment_method: 'Pix',
        payment_note: ''
    });

    if (!bill) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onConfirm({
            status: 'Paid',
            paid_at: formatISO(new Date(`${formData.paid_at}T12:00:00`)),
            paid_amount: parseFloat(formData.paid_amount),
            payment_method: formData.payment_method,
            payment_note: formData.payment_note.trim()
        });
    };

    return (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <div className="modal-content" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Registrar pagamento</h3>
                        <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                            {bill.supplier} · Parcela {bill.installment_number} · {formatCurrency(bill.amount)}
                        </p>
                    </div>
                    <button type="button" className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Data do pagamento</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} className="input-icon" />
                                    <input type="date" name="paid_at" value={formData.paid_at} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Valor pago</label>
                                <div className="input-with-icon">
                                    <DollarSign size={18} className="input-icon" />
                                    <input type="number" name="paid_amount" min="0" step="0.01" value={formData.paid_amount} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-group col-span-2">
                                <label>Forma de pagamento</label>
                                <div className="input-with-icon">
                                    <Wallet size={18} className="input-icon" />
                                    <select name="payment_method" value={formData.payment_method} onChange={handleChange} style={{ paddingLeft: '2.5rem' }}>
                                        <option>Pix</option>
                                        <option>Boleto</option>
                                        <option>Cartão</option>
                                        <option>Dinheiro</option>
                                        <option>Transferência</option>
                                        <option>Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group col-span-2">
                                <label>Observação</label>
                                <div className="input-with-icon">
                                    <FileText size={18} className="input-icon" />
                                    <input name="payment_note" value={formData.payment_note} onChange={handleChange} placeholder="Opcional" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Confirmar pagamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
