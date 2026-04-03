import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, Legend } from 'recharts';
import { parseISO, format, getMonth, getYear, getDate } from 'date-fns';
import { formatCurrency } from '../utils/format';

const BurnRateChart = ({ invoices }) => {
    // Pegamos a data atual para referenciar Mês Atual e Mês Anterior
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Matemática simples para mês anterior (se for janeiro, o mês anterior é dezembro do ano passado)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Criar matriz de 1 a 31 dias
    const daysData = {};
    for (let i = 1; i <= 31; i++) {
        daysData[i] = { day: i, current: 0, previous: 0 };
    }

    // Acumular valores baseados na data de COMPRA (purchase_date) da nota fiscal
    invoices.forEach(inv => {
        const date = parseISO(inv.purchase_date);
        const dMonth = getMonth(date);
        const dYear = getYear(date);
        const dDay = getDate(date);

        if (dMonth === currentMonth && dYear === currentYear) {
            daysData[dDay].current += inv.total_value || 0;
        } else if (dMonth === prevMonth && dYear === prevYear) {
            daysData[dDay].previous += inv.total_value || 0;
        }
    });

    // Converter para Acumulativo (Soma Cúmputo ao longo do mês)
    let accCurrent = 0;
    let accPrev = 0;
    const data = [];

    // So vamos popular até o dia atual no array "current", pra linha não cair pra 0 no futuro.
    const todayDay = today.getDate();

    for (let i = 1; i <= 31; i++) {
        accPrev += daysData[i].previous;
        
        let point = {
            day: i,
            Anterior: accPrev
        };

        if (i <= todayDay) {
            accCurrent += daysData[i].current;
            point.Atual = accCurrent;
        }

        data.push(point);
    }

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Ritmo de Compras (Acumulado)</h3>
                <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Mês atual vs Mês anterior.</p>
            </div>

            <div style={{ flex: 1, minHeight: '260px', marginLeft: '-1.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 11, fill: 'var(--slate-500)' }} 
                            axisLine={false} 
                            tickLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            tickFormatter={(val) => `R$ ${val/1000}k`} 
                            tick={{ fontSize: 11, fill: 'var(--slate-400)' }}
                            axisLine={false}
                            tickLine={false}
                            dx={-10}
                        />
                        <Tooltip 
                            formatter={(val) => formatCurrency(val)}
                            labelFormatter={(label) => `Dia ${label}`}
                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
                            itemStyle={{ fontWeight: 600 }}
                        />
                        <Legend 
                            iconType="circle" 
                            wrapperStyle={{ fontSize: '0.75rem', color: 'var(--slate-500)' }} 
                        />
                        <Line type="monotone" dataKey="Atual" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Anterior" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BurnRateChart;
