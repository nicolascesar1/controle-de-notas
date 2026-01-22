import React from 'react';
import { Package, Search, Filter } from 'lucide-react';

const Invoices = () => {
    return (
        <div className="p-4">
            <header className="page-header">
                <h2 className="page-heading">Notas Fiscais</h2>
                <button className="btn btn-primary">
                    + Nova Nota
                </button>
            </header>

            {/* Filters Toolbar */}
            <div className="toolbar-card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Buscar por Fornecedor ou Nº da Nota" />
                </div>

                <button className="btn-filter">
                    <Filter size={18} />
                    <span>Filtrar por Data</span>
                </button>
            </div>

            {/* Placeholder Table */}
            <div className="card table-container">
                <table className="bills-table">
                    <thead>
                        <tr>
                            <th>Fornecedor</th>
                            <th>Nº Nota</th>
                            <th>Data da Compra</th>
                            <th>Valor Total</th>
                            <th>Parcelas</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="supplier-cell">
                                <div className="supplier-info">
                                    <span className="supplier-name">Amazon Web Services</span>
                                </div>
                            </td>
                            <td>INV-2023-001</td>
                            <td>24/10/2023</td>
                            <td className="amount-cell text-primary">R$ 1.200,00</td>
                            <td><span className="badge-pill">12x</span></td>
                            <td><span className="badge badge-paid">Pago</span></td>
                        </tr>
                        <tr>
                            <td className="supplier-cell">
                                <div className="supplier-info">
                                    <span className="supplier-name">Papelaria Exemplo</span>
                                </div>
                            </td>
                            <td>INV-2023-002</td>
                            <td>22/10/2023</td>
                            <td className="amount-cell text-primary">R$ 450,00</td>
                            <td><span className="badge-pill">1x</span></td>
                            <td><span className="badge badge-pending">Pendente</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{`
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        .page-heading { font-size: 1.5rem; color: var(--text-primary); font-weight: 700; }
        
        .toolbar-card {
            background-color: var(--bg-card);
            padding: 1rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--shadow-sm);
        }
        .search-box {
            flex: 1;
            position: relative;
        }
        .search-icon {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }
        .search-box input {
            padding-left: 2.5rem;
        }
        .btn-filter {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0 1rem;
            background-color: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .table-container { padding: 0; overflow: hidden; }
        .bills-table { width: 100%; text-align: left; border-collapse: collapse; }
        .bills-table th { padding: 1rem 1.5rem; background: var(--bg-app); color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; }
        .bills-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
        .supplier-name { font-weight: 600; }
        .amount-cell { font-weight: 600; }
        .text-primary { color: var(--primary); }
        
        .badge-pill {
            background-color: var(--primary-light);
            color: var(--primary);
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 0.75rem;
            font-weight: 600;
        }
      `}</style>
        </div>
    );
};

export default Invoices;
