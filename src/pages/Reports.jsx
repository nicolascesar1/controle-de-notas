import React, { useState, useEffect } from 'react';
import { getBills } from '../services/storage';
import { formatCurrency } from '../utils/format';
import { parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import FilterBar from '../components/FilterBar';

const Reports = () => {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const data = await getBills();
            setBills(data);
            setFilteredBills(data);
        };
        loadData();
    }, []);

    const handleFilterChange = (filters) => {
        let result = bills;

        // Filter by Supplier
        if (filters.supplier) {
            const term = filters.supplier.toLowerCase();
            result = result.filter(bill =>
                bill.supplier.toLowerCase().includes(term)
            );
        }

        // Filter by Date Range (Due Date for bills)
        if (filters.startDate || filters.endDate) {
            result = result.filter(bill => {
                const date = parseISO(bill.due_date);
                const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : new Date(0);
                const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : new Date(8640000000000000);

                return isWithinInterval(date, { start, end });
            });
        }

        setFilteredBills(result);
    };

    // Calculate Charts Data
    const total = filteredBills.reduce((acc, bill) => acc + bill.amount, 0);
    const paid = filteredBills.filter(b => b.status === "Paid").reduce((acc, bill) => acc + bill.amount, 0);
    const pending = total - paid;

    // Monthly Breakdown
    const monthlyData = filteredBills.reduce((acc, bill) => {
        const monthKey = format(parseISO(bill.due_date), 'MM/yyyy');
        if (!acc[monthKey]) acc[monthKey] = 0;
        acc[monthKey] += bill.amount;
        return acc;
    }, {});

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const [ma, ya] = a.split('/');
        const [mb, yb] = b.split('/');
        return new Date(ya, ma - 1) - new Date(yb, mb - 1);
    });

    const maxMonthlyValue = Math.max(...Object.values(monthlyData), 1);

    return (
        <div className="p-4">
            <header className="dashboard-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Relatórios Financeiros</h2>
                    <p className="text-secondary">Análise de despesas (Contas a Pagar)</p>
                </div>
            </header>

            <FilterBar onFilterChange={handleFilterChange} />

            <div className="grid-reports">
                {/* Summary Pie Chart Equivalent */}
                <div className="card">
                    <h3 className="section-title">Status dos Pagamentos</h3>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="pie-chart-container">
                            <div className="pie-segment" style={{
                                background: `conic-gradient(var(--success) 0% ${(paid / total) * 100}%, var(--warning) ${(paid / total) * 100}% 100%)`
                            }}></div>
                            <div className="pie-center"></div>
                        </div>
                        <div className="legend">
                            <div className="legend-item">
                                <span className="dot" style={{ backgroundColor: 'var(--success)' }}></span>
                                <div>
                                    <p className="legend-label">Pago</p>
                                    <p className="legend-value">{formatCurrency(paid)}</p>
                                </div>
                            </div>
                            <div className="legend-item">
                                <span className="dot" style={{ backgroundColor: 'var(--warning)' }}></span>
                                <div>
                                    <p className="legend-label">Pendente</p>
                                    <p className="legend-value">{formatCurrency(pending)}</p>
                                </div>
                            </div>
                            <div className="legend-item" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                <div>
                                    <p className="legend-label">Total Filtrado</p>
                                    <p className="legend-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(total)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Bar Chart */}
                <div className="card">
                    <h3 className="section-title">Evolução Mensal</h3>
                    {sortedMonths.length === 0 ? (
                        <p className="text-secondary text-center">Nenhum dado para o período.</p>
                    ) : (
                        <div className="bar-chart">
                            {sortedMonths.map(month => (
                                <div key={month} className="bar-group">
                                    <div className="bar-wrapper">
                                        <div
                                            className="bar"
                                            style={{ height: `${(monthlyData[month] / maxMonthlyValue) * 100}%` }}
                                            title={formatCurrency(monthlyData[month])}
                                        ></div>
                                    </div>
                                    <span className="bar-label">{month}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .grid-reports {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 1.5rem;
                }
                
                /* Pie Chart */
                .pie-chart-container {
                    position: relative;
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                }
                .pie-segment {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                }
                .pie-center {
                    position: absolute;
                    inset: 40px;
                    background: white;
                    border-radius: 50%;
                }
                
                .legend { display: flex; flex-direction: column; gap: 1rem; }
                .legend-item { display: flex; align-items: flex-start; gap: 0.75rem; }
                .dot { width: 12px; height: 12px; border-radius: 50%; margin-top: 4px; }
                .legend-label { font-size: 0.875rem; color: var(--text-secondary); }
                .legend-value { font-weight: 700; color: var(--text-primary); }

                /* Bar Chart */
                .bar-chart {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-around;
                    height: 250px;
                    gap: 1rem;
                    padding-top: 2rem;
                }
                .bar-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }
                .bar-wrapper {
                    flex: 1;
                    width: 100%;
                    max-width: 40px;
                    background-color: var(--slate-100);
                    border-radius: 8px 8px 0 0;
                    position: relative;
                    display: flex;
                    align-items: flex-end;
                }
                .bar {
                    width: 100%;
                    background-color: var(--primary-500);
                    border-radius: 8px 8px 0 0;
                    transition: height 0.5s ease;
                }
                .bar:hover { background-color: var(--primary-600); }
                .bar-label { font-size: 0.75rem; color: var(--text-secondary); }
                
                @media (max-width: 768px) {
                    .grid-reports { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
