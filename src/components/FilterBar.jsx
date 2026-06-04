import React, { useState } from 'react';
import { Search, Calendar, X } from 'lucide-react';

const FilterBar = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        supplier: '',
        startDate: '',
        endDate: '',
        status: 'all'
    });

    // Internal state to control whether advanced filters are visible
    // In this premium design, we show primary filters inline

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const reset = { supplier: '', startDate: '', endDate: '', status: 'all' };
        setFilters(reset);
        onFilterChange(reset);
    };

    return (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={18} className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)', left: '0.75rem', position: 'absolute', color: 'var(--slate-400)' }} />
                    <input
                        type="text"
                        name="supplier"
                        placeholder="Buscar Fornecedor..."
                        value={filters.supplier}
                        onChange={handleChange}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                {/* Date Range Start */}
                <div style={{ position: 'relative', flex: '0 1 180px' }}>
                    <Calendar size={18} className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)', left: '0.75rem', position: 'absolute', color: 'var(--slate-400)' }} />
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleChange}
                        placeholder="Data Inicial"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                {/* Date Range End */}
                <div style={{ position: 'relative', flex: '0 1 180px' }}>
                    <Calendar size={18} className="input-icon" style={{ top: '50%', transform: 'translateY(-50%)', left: '0.75rem', position: 'absolute', color: 'var(--slate-400)' }} />
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleChange}
                        placeholder="Data Final"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                {/* Clear Button */}
                {(filters.supplier || filters.startDate || filters.endDate) && (
                    <button className="btn btn-ghost" onClick={clearFilters} style={{ color: 'var(--danger)' }}>
                        <X size={18} />
                        Limpar
                    </button>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
