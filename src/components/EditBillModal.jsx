import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Package, Barcode, Save } from 'lucide-react';
import { updateBill } from '../services/storage';

const EditBillModal = ({ bill, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        supplier: '',
        due_date: '',
        amount: '',
        barcode: ''
    });

    useEffect(() => {
        if (bill) {
            setFormData({
                supplier: bill.supplier || '',
                due_date: bill.due_date ? new Date(bill.due_date).toISOString().split('T')[0] : '',
                amount: bill.amount || '',
                barcode: bill.barcode || ''
            });
        }
    }, [bill]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updates = {
                ...formData,
                amount: parseFloat(formData.amount),
                due_date: new Date(formData.due_date).toISOString()
            };

            await updateBill(bill.id, updates);
            onSave(); // Notify parent to refresh
            onClose();
        } catch (error) {
            console.error("Failed to update bill", error);
            alert("Erro ao salvar alterações.");
        }
    };

    if (!bill) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-content">
                <div className="modal-header">
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Editar Parcela</h3>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            {bill.installment_number ? `Parcela ${bill.installment_number}` : 'Detalhes da conta'}
                        </p>
                    </div>
                    <button className="btn-ghost" onClick={onClose} style={{ padding: '0.5rem', borderRadius: '50%' }}>
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
                                        value={formData.supplier}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Vencimento</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} className="input-icon" />
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Valor</label>
                                <div className="input-with-icon">
                                    <DollarSign size={18} className="input-icon" />
                                    <input
                                        type="number"
                                        name="amount"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group col-span-2">
                                <label>Código de Barras</label>
                                <div className="input-with-icon">
                                    <Barcode size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        placeholder="Código de barras..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} />
                            <span>Salvar Alterações</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBillModal;
