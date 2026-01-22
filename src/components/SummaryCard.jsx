import React from 'react';
import { formatCurrency } from '../utils/format';
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const SummaryCard = ({ title, value, type = 'neutral' }) => {
    const getConfig = () => {
        switch (type) {
            case 'warning':
                return {
                    icon: <Clock size={22} className="text-warning" />,
                    bg: 'bg-warning',
                    color: 'text-warning'
                };
            case 'success':
                return {
                    icon: <CheckCircle size={22} className="text-success" />,
                    bg: 'bg-success',
                    color: 'text-success'
                };
            case 'danger':
                return {
                    icon: <AlertTriangle size={22} className="text-danger" />,
                    bg: 'bg-danger',
                    color: 'text-danger'
                };
            default:
                return {
                    icon: <TrendingUp size={22} className="text-primary" />,
                    bg: 'bg-primary',
                    color: 'text-primary'
                };
        }
    };

    const config = getConfig();

    return (
        <div className="card summary-card">
            <div className={`icon-wrapper ${config.bg}`}>
                {config.icon}
            </div>
            <div className="card-content">
                <span className="card-title">{title}</span>
                <div className="card-value">
                    {formatCurrency(value)}
                </div>
            </div>

            <style>{`
        .summary-card {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            padding: 1.5rem;
            border: 1px solid var(--border-color);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        .icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .card-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .card-title {
            color: var(--text-secondary);
            font-size: 0.875rem;
            font-weight: 500;
        }
        .card-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.025em;
        }

        /* Colors based on CSS variables */
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary-light); }
        
        .text-warning { color: var(--status-pending); }
        .bg-warning { background-color: var(--status-pending-bg); }
        
        .text-success { color: var(--status-paid); }
        .bg-success { background-color: var(--status-paid-bg); }

        .text-danger { color: var(--status-overdue); }
        .bg-danger { background-color: var(--status-overdue-bg); }
      `}</style>
        </div>
    );
};

export default SummaryCard;
