import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth();

  const NAV = [
    {
      id: 'lobby',
      label: 'Lobby da Rede',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'medicos',
      label: 'Médicos',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h6m-3-3v6M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3z" />
        </svg>
      ),
    },
    {
      id: 'pacientes',
      label: 'Pacientes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M16 11h6M19 8v6" />
        </svg>
      ),
    },
    {
      id: 'consultas',
      label: 'Consultas',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
    },
  ];

  const userInitial = user?.login ? user.login[0].toUpperCase() : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src="/mediclin-logo-horizontal.png"
          alt="MediClin · Gestão Clínica"
          className="sidebar-brand-logo"
        />
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Menu Principal</div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${currentPage === n.id ? 'active' : ''}`}
            onClick={() => onNavigate(n.id)}
          >
            <span className="icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong>{user?.login || 'Usuário'}</strong>
              <span className={`badge-role badge-role-${(user?.perfil || 'RECEPCIONISTA').toLowerCase()}`}>
                {user?.perfil || 'ADMIN'}
              </span>
            </div>
            <small>Sessão Ativa</small>
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={logout}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}

