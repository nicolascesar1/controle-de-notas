import React from 'react';
import { PieChart, BarChart } from 'lucide-react';

const Reports = () => {
    return (
        <div>
            <header className="page-header">
                <h2 className="page-heading">Relatórios Financeiros</h2>
            </header>

            <div className="grid-placeholder">
                <div className="card report-card">
                    <div className="chart-placeholder">
                        <PieChart size={48} className="text-muted" />
                        <p>Gráfico de Despesas por Categoria</p>
                    </div>
                </div>
                <div className="card report-card">
                    <div className="chart-placeholder">
                        <BarChart size={48} className="text-muted" />
                        <p>Evolução Mensal</p>
                    </div>
                </div>
            </div>

            <style>{`
        .page-header { margin-bottom: 2rem; }
        .page-heading { font-size: 1.5rem; color: var(--text-primary); font-weight: 700; }
        
        .grid-placeholder {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .report-card {
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .chart-placeholder {
            text-align: center;
            color: var(--text-muted);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .text-muted { color: var(--text-muted); }
      `}</style>
        </div>
    );
};

export default Reports;
