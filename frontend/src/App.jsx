import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { LobbyPage } from './pages/LobbyPage';
import { MedicosPage } from './pages/MedicosPage';
import { PacientesPage } from './pages/PacientesPage';
import { ConsultasPage } from './pages/ConsultasPage';
import { AuditoriaPage } from './pages/AuditoriaPage';

export function App() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState('lobby');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const titles = {
    lobby: 'Portal & Mural da Rede Hospitalar',
    dashboard: 'Painel Geral e Indicadores Clínicos',
    medicos: 'Gerenciamento de Médicos',
    pacientes: 'Gerenciamento de Pacientes',
    consultas: 'Agendamento e Gestão de Consultas',
    auditoria: 'Auditoria & Rastreabilidade (LGPD)',
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <div className="main" style={{ flex: 1 }}>
        <Topbar title={titles[currentPage] || 'MediClin'} />

        <main className="content">
          {currentPage === 'lobby' && <LobbyPage onNavigate={setCurrentPage} />}
          {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
          {currentPage === 'medicos' && <MedicosPage showToast={showToast} />}
          {currentPage === 'pacientes' && <PacientesPage showToast={showToast} />}
          {currentPage === 'consultas' && <ConsultasPage showToast={showToast} />}
          {currentPage === 'auditoria' && isAdmin && <AuditoriaPage showToast={showToast} />}
        </main>
      </div>

      <Toast msg={toast} />
    </div>
  );
}

export default App;

