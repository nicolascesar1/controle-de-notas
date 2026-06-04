import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, LogOut, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-icon">F</div>
          <h1 className="logo-text">Financeiro</h1>
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Painel</span>
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Notas Fiscais</span>
          </NavLink>


          <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Truck size={20} />
            <span>Fornecedores</span>
          </NavLink>

          <div className="nav-divider"></div>

          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Configurações</span>
          </NavLink>
        </nav>

        <div className="user-profile">
          <div className="avatar">{getInitials(user?.displayName || user?.email)}</div>
          <div className="user-info">
            <p className="user-name">{user?.displayName || 'Usuário'}</p>
            <p className="user-role">{user?.email}</p>
          </div>
          <LogOut size={16} className="logout-icon" onClick={handleLogout} title="Sair" />
        </div>
      </aside>

      <main className="main-content">
        <div className="scrollable-content">
          {children}
        </div>
      </main>

      <style>{`
        .app-shell {
          display: flex;
          height: 100vh;
          background-color: var(--bg-app);
          overflow: hidden;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 250px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          flex-shrink: 0;
        }

        .logo-area {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2.5rem;
            padding-left: 0.75rem;
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background-color: #3b82f6; /* Branding Blue */
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            font-family: sans-serif;
        }
        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
        }
        
        /* New Sidebar Link Style based on image */
        .nav-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: #64748b; /* Slate 500 */
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.2s;
            text-decoration: none;
        }
        .nav-item:hover {
            color: #3b82f6;
            background-color: #f8fafc;
        }
        .nav-item.active {
            background-color: #eff6ff; /* Blue 50 */
            color: #3b82f6; /* Blue 500 */
        }
        
        .nav-divider {
             height: 1px;
             background-color: var(--border-color);
             margin: 1rem 0;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
            margin-top: 1rem;
        }
        .avatar {
            width: 36px;
            height: 36px;
            background-color: #e2e8f0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: var(--text-secondary);
        }
        .user-info {
            flex: 1;
        }
        .user-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        .user-role {
            font-size: 0.75rem;
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
          background-color: var(--bg-app);
        }

        .scrollable-content {
            flex: 1;
            overflow-y: auto;
            padding: 2.5rem; /* More generous padding */
            width: 100%;
        }

        @media (max-width: 768px) {
            .sidebar { display: none; } /* Simples hide para mobile por enquanto */
            .scrollable-content { padding: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
