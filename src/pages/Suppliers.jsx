import React, { useState, useEffect } from 'react';
import { getRegisteredSuppliers, deleteSupplier } from '../services/storage';
import SupplierModal from '../components/SupplierModal';
import { Truck, Trash2, Plus, Eye, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Um fallback se formatDate nao lidar bem com ISO, mas é seguro
import { formatDate } from '../utils/format';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);
    const navigate = useNavigate();

    const loadSuppliers = async () => {
        setIsLoading(true);
        const data = await getRegisteredSuppliers();
        setSuppliers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este fornecedor? As notas antigas não sofrerão alterações, mas o nome não aparecerá mais como sugestão de auto-completar.')) {
            await deleteSupplier(id);
            loadSuppliers();
        }
    };

    return (
        <div className="page-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Fornecedores Oficiais</h2>
                    <p className="text-secondary">Gerencie a lista oficial de fornecedores do sistema.</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setSupplierToEdit(null); setIsModalOpen(true); }}>
                    <Plus size={18} />
                    <span>Novo Fornecedor</span>
                </button>
            </header>

            <div className="card table-container">
                <div className="table-responsive">
                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                            <div className="spinner" style={{ marginBottom: '1rem', display: 'inline-block' }}></div>
                            <p>Carregando...</p>
                        </div>
                    ) : (
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>Nome do Fornecedor</th>
                                    <th>Data do Cadastro</th>
                                    <th align="right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="empty-state">
                                            <div className="empty-content">
                                                <p>Nenhum fornecedor registrado</p>
                                                <span>Clique em Novo Fornecedor para cadastrar</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    suppliers.map(sup => (
                                        <tr key={sup.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Truck size={16} className="text-secondary" />
                                                    <span style={{ color: 'var(--text-primary)' }}>{sup.name}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(sup.created_at).toLocaleDateString()}</td>
                                            <td align="right" style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ color: 'var(--slate-500)', padding: '6px' }}
                                                    onClick={() => { setSupplierToEdit(sup); setIsModalOpen(true); }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ color: 'var(--primary-600)', padding: '6px' }}
                                                    onClick={() => navigate(`/suppliers/${sup.id}`)}
                                                    title="Ver Detalhes"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ color: 'var(--status-overdue)', padding: '6px' }}
                                                    onClick={() => handleDelete(sup.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Reaproveitando estilos de table do dashboard */}
                <style>{`
                    .table-container { padding: 0; overflow: hidden; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
                    .bills-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
                    .bills-table th { background-color: var(--bg-app); padding: 1rem 1.5rem; font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color); }
                    .bills-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
                    .bills-table tr:last-child td { border-bottom: none; }
                    .bills-table tr:hover { background-color: var(--bg-app); }
                    .empty-state { text-align: center; padding: 4rem; }
                    .empty-content p { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
                    .empty-content span { font-size: 0.875rem; color: var(--text-muted); }
                `}</style>
            </div>

            {isModalOpen && (
                <SupplierModal 
                    supplierToEdit={supplierToEdit}
                    onClose={() => { setIsModalOpen(false); setSupplierToEdit(null); }} 
                    onSave={() => loadSuppliers()} 
                />
            )}
        </div>
    );
};

export default Suppliers;
