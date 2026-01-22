import React from 'react';
import { Wallet, CreditCard } from 'lucide-react';

const Banks = () => {
    return (
        <div>
            <header className="page-header">
                <h2 className="page-heading">Contas Bancárias</h2>
                <button className="btn btn-primary">+ Adicionar Conta</button>
            </header>

            <div className="banks-grid">
                <div className="card bank-card">
                    <div className="bank-icon blue">
                        <Wallet size={24} />
                    </div>
                    <div className="bank-info">
                        <h3>Conta Principal</h3>
                        <p className="balance">R$ 12.450,00</p>
                        <p className="bank-name">Nubank</p>
                    </div>
                </div>

                <div className="card bank-card">
                    <div className="bank-icon orange">
                        <CreditCard size={24} />
                    </div>
                    <div className="bank-info">
                        <h3>Cartão Corporativo</h3>
                        <p className="balance negative">- R$ 3.200,00</p>
                        <p className="bank-name">Inter</p>
                    </div>
                </div>
            </div>

            <style>{`
        .page-header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 2rem; 
        }
        .page-heading { font-size: 1.5rem; color: var(--text-primary); font-weight: 700; }
        
        .banks-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .bank-card {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }
        .bank-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
        }
        .bank-icon.blue { background-color: var(--primary); }
        .bank-icon.orange { background-color: var(--status-pending); }
        
        .bank-info h3 { font-size: 1rem; color: var(--text-secondary); font-weight: 500; }
        .balance { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0.25rem 0; }
        .balance.negative { color: var(--status-overdue); }
        .bank-name { font-size: 0.875rem; color: var(--text-muted); }
      `}</style>
        </div>
    );
};

export default Banks;
