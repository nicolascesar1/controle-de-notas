import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSupplierById, updateSupplier, getInvoices, getBills, deleteInvoice } from '../services/storage';
import { ArrowLeft, Edit2, Save, User, Phone, Mail, FileText, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import InvoiceTable from '../components/InvoiceTable';
import EditInvoiceModal from '../components/EditInvoiceModal';

const SupplierDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({ totalPurchased: 0, balanceDue: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [editingInvoice, setEditingInvoice] = useState(null);

    const [isEditingContact, setIsEditingContact] = useState(false);
    const [contactForm, setContactForm] = useState({
        contact_name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const supData = await getSupplierById(id);
            if (!supData) {
                alert("Fornecedor não encontrado");
                navigate('/suppliers');
                return;
            }
            setSupplier(supData);
            setContactForm({
                contact_name: supData.contact_name || '',
                phone: supData.phone || '',
                email: supData.email || ''
            });

            // Load financial data
            const allInvoices = await getInvoices();
            const supInvoices = allInvoices.filter(inv => inv.supplier === supData.name);
            setInvoices(supInvoices);

            const allBills = await getBills();
            const supPendingBills = allBills.filter(b => b.supplier === supData.name && b.status === "Pending");

            const totalPurchased = supInvoices.reduce((acc, curr) => acc + (curr.total_value || 0), 0);
            const balanceDue = supPendingBills.reduce((acc, curr) => acc + (curr.amount || 0), 0);

            setStats({ totalPurchased, balanceDue });

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveContact = async () => {
        try {
            await updateSupplier(id, contactForm);
            setSupplier(prev => ({ ...prev, ...contactForm }));
            setIsEditingContact(false);
        } catch (error) {
            alert("Erro ao salvar contatos");
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (window.confirm("Atenção! Isso excluirá a nota fiscal e TODAS as parcelas associadas a ela. Continuar?")) {
            await deleteInvoice(invoiceId);
            loadData();
        }
    };

    if (isLoading) {
        return (
            <div className="p-4" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', color: 'var(--slate-500)' }}>Carregando dados do fornecedor...</p>
            </div>
        );
    }

    if (!supplier) return null;

    return (
        <div className="p-4">
            <header className="dashboard-header" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn-ghost" onClick={() => navigate('/suppliers')} style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--slate-100)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{supplier.name}</h2>
                        <p className="text-secondary">Detalhes e histórico do fornecedor</p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Contact Card */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Dados de Contato</h3>
                        {!isEditingContact ? (
                            <button className="btn-ghost" onClick={() => setIsEditingContact(true)} style={{ padding: '0.4rem', color: 'var(--primary-600)' }} title="Editar Contato">
                                <Edit2 size={16} />
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-ghost" onClick={() => setIsEditingContact(false)} style={{ padding: '0.4rem', color: 'var(--slate-500)' }} title="Cancelar">
                                    <X size={16} />
                                </button>
                                <button className="btn-primary" onClick={handleSaveContact} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                                    <Save size={14} /> Salvar
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-400)' }}><User size={18} /></div>
                            {isEditingContact ? (
                                <input 
                                    type="text" 
                                    value={contactForm.contact_name} 
                                    onChange={(e) => setContactForm({...contactForm, contact_name: e.target.value})} 
                                    placeholder="Nome do Contato"
                                    style={{ padding: '0.4rem', flex: 1 }}
                                />
                            ) : (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Contato Principal</span>
                                    <span style={{ fontWeight: 500, color: supplier.contact_name ? 'var(--text-primary)' : 'var(--slate-400)' }}>{supplier.contact_name || 'Não informado'}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-400)' }}><Phone size={18} /></div>
                            {isEditingContact ? (
                                <input 
                                    type="text" 
                                    value={contactForm.phone} 
                                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} 
                                    placeholder="Telefone / WhatsApp"
                                    style={{ padding: '0.4rem', flex: 1 }}
                                />
                            ) : (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Telefone</span>
                                    <span style={{ fontWeight: 500, color: supplier.phone ? 'var(--text-primary)' : 'var(--slate-400)' }}>{supplier.phone || 'Não informado'}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-400)' }}><Mail size={18} /></div>
                            {isEditingContact ? (
                                <input 
                                    type="email" 
                                    value={contactForm.email} 
                                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})} 
                                    placeholder="E-mail"
                                    style={{ padding: '0.4rem', flex: 1 }}
                                />
                            ) : (
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>E-mail</span>
                                    <span style={{ fontWeight: 500, color: supplier.email ? 'var(--text-primary)' : 'var(--slate-400)' }}>{supplier.email || 'Não informado'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Financial Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem' }}>
                        <div className="icon-box bg-primary" style={{ height: '4rem', width: '4rem' }}>
                            <FileText size={28} className="text-primary" />
                        </div>
                        <div>
                            <p className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Total Comprado</p>
                            <p className="stat-value" style={{ fontSize: '2rem' }}>{formatCurrency(stats.totalPurchased)}</p>
                        </div>
                    </div>

                    <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem', borderColor: stats.balanceDue > 0 ? '#fecaca' : 'var(--border-color)', backgroundColor: stats.balanceDue > 0 ? '#fef2f2' : 'var(--bg-card)' }}>
                        <div className="icon-box" style={{ height: '4rem', width: '4rem', backgroundColor: stats.balanceDue > 0 ? '#fee2e2' : 'var(--slate-100)', color: stats.balanceDue > 0 ? '#ef4444' : 'var(--slate-400)' }}>
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: stats.balanceDue > 0 ? '#ef4444' : 'var(--text-secondary)' }}>Saldo Devedor PENDENTE</p>
                            <p className="stat-value" style={{ fontSize: '2rem', color: stats.balanceDue > 0 ? '#ef4444' : 'var(--text-primary)' }}>{formatCurrency(stats.balanceDue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="section-title" style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Histórico de Compras (Notas Fiscais)</h3>
            <InvoiceTable 
                invoices={invoices} 
                onEdit={setEditingInvoice} 
                onDelete={handleDeleteInvoice} 
            />

            {editingInvoice && (
                <EditInvoiceModal
                    invoice={editingInvoice}
                    onClose={() => setEditingInvoice(null)}
                    onSave={loadData}
                />
            )}
        </div>
    );
};

export default SupplierDetails;
