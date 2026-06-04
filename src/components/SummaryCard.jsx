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
                    trend: '12.4%',
                };
            case 'success':
                return {
                    icon: <CheckCircle size={22} className="text-success" />,
                    bg: 'bg-success',
                    trend: '15.8%',
                };
            case 'danger':
                return {
                    icon: <AlertTriangle size={22} className="text-danger" />,
                    bg: 'bg-danger',
                    trend: '8.2%',
                };
            default:
                return {
                    icon: <TrendingUp size={22} className="text-primary" />,
                    bg: 'bg-primary',
                    trend: '15.8%',
                };
        }
    };

    const config = getConfig();

    return (
        <div className="card summary-card-wrapper">
            <div>
                <p className="stat-label">{title}</p>
                <p className="stat-value">
                    {formatCurrency(value)}
                </p>
                <span className="stat-trend">{config.trend}</span>
            </div>
            <div className={`icon-box ${config.bg}`}>
                {config.icon}
            </div>
        </div>
    );
};

export default SummaryCard;
