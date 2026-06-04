import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, CalendarDays, FileText, LayoutDashboard, Loader2, LogOut, Menu, Search, Settings, Truck, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { getBills, getInvoices, getRegisteredSuppliers } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/format';

const navItems = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, section: 'Geral' },
  { to: '/invoices', label: 'Notas', icon: FileText, section: 'Geral' },
  { to: '/suppliers', label: 'Fornecedores', icon: Truck, section: 'Geral' },
  { to: '/settings', label: 'Configurações', icon: Settings, section: 'Suporte' }
];

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const statusLabel = (status) => status === 'Paid' ? 'Pago' : 'Pendente';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchData, setSearchData] = useState({ invoices: [], bills: [], suppliers: [] });

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      return;
    }

    let isMounted = true;

    Promise.all([getInvoices(), getBills(), getRegisteredSuppliers()])
      .then(([invoices, bills, suppliers]) => {
        if (!isMounted) return;
        setSearchData({ invoices, bills, suppliers });
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Erro na busca global:', error);
        setSearchError('Não foi possível buscar agora. Verifique sua conexão e tente novamente.');
      })
      .finally(() => {
        if (isMounted) setSearchLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  const searchResults = useMemo(() => {
    const query = normalizeText(searchTerm.trim());
    if (query.length < 2) return { invoices: [], bills: [], suppliers: [] };

    const includesTerm = (...values) => values.some((value) => normalizeText(value).includes(query));

    return {
      invoices: searchData.invoices
        .filter((invoice) => includesTerm(
          invoice.supplier,
          invoice.category,
          invoice.barcode,
          invoice.total_value,
          invoice.purchase_date
        ))
        .slice(0, 5),
      bills: searchData.bills
        .filter((bill) => includesTerm(
          bill.supplier,
          bill.category,
          bill.barcode,
          bill.installment_number,
          statusLabel(bill.status),
          bill.amount,
          bill.due_date
        ))
        .slice(0, 5),
      suppliers: searchData.suppliers
        .filter((supplier) => includesTerm(
          supplier.name,
          supplier.contact_name,
          supplier.phone,
          supplier.email
        ))
        .slice(0, 5)
    };
  }, [searchData, searchTerm]);

  const totalResults = searchResults.invoices.length + searchResults.bills.length + searchResults.suppliers.length;
  const shouldSearch = searchTerm.trim().length >= 2;
  const isSearchLoading = shouldSearch && searchLoading;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goToResult = (path) => {
    setSearchOpen(false);
    setSearchTerm('');
    navigate(path);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const renderNavigation = (variant = 'sidebar') => {
    const groupedItems = navItems.reduce((groups, item) => {
      groups[item.section] = [...(groups[item.section] || []), item];
      return groups;
    }, {});

    return Object.entries(groupedItems).map(([section, items]) => (
      <React.Fragment key={`${variant}-${section}`}>
        <p className="nav-section">{section}</p>
        {items.map((item) => (
          <NavLink
            key={`${variant}-${item.to}`}
            to={item.to}
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOpen(false);
            }}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {React.createElement(item.icon, { size: 17 })}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </React.Fragment>
    ));
  };

  const renderSearchSection = (title, items, renderItem) => {
    if (items.length === 0) return null;
    return (
      <div className="search-section">
        <p className="search-section-title">{title}</p>
        {items.map(renderItem)}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <aside className="sidebar">
          <div className="logo-area">
            <div className="logo-icon">N</div>
            <h1 className="logo-text">Controle de Notas</h1>
          </div>

          <nav className="nav-menu">
            {renderNavigation()}
          </nav>

          <div className="team-card">
            <div className="team-badge">M</div>
            <div>
              <p className="team-title">Equipe</p>
              <p className="team-name">Financeiro</p>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu">
              <Menu size={20} />
            </button>

            <div className="topbar-search" onFocus={() => setSearchOpen(true)}>
              <Search size={16} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  const nextTerm = event.target.value;
                  setSearchTerm(nextTerm);
                  setSearchError('');
                  setSearchLoading(nextTerm.trim().length >= 2);
                  setSearchOpen(true);
                }}
                placeholder="Buscar notas, parcelas e fornecedores"
                aria-label="Busca global"
              />
              {isSearchLoading ? <Loader2 size={15} className="spin-icon" /> : <kbd>Ctrl + F</kbd>}

              {searchOpen && (
                <div className="global-search-panel">
                  {searchTerm.trim().length < 2 ? (
                    <div className="search-empty">
                      Digite pelo menos 2 caracteres para buscar.
                    </div>
                  ) : searchError ? (
                    <div className="search-error">
                      <AlertCircle size={16} />
                      <span>{searchError}</span>
                    </div>
                  ) : isSearchLoading ? (
                    <div className="search-empty">
                      Buscando registros...
                    </div>
                  ) : totalResults === 0 ? (
                    <div className="search-empty">
                      Nenhum resultado encontrado.
                    </div>
                  ) : (
                    <>
                      {renderSearchSection('Notas', searchResults.invoices, (invoice) => (
                        <button key={invoice.id} className="search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => goToResult('/invoices')}>
                          <span className="search-result-icon"><FileText size={15} /></span>
                          <span>
                            <strong>{invoice.supplier || 'Fornecedor não informado'}</strong>
                            <small>{formatCurrency(Number(invoice.total_value || 0))} · {invoice.purchase_date ? formatDate(new Date(invoice.purchase_date)) : 'Sem data'} · {invoice.category || 'Sem categoria'}</small>
                          </span>
                        </button>
                      ))}

                      {renderSearchSection('Parcelas', searchResults.bills, (bill) => (
                        <button key={bill.id} className="search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => goToResult('/')}>
                          <span className="search-result-icon"><CalendarDays size={15} /></span>
                          <span>
                            <strong>{bill.supplier || 'Fornecedor não informado'} · {bill.installment_number || 'Parcela'}</strong>
                            <small>{formatCurrency(Number(bill.amount || 0))} · vence em {bill.due_date ? formatDate(new Date(bill.due_date)) : 'data não informada'} · {statusLabel(bill.status)}</small>
                          </span>
                        </button>
                      ))}

                      {renderSearchSection('Fornecedores', searchResults.suppliers, (supplier) => (
                        <button key={supplier.id} className="search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => goToResult(`/suppliers/${supplier.id}`)}>
                          <span className="search-result-icon"><Truck size={15} /></span>
                          <span>
                            <strong>{supplier.name || 'Fornecedor sem nome'}</strong>
                            <small>{supplier.contact_name || supplier.phone || supplier.email || 'Sem contato informado'}</small>
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="topbar-actions">
              <button className="icon-button" title="Calendário"><CalendarDays size={15} /></button>
              <button className="icon-button" title="Notificações"><Bell size={15} /></button>
              <div className="user-profile">
                <div className="avatar">{getInitials(user?.displayName || user?.email)}</div>
                <div className="user-info">
                  <p className="user-name">{user?.displayName || 'Usuário'}</p>
                  <p className="user-role">{user?.email || 'Conta empresarial'}</p>
                </div>
                <LogOut size={15} className="logout-icon" onClick={handleLogout} title="Sair" />
              </div>
            </div>
          </header>

          <div className="scrollable-content">
            {children}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer-layer">
          <button className="mobile-drawer-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="mobile-drawer">
            <div className="mobile-drawer-header">
              <div className="logo-area mobile-logo">
                <div className="logo-icon">N</div>
                <h1 className="logo-text">Controle de Notas</h1>
              </div>
              <button className="icon-button" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu">
                <X size={18} />
              </button>
            </div>
            <nav className="nav-menu mobile-nav-menu">
              {renderNavigation('mobile')}
            </nav>
          </aside>
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {navItems.slice(0, 3).map((item) => (
          <NavLink
            key={`bottom-${item.to}`}
            to={item.to}
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOpen(false);
            }}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {React.createElement(item.icon, { size: 19 })}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-item" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={19} />
          <span>Menu</span>
        </button>
      </nav>

      <style>{`
        .app-shell {
          display: flex;
          height: 100vh;
          width: 100vw;
          padding: 0;
          background: var(--bg-app);
          overflow: hidden;
        }

        .app-frame {
          width: 100%;
          height: 100%;
          display: flex;
          overflow: hidden;
          background: var(--bg-page);
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .sidebar {
          width: 236px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 1.15rem 0.8rem;
          flex-shrink: 0;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            margin-bottom: 1.5rem;
            padding: 0.5rem 0.65rem;
        }
        .logo-icon {
            width: 26px;
            height: 26px;
            background: var(--primary-500);
            color: white;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.82rem;
            font-family: sans-serif;
        }
        .logo-text {
            font-size: 1rem;
            font-weight: 800;
            color: var(--primary-600);
        }

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            flex: 1;
        }
        .nav-section {
            margin: 1.1rem 0 0.45rem;
            padding: 0 0.65rem;
            color: var(--text-muted);
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.65rem 0.7rem;
            border-radius: 6px;
            color: var(--text-secondary);
            font-weight: 700;
            font-size: 0.84rem;
            transition: all 0.2s;
            text-decoration: none;
        }
        .nav-item:hover {
            color: var(--primary-600);
            background-color: var(--primary-50);
        }
        .nav-item.active {
            background: var(--slate-100);
            color: var(--text-primary);
        }

        .team-card {
            display: flex;
            align-items: center;
            gap: 0.55rem;
            margin-top: 1rem;
            padding: 0.7rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--slate-50);
        }
        .team-badge {
            width: 28px;
            height: 28px;
            display: grid;
            place-items: center;
            border-radius: 6px;
            background: #0bbfba;
            color: white;
            font-size: 0.76rem;
            font-weight: 800;
        }
        .team-title {
            font-size: 0.72rem;
            color: var(--text-muted);
        }
        .team-name {
            font-size: 0.8rem;
            color: var(--text-primary);
            font-weight: 800;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-left: 0.5rem;
        }
        .avatar {
            width: 32px;
            height: 32px;
            background: #fff0df;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: var(--accent-gold);
            font-size: 0.76rem;
        }
        .user-info {
            flex: 1;
        }
        .user-name {
            font-size: 0.8rem;
            font-weight: 800;
            color: var(--text-primary);
        }
        .user-role {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.72rem;
            color: var(--text-muted);
        }
        .logout-icon {
            color: var(--text-muted);
            cursor: pointer;
        }
        .logout-icon:hover { color: var(--status-overdue); }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: var(--bg-page);
        }

        .topbar {
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0 1.2rem;
          background: #ffffff;
          border-bottom: 1px solid var(--border-color);
        }
        .mobile-menu-button {
          display: none;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid var(--border-color);
          border-radius: 7px;
          background: white;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .topbar-search {
          width: min(300px, 40vw);
          height: 36px;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.82rem;
          background: #ffffff;
          position: relative;
        }
        .topbar-search:focus-within {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(89, 71, 246, 0.08);
        }
        .topbar-search input {
          min-height: 0;
          height: 100%;
          padding: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.86rem;
        }
        .topbar-search input:focus {
          border: 0;
          box-shadow: none;
          background: transparent;
        }
        .topbar-search kbd {
          margin-left: auto;
          border: 0;
          color: var(--text-muted);
          font-size: 0.7rem;
          font-family: inherit;
          white-space: nowrap;
        }
        .spin-icon {
          animation: spin 0.75s linear infinite;
          color: var(--primary-500);
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .global-search-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: min(560px, 88vw);
          max-height: min(520px, calc(100vh - 86px));
          overflow-y: auto;
          padding: 0.55rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: white;
          box-shadow: var(--shadow-lg);
          z-index: 50;
        }
        .search-section + .search-section {
          margin-top: 0.45rem;
          padding-top: 0.45rem;
          border-top: 1px solid var(--border-color);
        }
        .search-section-title {
          padding: 0.4rem 0.45rem 0.3rem;
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .search-result {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.65rem;
          border: 0;
          border-radius: 7px;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .search-result:hover {
          background: var(--slate-100);
        }
        .search-result-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 7px;
          background: var(--primary-50);
          color: var(--primary-600);
        }
        .search-result strong {
          display: block;
          color: var(--text-primary);
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1.3;
        }
        .search-result small {
          display: block;
          margin-top: 0.12rem;
          color: var(--text-muted);
          font-size: 0.76rem;
          line-height: 1.35;
        }
        .search-empty,
        .search-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 76px;
          padding: 1rem;
          color: var(--text-muted);
          font-size: 0.86rem;
        }
        .search-error {
          color: var(--danger);
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .icon-button {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
        }
        .icon-button:hover {
          background: var(--slate-100);
          color: var(--text-primary);
        }

        .scrollable-content {
            flex: 1;
            overflow-y: auto;
            padding: 1.2rem;
            width: 100%;
            max-width: none;
            margin: 0 auto;
        }

        .mobile-drawer-layer,
        .mobile-bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
            .sidebar { display: none; }
            .main-content { padding-bottom: 66px; }
            .topbar {
              height: auto;
              min-height: 64px;
              padding: 0.75rem;
              gap: 0.65rem;
            }
            .mobile-menu-button { display: grid; flex-shrink: 0; }
            .topbar-search {
              width: auto;
              flex: 1;
              min-width: 0;
              height: 40px;
            }
            .topbar-search kbd { display: none; }
            .global-search-panel {
              position: fixed;
              top: 64px;
              left: 0.75rem;
              right: 0.75rem;
              width: auto;
              max-height: calc(100vh - 150px);
            }
            .topbar-actions {
              gap: 0.15rem;
            }
            .topbar-actions .icon-button {
              display: none;
            }
            .user-info { display: none; }
            .user-profile { padding-left: 0; }
            .logout-icon { display: none; }
            .scrollable-content { padding: 0.9rem; }
            .mobile-drawer-layer {
              display: block;
              position: fixed;
              inset: 0;
              z-index: 80;
            }
            .mobile-drawer-backdrop {
              position: absolute;
              inset: 0;
              border: 0;
              background: rgba(16, 19, 26, 0.38);
            }
            .mobile-drawer {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              width: min(312px, 86vw);
              display: flex;
              flex-direction: column;
              padding: 0.85rem;
              background: white;
              border-right: 1px solid var(--border-color);
              box-shadow: var(--shadow-xl);
            }
            .mobile-drawer-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.75rem;
              margin-bottom: 0.75rem;
            }
            .mobile-logo {
              margin: 0;
              padding: 0.35rem 0;
            }
            .mobile-nav-menu {
              overflow-y: auto;
              padding-bottom: 1rem;
            }
            .mobile-bottom-nav {
              position: fixed;
              left: 0;
              right: 0;
              bottom: 0;
              height: 66px;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.15rem;
              padding: 0.45rem 0.55rem calc(0.45rem + env(safe-area-inset-bottom));
              border-top: 1px solid var(--border-color);
              background: rgba(255, 255, 255, 0.96);
              backdrop-filter: blur(14px);
              z-index: 60;
            }
            .bottom-nav-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.15rem;
              min-width: 0;
              border: 0;
              border-radius: 7px;
              background: transparent;
              color: var(--text-muted);
              text-decoration: none;
              font-size: 0.68rem;
              font-weight: 750;
              cursor: pointer;
            }
            .bottom-nav-item.active {
              background: var(--primary-50);
              color: var(--primary-600);
            }
            .bottom-nav-item span {
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
        }
      `}</style>
    </div>
  );
};

export default Layout;
