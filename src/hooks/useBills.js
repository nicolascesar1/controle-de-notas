import { useState, useCallback } from 'react';
import { getBillsByMonth, toggleBillStatus } from '../services/storage';
import { parseISO, isBefore, startOfDay } from 'date-fns';

export const useBills = () => {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });

    const calculateSummary = useCallback((data) => {
        const total = data.reduce((acc, bill) => acc + bill.amount, 0);

        const paid = data
            .filter(b => b.status === 'Paid')
            .reduce((acc, bill) => acc + bill.amount, 0);

        const pending = total - paid;

        // Check for overdue. We compare bill due_date against today.
        // due_date in storage is ISO string.
        const today = startOfDay(new Date());

        const overdue = data
            .filter(b => {
                if (b.status !== 'Pending') return false;
                const dueDate = parseISO(b.due_date);
                // isBefore(dateToCompare, dateToCompareAgainst)
                // If dueDate is before today, it's overdue
                return isBefore(dueDate, today);
            })
            .reduce((acc, bill) => acc + bill.amount, 0);

        setSummary({ total, paid, pending, overdue });
    }, []);

    const fetchBills = useCallback(async (month, year) => {
        setIsLoading(true);
        try {
            const data = await getBillsByMonth(month, year);
            setBills(data);
            calculateSummary(data);
        } catch (error) {
            console.error("Error fetching bills:", error);
        } finally {
            setIsLoading(false);
        }
    }, [calculateSummary]);

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = await toggleBillStatus(id, currentStatus);

            // Optimistic update or refetch? Optimistic usually better for UX
            setBills(prevBills => {
                const updatedBills = prevBills.map(bill =>
                    bill.id === id ? { ...bill, status: newStatus } : bill
                );
                calculateSummary(updatedBills);
                return updatedBills;
            });

            return true;
        } catch (error) {
            console.error("Error toggling status", error);
            return false;
        }
    };

    return {
        bills,
        isLoading,
        summary,
        fetchBills,
        toggleStatus
    };
};
