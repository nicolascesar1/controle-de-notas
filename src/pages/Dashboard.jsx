import React, { useState, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import BillList from '../components/BillList';
import InvoiceForm from '../components/InvoiceForm';
import { createInvoice } from '../services/storage';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '../utils/format';
import { addDays, parseISO } from 'date-fns';

import { useBills } from '../hooks/useBills';

const Dashboard = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use Custom Hook
    const { bills, isLoading, summary, fetchBills, toggleStatus } = useBills();

    useEffect(() => {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        fetchBills(month, year);
    }, [currentDate, fetchBills]);

    const handleCreateInvoice = async (formData) => {
        setIsSubmitting(true);
        try {
            await createInvoice(formData);

            // Logic: The first bill is created 30 days after purchase, OR uses the manual date
            const purchaseDate = parseISO(formData.purchase_date);

            // Priority to manual date if set
            let firstDueDate;
            if (formData.firstDueDate) {
                firstDueDate = parseISO(formData.firstDueDate);
            } else {
                firstDueDate = addDays(purchaseDate, 30);
            }

            // Switch view to the month of the first installment
            if (firstDueDate.getMonth() !== currentDate.getMonth() || firstDueDate.getFullYear() !== currentDate.getFullYear()) {
                setCurrentDate(firstDueDate);
            } else {
                // Refresh current view
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                fetchBills(month, year);
            }

            alert(`Nota salva com sucesso! A primeira parcela vence em ${firstDueDate.toLocaleDateString('pt-BR')}.`);

        } catch (error) {
            console.error(error);
            alert("Erro ao criar Nota Fiscal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const success = await toggleStatus(id, currentStatus);
        if (!success) {
            alert("Não foi possível atualizar o status.");
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

    return (
        <>
            <header className="dashboard-header">
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Visão Geral</h2>
                    <p className="text-secondary">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </header>

            <div className="dashboard-controls">
                <div className="left-controls">
                    <InvoiceForm onSubmit={handleCreateInvoice} isLoading={isSubmitting} />
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

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="section-title">Contas do Mês</h3>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--slate-400)' }}>
                    <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                    <p>Carregando dados...</p>
                </div>
            ) : (
                <BillList bills={bills} onToggleStatus={toggleStatus} onRefresh={fetchBills} />
            )}
        </>
    );
};

export default Dashboard;
