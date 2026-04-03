import React, { useState, useEffect } from 'react';
import { X, Calendar, Package } from 'lucide-react';
import { getRegisteredSuppliers, updateInvoice } from '../services/storage';

const EditInvoiceModal = ({ invoice, onClose, onSave }) => {
    const [supplier, setSupplier] = useState(invoice.supplier || '');
    const [purchaseDate, setPurchaseDate] = useState(invoice.purchase_date || '');
    const [suppliersList, setSuppliersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getRegisteredSuppliers().then(setSuppliersList);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateInvoice(invoice.id, { supplier, purchase_date: purchaseDate });
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Editar Nota Fiscal</h3>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            Atualize as informações do comprovante.
                        </p>
                    </div>
                    <button type="button" className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Fornecedor</label>
                            <div className="input-with-icon">
                                <Package size={18} className="input-icon" />
                                <select
                                    required
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                    style={{ paddingLeft: '2.5rem' }}
                                >
                                    <option value="" disabled>Selecione um fornecedor...</option>
                                    {suppliersList.map((sup) => (
                                        <option key={sup.id} value={sup.name}>{sup.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Data da Compra</label>
                            <div className="input-with-icon">
                                <Calendar size={18} className="input-icon" />
                                <input
                                    type="date"
                                    required
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditInvoiceModal;
