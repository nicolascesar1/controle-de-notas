import React, { useState } from 'react';
import { X, Truck, User, Phone, Mail } from 'lucide-react';
import { addSupplier, updateSupplier } from '../services/storage';

const SupplierModal = ({ onClose, onSave, supplierToEdit }) => {
    const [name, setName] = useState(supplierToEdit?.name || '');
    const [contactName, setContactName] = useState(supplierToEdit?.contact_name || '');
    const [phone, setPhone] = useState(supplierToEdit?.phone || '');
    const [email, setEmail] = useState(supplierToEdit?.email || '');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getErrorMessage = (err) => {
        if (err?.code === 'permission-denied') {
            return 'Sem permissão para salvar. Saia e entre novamente na sua conta.';
        }
        if (err?.code === 'unavailable') {
            return 'Não foi possível conectar ao banco de dados. Verifique sua internet.';
        }
        return err?.message || 'Não foi possível salvar o fornecedor.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = { contact_name: contactName, phone, email };
            
            if (supplierToEdit) {
                await updateSupplier(supplierToEdit.id, { name, ...formData });
                if (onSave) onSave();
            } else {
                const newSupplier = await addSupplier(name, formData);
                if (onSave) onSave(newSupplier);
            }
            onClose();
        } catch (err) {
             setError(getErrorMessage(err));
        } finally {
             setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <div className="modal-content" style={{ maxWidth: '400px', zIndex: 1100 }}>
                <div className="modal-header">
                    <div>
                        <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>
                            {supplierToEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                        </h3>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            {supplierToEdit ? 'Atualize as informações do fornecedor.' : 'Cadastre um novo fornecedor oficial.'}
                        </p>
                    </div>
                    <button type="button" className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && <div style={{ color: 'var(--status-overdue)', fontSize: '0.85rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px' }}>{error}</div>}
                        
                        <div className="form-group">
                            <label>Nome do Fornecedor</label>
                            <div className="input-with-icon">
                                <Truck size={18} className="input-icon" />
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ex: Coca-Cola"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Contato Principal</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Ex: João da Silva"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Telefone / WhatsApp</label>
                            <div className="input-with-icon">
                                <Phone size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Ex: (00) 00000-0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>E-mail</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="contato@fornecedor.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;
