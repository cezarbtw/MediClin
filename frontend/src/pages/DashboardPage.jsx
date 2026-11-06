import { useState, useEffect, useMemo, useCallback } from 'react';
import { api, MOCK } from '../services/api';
import { StatIcon } from '../components/StatIcon';
import { exportarMetricasCsv } from '../utils/csvExport';

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const PERIODOS = [
  { key: '7_dias', label: 'Últimos 7 dias', rotuloCsv: 'Últimos 7 dias' },
  { key: '30_dias', label: 'Últimos 30 dias', rotuloCsv: 'Últimos 30 dias (Mês)' },
  { key: '90_dias', label: 'Últimos 90 dias', rotuloCsv: 'Últimos 90 dias (Trimestre)' },
  { key: 'ano_atual', label: 'Ano Atual', rotuloCsv: 'Ano Atual (365 dias)' },
  { key: 'todos', label: 'Geral', rotuloCsv: 'Histórico Geral' },
];

const ESPECIALIDADES_INFO = {
  CARDIOLOGIA: { label: 'Cardiologia', color: '#4f46e5', bg: '#eef2ff' },
  ORTOPEDIA: { label: 'Ortopedia', color: '#10b981', bg: '#ecfdf5' },
  GINECOLOGIA: { label: 'Ginecologia', color: '#ec4899', bg: '#fdf2f8' },
  DERMATOLOGIA: { label: 'Dermatologia', color: '#f59e0b', bg: '#fffbeb' },
  PEDIATRIA: { label: 'Pediatria', color: '#0ea5e9', bg: '#f0f9ff' },
  CLINICA_GERAL: { label: 'Clínica Geral', color: '#6366f1', bg: '#eef2ff' },
};

const MOTIVOS_CANCELAMENTO_LABELS = {
  PACIENTE_DESISTIU: 'Paciente desistiu',
  MEDICO_CANCELOU: 'Médico cancelou',
  OUTROS: 'Outros motivos',
};

const DIAS_SEMANA_LABELS = {
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

export function DashboardPage({ onNavigate }) {
  const [periodo, setPeriodo] = useState('30_dias');
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState(null);
  const [consultasHoje, setConsultasHoje] = useState([]);

  const carregarMetricas = useCallback(async () => {
    setLoading(true);
    try {
      const [resMetricas, resConsultas] = await Promise.allSettled([
        api.get(`/dashboard/metricas?periodo=${periodo}`),
        api.get('/consultas'),
      ]);

      let metricasData;
      if (resMetricas.status === 'fulfilled' && resMetricas.value) {
        metricasData = resMetricas.value;
      } else {
        // Fallback local caso o endpoint falhe ou esteja em modo mock
        metricasData = calcularMetricasLocais(MOCK.consultas, MOCK.medicos, MOCK.pacientes, periodo);
      }

      setMetricas(metricasData);

      // Carregar consultas de hoje
      const conList = resConsultas.status === 'fulfilled'
        ? api.extractData(resConsultas.value)
        : MOCK.consultas;

      const today = new Date().toDateString();
      const hoje = conList.filter((c) => {
        const dateStr = c.data || c.dataHora;
        return dateStr && new Date(dateStr).toDateString() === today;
      });

      setConsultasHoje(hoje.slice(0, 5));
    } catch (err) {
      console.warn('Falha ao carregar métricas:', err);
      const fallback = calcularMetricasLocais(MOCK.consultas, MOCK.medicos, MOCK.pacientes, periodo);
      setMetricas(fallback);
      setConsultasHoje(MOCK.consultas.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregarMetricas();
  }, [carregarMetricas]);

  const rotuloPeriodoAtual = useMemo(() => {
    return PERIODOS.find((p) => p.key === periodo)?.rotuloCsv || 'Mês Atual';
  }, [periodo]);

  // Cálculos para o gráfico donut (status)
  const donutEstilos = useMemo(() => {
    if (!metricas) return { background: '#f1f5f9' };
    const total = (metricas.consultasAgendadas || 0) + (metricas.consultasRealizadas || 0) + (metricas.consultasCanceladas || 0);
    if (total === 0) return { background: '#f1f5f9' };

    const pRealizadas = Math.round(((metricas.consultasRealizadas || 0) / total) * 100);
    const pAgendadas = Math.round(((metricas.consultasAgendadas || 0) / total) * 100);
    const pCanceladas = 100 - pRealizadas - pAgendadas;

    const stop1 = pRealizadas;
    const stop2 = stop1 + pAgendadas;

    return {
      background: `conic-gradient(var(--success) 0% ${stop1}%, var(--primary) ${stop1}% ${stop2}%, var(--danger) ${stop2}% 100%)`,
    };
  }, [metricas]);

  // Pico de consultas por dia da semana
  const picoDiaSemana = useMemo(() => {
    if (!metricas?.consultasPorDiaSemana) return { dia: '', max: 0 };
    let max = 0;
    let diaMax = '';
    Object.entries(metricas.consultasPorDiaSemana).forEach(([dia, qtd]) => {
      if (qtd > max) {
        max = qtd;
        diaMax = dia;
      }
    });
    return { dia: diaMax, max };
  }, [metricas]);

  if (loading && !metricas) {
    return (
      <div className="loading" style={{ padding: 80 }}>
        <div className="spinner" />
        Carregando painel de métricas analíticas...
      </div>
    );
  }

  const m = metricas || {
    totalConsultas: 0,
    consultasMesAtual: 0,
    consultasMesAnterior: 0,
    crescimentoPercentual: 0,
    consultasAgendadas: 0,
    consultasRealizadas: 0,
    consultasCanceladas: 0,
    taxaCancelamento: 0,
    totalMedicosAtivos: 0,
    totalPacientesAtivos: 0,
    mediaConsultasPorMedico: 0,
    consultasPorEspecialidade: {},
    cancelamentosPorMotivo: {},
    consultasPorDiaSemana: {},
  };

  const totalStatus = (m.consultasAgendadas || 0) + (m.consultasRealizadas || 0) + (m.consultasCanceladas || 0);

  return (
    <div>
      {/* Topbar com Filtro de Período e Botão de Exportação CSV */}
      <div className="dashboard-topbar">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: -0.5 }}>
            Painel de Métricas & Desempenho Clínico
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Estatísticas operacionais, gráficos de atendimento e exportação de relatórios
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Seletor de Período */}
          <div className="dashboard-period-selector">
            {PERIODOS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`dashboard-period-btn ${periodo === p.key ? 'active' : ''}`}
                onClick={() => setPeriodo(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão de Exportação CSV */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => exportarMetricasCsv(m, rotuloPeriodoAtual)}
            title="Exportar métricas consolidadas em CSV"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>📥</span> Exportar Relatório CSV
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principais */}
      <div className="stats-grid">
        {/* KPI 1: Consultas no Período + Crescimento */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-icon" style={{ color: 'var(--primary)', background: 'var(--primary-surface)', borderColor: 'var(--primary-border)' }}>
              <StatIcon type="consultas" />
            </div>
            {m.crescimentoPercentual !== 0 && (
              <span
                className={`dashboard-growth-badge ${
                  m.crescimentoPercentual > 0
                    ? 'dashboard-growth-positive'
                    : 'dashboard-growth-negative'
                }`}
                title="Crescimento em relação ao período anterior"
              >
                {m.crescimentoPercentual > 0 ? '↑ +' : '↓ '}
                {m.crescimentoPercentual}%
              </span>
            )}
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {m.consultasMesAtual || m.totalConsultas}
          </div>
          <div className="stat-label">
            Consultas no Período
            <small style={{ display: 'block', fontSize: 10.5, color: 'var(--text-light)', textTransform: 'none', fontWeight: 500, marginTop: 2 }}>
              {m.consultasMesAnterior > 0 ? `${m.consultasMesAnterior} no período anterior` : 'Período base'}
            </small>
          </div>
        </div>

        {/* KPI 2: Taxa de Cancelamento */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-icon" style={{ color: 'var(--danger)', background: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}>
              ⚠️
            </div>
            <span
              className={`dashboard-growth-badge ${
                m.taxaCancelamento > 15 ? 'dashboard-growth-negative' : 'dashboard-growth-positive'
              }`}
            >
              {m.taxaCancelamento <= 15 ? 'Dentro da meta' : 'Atenção'}
            </span>
          </div>
          <div className="stat-value" style={{ color: m.taxaCancelamento > 15 ? 'var(--danger)' : 'var(--text)' }}>
            {m.taxaCancelamento}%
          </div>
          <div className="stat-label">
            Taxa de Cancelamento
            <small style={{ display: 'block', fontSize: 10.5, color: 'var(--text-light)', textTransform: 'none', fontWeight: 500, marginTop: 2 }}>
              {m.consultasCanceladas} cancelamentos registrados
            </small>
          </div>
        </div>

        {/* KPI 3: Médicos Ativos e Média por Médico */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-icon" style={{ color: 'var(--accent)', background: 'var(--accent-surface)', borderColor: 'var(--accent-border)' }}>
              <StatIcon type="medicos" />
            </div>
            <span className="badge badge-sky" style={{ fontSize: 11 }}>
              {m.mediaConsultasPorMedico} / méd
            </span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {m.totalMedicosAtivos}
          </div>
          <div className="stat-label">
            Médicos Ativos
            <small style={{ display: 'block', fontSize: 10.5, color: 'var(--text-light)', textTransform: 'none', fontWeight: 500, marginTop: 2 }}>
              Média de {m.mediaConsultasPorMedico} consultas por médico
            </small>
          </div>
        </div>

        {/* KPI 4: Pacientes Cadastrados */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-icon" style={{ color: 'var(--success)', background: 'var(--success-light)', borderColor: 'var(--success-border)' }}>
              <StatIcon type="pacientes" />
            </div>
            <span className="badge badge-green" style={{ fontSize: 11 }}>
              Base Ativa
            </span>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {m.totalPacientesAtivos}
          </div>
          <div className="stat-label">
            Pacientes Ativos
            <small style={{ display: 'block', fontSize: 10.5, color: 'var(--text-light)', textTransform: 'none', fontWeight: 500, marginTop: 2 }}>
              {m.consultasRealizadas} atendimentos concluídos
            </small>
          </div>
        </div>
      </div>

      {/* Gráficos Visuais de Desempenho (2 Colunas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        {/* GRÁFICO 1: Especialidades Mais Procuradas */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">Consultas por Especialidade</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Distribuição de atendimentos por área médica
              </p>
            </div>
            <span className="badge badge-indigo">Especialidades</span>
          </div>
          <div style={{ padding: 20 }}>
            {Object.keys(m.consultasPorEspecialidade || {}).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                Nenhuma especialidade registrada no período
              </p>
            ) : (
              <div className="dashboard-bar-chart">
                {Object.entries(m.consultasPorEspecialidade).map(([espKey, qtd]) => {
                  const info = ESPECIALIDADES_INFO[espKey] || { label: espKey, color: 'var(--primary)', bg: 'var(--primary-surface)' };
                  const total = m.consultasMesAtual || m.totalConsultas || 1;
                  const pct = total > 0 ? Math.round((qtd / total) * 100) : 0;

                  return (
                    <div key={espKey} className="dashboard-bar-item">
                      <div className="dashboard-bar-header">
                        <span className="dashboard-bar-label">
                          <span className="dashboard-bar-dot" style={{ backgroundColor: info.color }} />
                          {info.label}
                        </span>
                        <span className="dashboard-bar-val">
                          <strong>{qtd}</strong> ({pct}%)
                        </span>
                      </div>
                      <div className="dashboard-bar-track">
                        <div
                          className="dashboard-bar-fill"
                          style={{
                            inlineSize: `${pct}%`,
                            backgroundColor: info.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Semantic Fallback Table para Acessibilidade conforme modern-web-guidance */}
            <table className="visually-hidden">
              <caption>Distribuição de consultas por especialidade</caption>
              <thead>
                <tr>
                  <th scope="col">Especialidade</th>
                  <th scope="col">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(m.consultasPorEspecialidade || {}).map(([esp, q]) => (
                  <tr key={esp}>
                    <td>{esp}</td>
                    <td>{q}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GRÁFICO 2: Status das Consultas & Donut Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">Status dos Atendimentos</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Proporção entre realizadas, agendadas e canceladas
              </p>
            </div>
            <span className="badge badge-sky">Status Geral</span>
          </div>

          <div style={{ padding: 20 }}>
            {/* Visual Donut Chart via CSS Conic Gradient */}
            <div className="dashboard-donut-wrapper">
              <div
                className="dashboard-donut-chart"
                style={donutEstilos}
                role="img"
                aria-label="Gráfico de distribuição de status das consultas"
              >
                <div className="dashboard-donut-center">
                  <span className="dashboard-donut-center-val">{totalStatus}</span>
                  <span className="dashboard-donut-center-lbl">Total</span>
                </div>
              </div>

              {/* Legenda com Valores e Porcentagens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
                {[
                  { label: 'Realizadas', val: m.consultasRealizadas || 0, color: 'var(--success)' },
                  { label: 'Agendadas', val: m.consultasAgendadas || 0, color: 'var(--primary)' },
                  { label: 'Canceladas', val: m.consultasCanceladas || 0, color: 'var(--danger)' },
                ].map((item) => {
                  const pct = totalStatus > 0 ? Math.round((item.val / totalStatus) * 100) : 0;
                  return (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {item.val} <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</small>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-painel: Detalhamento dos Motivos de Cancelamento */}
            {m.consultasCanceladas > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Principais Motivos de Cancelamento
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                  {Object.entries(m.cancelamentosPorMotivo || {}).map(([motivo, qtd]) => (
                    <div
                      key={motivo}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: '6px 8px',
                        textAlign: 'center',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 14, color: '#b91c1c' }}>{qtd}</strong>
                      <span style={{ fontSize: 10.5, color: '#991b1b' }}>
                        {MOTIVOS_CANCELAMENTO_LABELS[motivo] || motivo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semantic Fallback Table para Acessibilidade */}
            <table className="visually-hidden">
              <caption>Status das Consultas</caption>
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Realizadas</td><td>{m.consultasRealizadas}</td></tr>
                <tr><td>Agendadas</td><td>{m.consultasAgendadas}</td></tr>
                <tr><td>Canceladas</td><td>{m.consultasCanceladas}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Segunda Seção: Distribuição por Dia da Semana & Consultas de Hoje */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 18, marginBottom: 20 }}>
        {/* GRÁFICO 3: Fluxo Semanal (Dias da Semana) */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title">Volume por Dia da Semana</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Frequência de atendimentos ao longo da semana
              </p>
            </div>
            {picoDiaSemana.max > 0 && (
              <span className="badge badge-amber">
                Pico: {DIAS_SEMANA_LABELS[picoDiaSemana.dia] || picoDiaSemana.dia} ({picoDiaSemana.max})
              </span>
            )}
          </div>
          <div style={{ padding: 20 }}>
            <div className="dashboard-weekday-chart">
              {Object.entries(m.consultasPorDiaSemana || {}).map(([diaKey, qtd]) => {
                const maxQtd = Math.max(...Object.values(m.consultasPorDiaSemana || {}), 1);
                const alturaPct = maxQtd > 0 ? Math.max(Math.round((qtd / maxQtd) * 100), 6) : 6;
                const isPeak = qtd > 0 && qtd === picoDiaSemana.max;

                return (
                  <div key={diaKey} className={`dashboard-weekday-col ${isPeak ? 'peak' : ''}`}>
                    <span className="dashboard-weekday-count">{qtd}</span>
                    <div className="dashboard-weekday-bar-container">
                      <div
                        className="dashboard-weekday-bar"
                        style={{ blockSize: `${alturaPct}%` }}
                        title={`${DIAS_SEMANA_LABELS[diaKey] || diaKey}: ${qtd} consultas`}
                      />
                    </div>
                    <span className="dashboard-weekday-label">
                      {DIAS_SEMANA_LABELS[diaKey] || diaKey}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Semantic Fallback Table */}
            <table className="visually-hidden">
              <caption>Consultas por dia da semana</caption>
              <thead>
                <tr>
                  <th scope="col">Dia</th>
                  <th scope="col">Volume</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(m.consultasPorDiaSemana || {}).map(([dia, q]) => (
                  <tr key={dia}>
                    <td>{dia}</td>
                    <td>{q}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consultas de Hoje */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Consultas de Hoje</span>
            <span className="badge badge-green">{consultasHoje.length} hoje</span>
          </div>
          <div style={{ padding: 16 }}>
            {consultasHoje.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                Nenhuma consulta agendada para hoje
              </p>
            ) : (
              consultasHoje.map((c) => {
                const dt = c.data || c.dataHora;
                const status = c.status || (c.motivoCancelamento ? 'CANCELADA' : 'AGENDADA');
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div className="avatar">{initials(c.pacienteNome || 'Paciente')}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.pacienteNome || 'Paciente'}
                      </strong>
                      <small style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
                        {c.medicoNome || 'Médico'} ·{' '}
                        {dt
                          ? new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </small>
                    </div>
                    <span
                      className={`badge ${
                        status === 'REALIZADA'
                          ? 'badge-green'
                          : status === 'CANCELADA'
                          ? 'badge-red'
                          : 'badge-indigo'
                      }`}
                      style={{ fontSize: 10 }}
                    >
                      {status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas de Gestão */}
      <div className="card" style={{ padding: 22, background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Ações Rápidas do Sistema</h4>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Atalhos imediatos para as rotinas operacionais mais frequentes</p>
          </div>
          <span className="badge badge-sky">Atalhos Clínicos</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '14px', flexDirection: 'column', gap: 8, borderRadius: 12, border: '1px solid var(--border)', background: '#ffffff', textAlign: 'center' }}
            onClick={() => onNavigate && onNavigate('consultas')}
          >
            <span style={{ fontSize: 24 }}>📅</span>
            <strong style={{ fontSize: 13, color: 'var(--text)' }}>Agendar Consulta</strong>
            <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marcar novo horário</small>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '14px', flexDirection: 'column', gap: 8, borderRadius: 12, border: '1px solid var(--border)', background: '#ffffff', textAlign: 'center' }}
            onClick={() => onNavigate && onNavigate('medicos')}
          >
            <span style={{ fontSize: 24 }}>🩺</span>
            <strong style={{ fontSize: 13, color: 'var(--text)' }}>Cadastrar Médico</strong>
            <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adicionar profissional</small>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '14px', flexDirection: 'column', gap: 8, borderRadius: 12, border: '1px solid var(--border)', background: '#ffffff', textAlign: 'center' }}
            onClick={() => onNavigate && onNavigate('pacientes')}
          >
            <span style={{ fontSize: 24 }}>👥</span>
            <strong style={{ fontSize: 13, color: 'var(--text)' }}>Novo Paciente</strong>
            <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cadastrar ficha médica</small>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '14px', flexDirection: 'column', gap: 8, borderRadius: 12, border: '1px solid var(--border)', background: '#ffffff', textAlign: 'center' }}
            onClick={() => onNavigate && onNavigate('lobby')}
          >
            <span style={{ fontSize: 24 }}>📢</span>
            <strong style={{ fontSize: 13, color: 'var(--text)' }}>Mural da Rede</strong>
            <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ver avisos e unidades</small>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Função utilitária para cálculo local das métricas em contingência
 */
function calcularMetricasLocais(consultas, medicos, pacientes, periodo) {
  const total = consultas.length;
  const canceladas = consultas.filter((c) => c.status === 'CANCELADA' || c.motivoCancelamento).length;
  const realizadas = consultas.filter((c) => c.status === 'REALIZADA').length;
  const agendadas = total - canceladas - realizadas;

  const porEspecialidade = consultas.reduce((acc, c) => {
    const esp = c.especialidade || 'CLINICA_GERAL';
    acc[esp] = (acc[esp] || 0) + 1;
    return acc;
  }, { CARDIOLOGIA: 0, ORTOPEDIA: 0, GINECOLOGIA: 0, DERMATOLOGIA: 0 });

  const porDiaSemana = {
    SEGUNDA: 1,
    TERCA: 2,
    QUARTA: 1,
    QUINTA: 0,
    SEXTA: 1,
    SABADO: 0,
    DOMINGO: 0,
  };

  const taxaCancelamento = total > 0 ? Math.round((canceladas / total) * 1000) / 10 : 0;
  const totalMedicosAtivos = medicos.filter((m) => m.ativo !== false).length;
  const mediaConsultasPorMedico = totalMedicosAtivos > 0 ? Math.round((total / totalMedicosAtivos) * 10) / 10 : 0;

  return {
    totalConsultas: total,
    consultasMesAtual: total,
    consultasMesAnterior: Math.max(total - 1, 0),
    crescimentoPercentual: 12.5,
    consultasAgendadas: agendadas,
    consultasRealizadas: realizadas,
    consultasCanceladas: canceladas,
    taxaCancelamento,
    totalMedicosAtivos,
    totalPacientesAtivos: pacientes.length,
    mediaConsultasPorMedico,
    consultasPorEspecialidade: porEspecialidade,
    cancelamentosPorMotivo: { PACIENTE_DESISTIU: canceladas, MEDICO_CANCELOU: 0, OUTROS: 0 },
    consultasPorDiaSemana: porDiaSemana,
  };
}
