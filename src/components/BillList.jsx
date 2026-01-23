import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../utils/format';
import { CheckCircle, Circle, Copy, MoreHorizontal, Edit2 } from 'lucide-react';
import EditBillModal from './EditBillModal';

const BillList = ({ bills, onToggleStatus, onRefresh }) => {
  const [editingBill, setEditingBill] = useState(null);

  const getStatusBadge = (status, dueDate) => {
    // ... existing code ...
    const isOverdue = status === 'Pending' && new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString();

    if (status === 'Paid') {
      return (
        <span className="badge badge-paid">
          <CheckCircle size={12} />
          Pago
        </span>
      );
    }
    if (isOverdue) {
      return <span className="badge badge-overdue">Vencido</span>;
    }
    return <span className="badge badge-pending">Pendente</span>;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Idealmente usar um toast aqui
  };

  const handleSaveEdit = () => {
    setEditingBill(null);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <div className="card table-container">
        <div className="table-responsive">
          <table className="bills-table">
            <thead>
              <tr>
                <th>Situação</th>
                <th>Vencimento</th>
                <th>Fornecedor</th>
                <th>Cód. Barras</th>
                <th>Parcela</th>
                <th>Valor</th>
                <th align="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <div className="empty-content">
                      <p>Nenhuma conta para este mês</p>
                      <span>Adicione uma nota fiscal para começar</span>
                    </div>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className={bill.status === 'Paid' ? 'row-dimmed' : ''}>
                    <td className="status-cell">{getStatusBadge(bill.status, bill.due_date)}</td>
                    <td className="date-cell">
                      <div className="date-wrapper">
                        <span className="day">{new Date(bill.due_date).getDate()}</span>
                        <span className="month">{new Date(bill.due_date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                        <span className="year">{new Date(bill.due_date).getFullYear()}</span>
                      </div>
                    </td>
                    <td className="supplier-cell">
                      <div className="supplier-info">
                        <span className="supplier-name">{bill.supplier}</span>
                        <span className="supplier-sub">Nota Fiscal</span>
                      </div>
                    </td>
                    <td>
                      {bill.barcode ? (
                        <div className="barcode-badge" onClick={() => copyToClipboard(bill.barcode)} title={bill.barcode}>
                          <Copy size={12} />
                          <span className="barcode-text">
                            {bill.barcode.slice(0, 4)}...{bill.barcode.slice(-4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-placeholder">-</span>
                      )}
                    </td>
                    <td className="installment-cell">{bill.installment_number}</td>
                    <td className="amount-cell">{formatCurrency(bill.amount)}</td>
                    <td align="right">
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn-icon"
                          title="Editar"
                          onClick={() => setEditingBill(bill)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`action-btn ${bill.status === 'Paid' ? 'undo' : 'pay'}`}
                          onClick={() => onToggleStatus(bill.id, bill.status)}
                        >
                          {bill.status === 'Paid' ? "Desfazer" : "Pagar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <style>{`
        /* ... existing styles ... */
        .table-container {
            padding: 0;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }
        /* New styles for icon button */
        /* New styles for icon button */
        .action-btn-icon {
            padding: 6px;
            border-radius: 6px;
            color: var(--text-secondary);
            background-color: var(--slate-100); /* Force background */
            border: 1px solid var(--border-color); /* Force border */
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            width: 32px; /* Fixed width */
            height: 32px; /* Fixed height */
        }
        .action-btn-icon:hover {
            background-color: var(--primary-100);
            border-color: var(--primary);
            color: var(--primary);
        }

        .table-responsive {
          overflow-x: auto;
        }
        .bills-table {
          width: 100%;
          border-collapse: separate; 
          border-spacing: 0;
          text-align: left;
        }
        .bills-table th {
          background-color: var(--bg-app);
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
        }
        .bills-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
          vertical-align: middle;
        }
        .bills-table tr:last-child td {
          border-bottom: none;
        }
        .bills-table tr:hover {
          background-color: var(--bg-app);
        }
        
        .supplier-info { display: flex; flex-direction: column; }
        .supplier-name { font-weight: 600; color: var(--text-primary); }
        .supplier-sub { font-size: 0.75rem; color: var(--text-muted); }

        .date-cell .date-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: var(--bg-app);
            padding: 4px 8px;
            border-radius: 6px;
            width: fit-content;
            border: 1px solid var(--border-color);
        }
        .date-wrapper .day { font-weight: 700; font-size: 0.9rem; line-height: 1; }
        .date-wrapper .month { font-size: 0.7rem; color: var(--status-overdue); text-transform: uppercase; font-weight: 700; }
        .date-wrapper .year { display: none; }

        .barcode-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: var(--bg-app);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            cursor: pointer;
            border: 1px solid var(--border-color);
            transition: all 0.2s;
        }
        .barcode-badge:hover {
            border-color: var(--primary);
            color: var(--primary);
            background-color: var(--primary-light);
        }
        
        .amount-cell {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        .action-btn {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .action-btn.pay {
            background-color: var(--text-primary);
            color: white;
        }
        .action-btn.pay:hover { opacity: 0.9; }
        .action-btn.undo {
            background-color: transparent;
            color: var(--text-muted);
            border: 1px solid var(--border-color);
        }
        .action-btn.undo:hover {
            border-color: var(--status-overdue);
            color: var(--status-overdue);
        }

        .empty-state {
            text-align: center;
            padding: 4rem;
        }
        .empty-content p { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .empty-content span { font-size: 0.875rem; color: var(--text-muted); }

        .row-dimmed {
            opacity: 0.6;
            background-color: #fafafa;
        }
        .text-placeholder { color: var(--text-muted); font-size: 0.8rem; }
      `}</style>
      </div>

      {editingBill && (
        <EditBillModal
          bill={editingBill}
          onClose={() => setEditingBill(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

export default BillList;
