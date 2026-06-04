import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { addDays, parseISO, isWithinInterval, startOfDay, format } from 'date-fns';
import { formatCurrency } from '../utils/format';

const CashflowChart = ({ bills }) => {
    // Definimos janela dos próximos 15 dias
    const today = startOfDay(new Date());
    const windowEnd = addDays(today, 14);

    const dataMap = {};
    for (let i = 0; i < 15; i++) {
        const date = addDays(today, i);
        dataMap[format(date, 'yyyy-MM-dd')] = {
            dateStr: format(date, 'dd/MM'),
            value: 0,
            hasOverdue: false
        }
    }

    bills.forEach(b => {
        if (b.status === 'Paid') return;
        const due = startOfDay(parseISO(b.due_date));
        
        // Contas atrasadas ou vencendo hoje jogamos todas na barra de "Hoje" para o grito de alerta.
        if (due <= today) {
            dataMap[format(today, 'yyyy-MM-dd')].value += b.amount;
            if (due < today) {
                dataMap[format(today, 'yyyy-MM-dd')].hasOverdue = true;
            }
        } else if (isWithinInterval(due, { start: today, end: windowEnd })) {
            const key = format(due, 'yyyy-MM-dd');
            if (dataMap[key]) {
                dataMap[key].value += b.amount;
            }
        }
    });

    const data = Object.keys(dataMap).sort().map(k => dataMap[k]);

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Projeção de Sangria (15 Dias)</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Antecipe os gargalos de caixa a curto prazo.</p>
            </div>
            
            <div style={{ flex: 1, minHeight: '260px', marginLeft: '-1.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <XAxis 
                            dataKey="dateStr" 
                            tick={{ fontSize: 11, fill: 'var(--slate-500)' }} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            tickFormatter={(val) => `R$ ${val}`} 
                            tick={{ fontSize: 11, fill: 'var(--slate-400)' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                        />
                        <Tooltip 
                            formatter={(val) => formatCurrency(val)} 
                            labelStyle={{ color: 'var(--slate-500)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}
                            itemStyle={{ color: 'var(--slate-900)', fontWeight: 600 }}
                            cursor={{ fill: 'var(--primary-50)' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.hasOverdue && index === 0 ? 'var(--danger)' : 'var(--primary-500)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CashflowChart;
