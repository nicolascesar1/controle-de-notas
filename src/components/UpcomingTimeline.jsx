import React from 'react';
import { formatCurrency } from '../utils/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UpcomingTimeline = ({ bills, onToggleStatus }) => {
    if (!bills || bills.length === 0) return null;

    return (
        <div style={{ position: 'relative', paddingLeft: '16px', paddingTop: '1rem', paddingBottom: '1rem' }}>
            {/* Linha vertical central */}
            <div style={{
                position: 'absolute',
                left: '37px', // Centro exato: 16px (padding) + 13px (left do ponto) + 9px (raio) - 1px (metade da espessura)
                top: '25px',
                bottom: '25px',
                width: '2px',
                backgroundColor: 'var(--slate-200)',
                zIndex: 0
            }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {bills.map((bill, index) => {
                    const date = parseISO(bill.due_date);
                    // Exemplo: 12 Jan, 2024
                    const formattedDate = format(date, "dd MMM, yyyy", { locale: ptBR });
                    
                    const isFirst = index === 0;

                    return (
                        <div key={bill.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 1,
                            paddingLeft: '3rem'
                        }}>
                            {/* Círculo da Timeline (Hollow Dot) */}
                            <div style={{
                                position: 'absolute',
                                left: '13px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-app)', // Fundo oco
                                border: `4px solid ${isFirst ? 'var(--slate-800)' : 'var(--slate-400)'}`,
                                zIndex: 2
                            }}></div>

                            {/* Conteúdo: Duas Colunas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                                
                                {/* Lado Esquerdo: Detalhes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-800)' }}>
                                        {bill.supplier}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                                        Parcela {bill.installment_number} • {bill.category}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'capitalize' }}>
                                        {formattedDate}
                                    </span>
                                </div>

                                {/* Lado Direito: Valor e Status */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--slate-800)' }}>
                                        {formatCurrency(bill.amount)}
                                    </span>
                                    
                                    {bill.status === 'Pending' ? (
                                        <button 
                                            onClick={() => onToggleStatus(bill.id, bill.status)}
                                            style={{
                                                background: 'var(--danger-bg)',
                                                border: 'none',
                                                color: 'var(--danger)', // Vermelho
                                                fontSize: '0.65rem',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                cursor: 'pointer',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                marginTop: '0.25rem',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.opacity = 0.8}
                                            onMouseOut={(e) => e.target.style.opacity = 1}
                                            title="Clique para marcar como pago"
                                        >
                                            Pendente
                                        </button>
                                    ) : (
                                        <span style={{
                                            color: 'var(--success)', // Verde pago
                                            fontSize: '0.65rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            padding: '0.2rem 0'
                                        }}>
                                            Pago
                                        </span>
                                    )}
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingTimeline;
