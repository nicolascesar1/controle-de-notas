import React, { useState, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import BillList from '../components/BillList';
import InvoiceForm from '../components/InvoiceForm';
import { createInvoice, getBillsByMonth, toggleBillStatus } from '../services/firestore';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '../utils/format';

// import { addDays } from 'date-fns';

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const Dashboard = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const data = await getBillsByMonth(month, year);
            setBills(data);
            calculateSummary(data);
        } catch (error) {
            console.error("Erro ao carregar boletos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateSummary = (data) => {
        const total = data.reduce((acc, bill) => acc + bill.amount, 0);
        const paid = data.filter(b => b.status === 'Paid').reduce((acc, bill) => acc + bill.amount, 0);
        const pending = total - paid;
        const overdue = data.filter(b => b.status === 'Pending' && new Date(b.due_date) < new Date()).reduce((acc, bill) => acc + bill.amount, 0);

        setSummary({ total, paid, pending, overdue });
    };

    useEffect(() => {
        fetchBills();
    }, [currentDate]);

    const handleCreateInvoice = async (formData) => {
        setIsSubmitting(true);
        try {
            await createInvoice(formData);

            // Logic: The first bill is created 30 days after purchase
            const [year, month, day] = formData.purchase_date.split('-');
            const purchaseDate = new Date(year, month - 1, day);
            const firstDueDate = addDays(purchaseDate, 30);

            // Switch view to the month of the first installment
            if (firstDueDate.getMonth() !== currentDate.getMonth() || firstDueDate.getFullYear() !== currentDate.getFullYear()) {
                setCurrentDate(firstDueDate);
            } else {
                await fetchBills();
            }

            // Feedback to user
            alert(`Nota salva com sucesso! A primeira parcela vence em ${firstDueDate.toLocaleDateString('pt-BR')}.`);

        } catch (error) {
            console.error(error);
            alert("Erro ao criar Nota Fiscal.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = await toggleBillStatus(id, currentStatus);
            const updatedBills = bills.map(bill =>
                bill.id === id ? { ...bill, status: newStatus } : bill
            );
            setBills(updatedBills);
            calculateSummary(updatedBills);
        } catch (error) {
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
            <header className="page-header">
                <h2 className="page-heading">Visão Geral</h2>
                <div className="header-actions">
                    <span className="current-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </header>

            <div className="dashboard-controls">
                <div className="left-controls">
                    <InvoiceForm onSubmit={handleCreateInvoice} isLoading={isSubmitting} />
                </div>

                <div className="month-selector">
                    <button className="btn-icon" onClick={() => changeMonth(-1)}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="current-month-display">
                        <Calendar size={18} className="text-secondary" />
                        <span>{formatMonthYear(currentDate)}</span>
                    </div>
                    <button className="btn-icon" onClick={() => changeMonth(1)}>
                        <ChevronRight size={20} />
                    </button>
                    <button className="btn-tiny" onClick={goToToday}>Hoje</button>
                </div>
            </div>

            <div className="summary-grid">
                <SummaryCard title="Total do Mês" value={summary.total} />
                <SummaryCard title="Pago" value={summary.paid} type="success" />
                <SummaryCard title="A Pagar" value={summary.pending} type="warning" />
                <SummaryCard title="Vencido" value={summary.overdue} type="danger" />
            </div>

            <div className="section-header">
                <h3 className="section-title">Contas do Mês</h3>
            </div>

            {isLoading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Carregando dados...</p>
                </div>
            ) : (
                <BillList bills={bills} onToggleStatus={handleToggleStatus} />
            )}

            <style>{`
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        .page-heading { font-size: 1.5rem; color: var(--text-primary); }
        
        .dashboard-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .month-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--bg-card);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }
        .current-month-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 160px;
            justify-content: center;
            font-weight: 600;
            color: var(--text-primary);
            text-transform: capitalize;
            padding: 0 0.5rem;
        }
        .btn-icon {
          background: transparent;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }
        .btn-icon:hover { background-color: var(--bg-app); color: var(--primary); }
        .btn-tiny {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            background-color: var(--bg-app);
            color: var(--text-secondary);
            border-radius: 4px;
        }
        .btn-tiny:hover { color: var(--primary); }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .section-header { margin-bottom: 1.25rem; }
        .section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        .loading-state {
            text-align: center;
            padding: 4rem;
            color: var(--text-muted);
        }
        .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid var(--border-color);
            border-top-color: var(--primary);
            border-radius: 50%;
            margin: 0 auto 1rem;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .text-secondary { color: var(--text-secondary); }
      `}</style>
        </>
    );
};

export default Dashboard;
