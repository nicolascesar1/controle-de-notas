import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../utils/format';

const SupplierDonutChart = ({ bills }) => {
    // Pegamos todas as contas PENDENTES para ver a quem mais devemos na vida
    const pendingBills = bills.filter(b => b.status === 'Pending');
    
    const supplierTotals = {};
    pendingBills.forEach(b => {
        const sup = b.supplier || 'Desconhecido';
        supplierTotals[sup] = (supplierTotals[sup] || 0) + b.amount;
    });

    // Ordenar do maior para o menor débito
    const sortedArray = Object.keys(supplierTotals)
        .map(sup => ({ name: sup, value: supplierTotals[sup] }))
        .sort((a, b) => b.value - a.value);

    // Formando o Top 5 e "Outros"
    const top5 = sortedArray.slice(0, 5);
    const others = sortedArray.slice(5).reduce((acc, curr) => acc + curr.value, 0);

    let data = [...top5];
    if (others > 0) {
        data.push({ name: 'Outros', value: others });
    }

    // Corporate Blue Palette
    const COLORS = ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Concentração de Débito (Top 5)</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Perfil das suas dívidas em aberto.</p>
            </div>

            {data.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                    Nada pendente!
                </div>
            ) : (
                <div style={{ flex: 1, minHeight: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(val) => formatCurrency(val)} 
                                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                                itemStyle={{ color: 'var(--slate-900)', fontWeight: 600 }}
                            />
                            <Legend 
                                iconType="circle" 
                                wrapperStyle={{ fontSize: '0.75rem', color: 'var(--slate-500)' }} 
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default SupplierDonutChart;
