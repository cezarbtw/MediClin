import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatarDataAuditoria, foiRegistroAlterado } from '../components/AuditInfo';

const ENTIDADE_LABELS = {
  TODAS: 'Todas as Entidades',
  MEDICO: 'Médicos',
  PACIENTE: 'Pacientes',
  CONSULTA: 'Consultas',
  PRONTUARIO: 'Prontuários',
  USUARIO: 'Usuários',
};

const ENTIDADE_BADGE_CLASS = {
  MEDICO: 'badge-indigo',
  PACIENTE: 'badge-green',
  CONSULTA: 'badge-amber',
  PRONTUARIO: 'badge-role-medico',
  USUARIO: 'badge-role-admin',
};

export function AuditoriaPage({ showToast }) {
  const { user, isAdmin } = useAuth();
  const [painel, setPainel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entidadeFiltro, setEntidadeFiltro] = useState('TODAS');
  const [busca, setBusca] = useState('');

  const loadAuditoria = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entidadeFiltro && entidadeFiltro !== 'TODAS') {
        params.set('entidade', entidadeFiltro);
      }
      if (busca.trim()) {
        params.set('usuario', busca.trim());
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get(`/auditoria${query}`);
      setPainel(data);
    } catch (err) {
      setPainel({
        totalRegistros: 0,
        alteradosUltimas24h: 0,
        entidadesModificadas: 0,
        porEntidade: {},
        registros: [],
      });
      if (showToast) {
        showToast(err.message || 'Não foi possível carregar os registros de auditoria.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, entidadeFiltro, busca, showToast]);

  useEffect(() => {
    loadAuditoria();
  }, [loadAuditoria]);

  if (!isAdmin) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3>Acesso Restrito</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          A trilha de auditoria (LGPD / CFM) está disponível apenas para administradores.
        </p>
      </div>
    );
  }

  const registros = painel?.registros || [];
  const porEntidade = painel?.porEntidade || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            Auditoria & Rastreabilidade (LGPD / CFM)
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Histórico automático de criação, modificação e autoria sobre dados clínicos e cadastrais sensíveis.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-role-admin" style={{ fontSize: 11.5 }}>
            🛡️ Perfil Auditor: {user?.login}
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={loadAuditoria}>
            🔄 Atualizar Trilha
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Registros Rastreados</div>
          <div className="stat-value">{painel?.totalRegistros ?? 0}</div>
          <div className="stat-sub">Total sob auditoria JPA</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Eventos nas Últimas 24h</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {painel?.alteradosUltimas24h ?? 0}
          </div>
          <div className="stat-sub">Criações e edições recentes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registros Alterados</div>
          <div className="stat-value" style={{ color: '#059669' }}>
            {painel?.entidadesModificadas ?? 0}
          </div>
          <div className="stat-sub">Com modificações pós-criação</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Prontuários Auditados</div>
          <div className="stat-value" style={{ color: '#0284c7' }}>
            {porEntidade.PRONTUARIO ?? 0}
          </div>
          <div className="stat-sub">Conformidade CFM / PEP</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(ENTIDADE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`btn btn-sm ${entidadeFiltro === key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setEntidadeFiltro(key)}
              >
                {label}
                {key !== 'TODAS' && porEntidade[key] !== undefined ? ` (${porEntidade[key]})` : ''}
              </button>
            ))}
          </div>

          <div className="search-bar" style={{ width: 290 }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              placeholder="Filtrar por autor ou identificador..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" /> Carregando trilha de auditoria...
          </div>
        ) : registros.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🛡️</div>
            <p>Nenhum evento de auditoria encontrado para os filtros atuais.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Entidade</th>
                <th>Registro</th>
                <th>Status</th>
                <th>Criado Por</th>
                <th>Criado Em</th>
                <th>Última Modificação</th>
                <th>Tipo de Evento</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((reg) => {
                const alterado = foiRegistroAlterado(reg);
                return (
                  <tr key={`${reg.entidade}-${reg.registroId}`}>
                    <td>
                      <span className={`badge ${ENTIDADE_BADGE_CLASS[reg.entidade] || 'badge-indigo'}`}>
                        {reg.entidade}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{reg.identificador}</div>
                      <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ID #{reg.registroId}
                      </small>
                    </td>
                    <td>
                      <span className="badge badge-outline" style={{ fontSize: 11 }}>
                        {reg.statusRegistro}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{reg.criadoPor || 'SISTEMA'}</span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {formatarDataAuditoria(reg.criadoEm)}
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5 }}>
                        <strong>{reg.atualizadoPor || 'SISTEMA'}</strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {formatarDataAuditoria(reg.atualizadoEm)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${alterado ? 'badge-amber' : 'badge-green'}`}>
                        {alterado ? 'Alterado' : 'Criado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
