import React, { useState, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import UpcomingTimeline from '../components/UpcomingTimeline';
import { ChevronLeft, ChevronRight, Calendar, MessageCircle } from 'lucide-react';
import { formatMonthYear, formatCurrency } from '../utils/format';
import { getBills, toggleBillStatus, getInvoices } from '../services/storage';

import CashflowChart from '../components/CashflowChart';
import SupplierDonutChart from '../components/SupplierDonutChart';
import BurnRateChart from '../components/BurnRateChart';
import PaymentModal from '../components/PaymentModal';

import { useBills } from '../hooks/useBills';
import { updateBill } from '../services/storage';
import { useToast } from '../context/useToast';

const Dashboard = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [upcomingBills, setUpcomingBills] = useState([]);
    const [allGlobalBills, setAllGlobalBills] = useState([]);
    const [allGlobalInvoices, setAllGlobalInvoices] = useState([]);
    const [isUpcomingLoading, setIsUpcomingLoading] = useState(true);
    const [paymentBill, setPaymentBill] = useState(null);
    const [isPaymentSaving, setIsPaymentSaving] = useState(false);
    const toast = useToast();

    // Use Custom Hook for month summary
    const { summary, fetchBills } = useBills();

    useEffect(() => {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        fetchBills(month, year);
    }, [currentDate, fetchBills, refreshTrigger]);

    useEffect(() => {
        const loadGlobals = async () => {
            setIsUpcomingLoading(true);
            const allBills = await getBills();
            const allInv = await getInvoices();
            
            setAllGlobalBills(allBills);
            setAllGlobalInvoices(allInv);

            const pending = allBills.filter(b => b.status === 'Pending');
            pending.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            setUpcomingBills(pending.slice(0, 3));
            setIsUpcomingLoading(false);
        };
        loadGlobals();
    }, [refreshTrigger]);



    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await toggleBillStatus(id, currentStatus);
            setRefreshTrigger(prev => prev + 1);
        } catch {
            toast.error("Não foi possível atualizar o status.");
        }
    };

    const handleOpenPayment = (bill) => {
        if (bill.status === 'Pending') {
            setPaymentBill(bill);
        } else {
            handleToggleStatus(bill.id, bill.status);
        }
    };

    const handleConfirmPayment = async (paymentData) => {
        if (!paymentBill) return;
        setIsPaymentSaving(true);
        try {
            await updateBill(paymentBill.id, paymentData);
            toast.success("Pagamento registrado com sucesso.");
            setPaymentBill(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error("Não foi possível registrar o pagamento.");
        } finally {
            setIsPaymentSaving(false);
        }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleWhatsAppExport = async () => {
        const allBills = await getBills();
        const todayStr = new Date().toDateString();
        
        // Filtra todas as pendências globais onde o vencimento é <= hoje
        const targets = allBills.filter(b => {
             if (b.status === 'Paid') return false;
             const dueDate = new Date(b.due_date);
             const today = new Date();
             return dueDate <= today || dueDate.toDateString() === todayStr;
        });

        if (targets.length === 0) {
            toast.info('Nenhuma pendência para hoje.');
            return;
        }

        let text = `*Lembrete de Pagamentos - ${new Date().toLocaleDateString('pt-BR')}*\n\n`;
        let totalVal = 0;
        
        targets.forEach((b, i) => {
            text += `${i+1}. *${b.supplier}*\n`;
            text += `   Valor: ${formatCurrency(b.amount)}\n`;
            text += `   Parcela: ${b.installment_number}\n`;
            if (b.barcode) text += `   Cód: ${b.barcode}\n`;
            text += `\n`;
            totalVal += b.amount;
        });
        
        text += `*Total Deste Lote:* ${formatCurrency(totalVal)}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    };

    return (
        <>
            <header className="dashboard-header">
                <div>
                    <h2>Dashboard</h2>
                    <p className="text-secondary">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <button className="btn btn-ghost">Visão mensal</button>
                </div>
            </header>

            <div className="dashboard-controls">
                <div className="left-controls" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                         className="btn btn-ghost" 
                         onClick={handleWhatsAppExport} 
                         style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', borderColor: '#bdeedc', backgroundColor: 'var(--success-bg)' }}
                    >
                        <MessageCircle size={18} />
                        <span>Pagar Hoje</span>
                    </button>
                </div>

                <div className="month-selector">
                    <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => changeMonth(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', fontWeight: 600, minWidth: '140px', justifyContent: 'center' }}>
                        <Calendar size={18} className="text-secondary" />
                        <span style={{ textTransform: 'capitalize' }}>{formatMonthYear(currentDate)}</span>
                    </div>
                    <button className="btn-ghost" style={{ padding: '0.4rem' }} onClick={() => changeMonth(1)}>
                        <ChevronRight size={20} />
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', height: '32px', marginLeft: '0.5rem' }} onClick={goToToday}>Hoje</button>
                </div>
            </div>

            <div className="summary-grid">
                <SummaryCard title="Total do Mês" value={summary.total} />
                <SummaryCard title="Pago" value={summary.paid} type="success" />
                <SummaryCard title="A Pagar" value={summary.pending} type="warning" />
                <SummaryCard title="Vencido" value={summary.overdue} type="danger" />
            </div>

            {isUpcomingLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-400)' }}>
                    <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                    <p>Carregando dados...</p>
                </div>
            ) : (
                <>
                    {/* Linha 2 do Pareto - Operacional */}
                    <div className="dashboard-grid-linha2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.9fr) minmax(280px, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="responsive-span-2">
                            <CashflowChart bills={allGlobalBills} />
                        </div>
                        <div>
                            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>Próximas Contas a Pagar</h3>
                                    <p className="text-secondary" style={{ fontSize: '0.86rem' }}>Top 3 urgências pendentes.</p>
                                </div>
                                {upcomingBills.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                                        Nada pendente! 🎉
                                    </div>
                                ) : (
                                    <div style={{ flex: 1 }}>
                                        <UpcomingTimeline bills={upcomingBills} onToggleStatus={handleOpenPayment} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Linha 3 do Pareto - Análise Tática */}
                    <div className="dashboard-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.15fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <SupplierDonutChart bills={allGlobalBills} />
                        </div>
                        <div>
                            <BurnRateChart invoices={allGlobalInvoices} />
                        </div>
                    </div>
                </>
            )}

            {paymentBill && (
                <PaymentModal
                    bill={paymentBill}
                    onClose={() => setPaymentBill(null)}
                    onConfirm={handleConfirmPayment}
                    isSaving={isPaymentSaving}
                />
            )}
        </>
    );
};

export default Dashboard;
