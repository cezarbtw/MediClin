import { useState, useMemo } from 'react';
import { exportarConsultasCsv } from '../utils/csvExport';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_COMPLETO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const HORARIOS_FUNCIONAMENTO = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const ESPECIALIDADES_CONFIG = {
  CARDIOLOGIA: {
    label: 'Cardiologia',
    bg: '#eef2ff',
    border: '#c7d2fe',
    text: '#4338ca',
    dot: '#6366f1',
  },
  ORTOPEDIA: {
    label: 'Ortopedia',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
    dot: '#10b981',
  },
  GINECOLOGIA: {
    label: 'Ginecologia',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    text: '#9d174d',
    dot: '#ec4899',
  },
  DERMATOLOGIA: {
    label: 'Dermatologia',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#92400e',
    dot: '#f59e0b',
  },
};

const DEFAULT_CONFIG = {
  label: 'Clínica Geral',
  bg: '#f0f9ff',
  border: '#bae6fd',
  text: '#0369a1',
  dot: '#0ea5e9',
};

const CANCELADA_CONFIG = {
  bg: '#fef2f2',
  border: '#fecaca',
  text: '#991b1b',
  dot: '#ef4444',
};

// Formatação segura de datas sem problemas de offset UTC
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getConsultaDateKey(consulta) {
  const dt = consulta.data || consulta.dataHora;
  if (!dt) return '';
  return dt.slice(0, 10);
}

function getConsultaHour(consulta) {
  const dt = consulta.data || consulta.dataHora;
  if (!dt) return -1;
  const match = dt.match(/T(\d{2}):/);
  if (match) return parseInt(match[1], 10);
  const d = new Date(dt);
  return isNaN(d) ? -1 : d.getHours();
}

function formatHora(dtStr) {
  if (!dtStr) return '--:--';
  const match = dtStr.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const d = new Date(dtStr);
  return isNaN(d) ? '--:--' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function CalendarView({
  consultas = [],
  medicos = [],
  onAgendar,
  onAtendimento,
  onEmitirDocumento,
  onCancelar,
  loading = false,
}) {
  const [viewMode, setViewMode] = useState('mes'); // 'mes' | 'semana'
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [termoBusca, setTermoBusca] = useState('');
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [diaDetalheModal, setDiaDetalheModal] = useState(null);

  // Mapeamento de especialidade por médico
  const especialidadePorMedico = useMemo(() => {
    const map = {};
    medicos.forEach((m) => {
      map[m.id] = m.especialidade;
    });
    return map;
  }, [medicos]);

  // Consultas filtradas
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((c) => {
      // Filtro Médico
      if (filtroMedico && String(c.idMedico) !== String(filtroMedico)) {
        return false;
      }
      // Filtro Especialidade
      const esp = c.especialidade || especialidadePorMedico[c.idMedico];
      if (filtroEspecialidade && esp !== filtroEspecialidade) {
        return false;
      }
      // Filtro Status
      const status = c.status || (c.motivoCancelamento ? 'CANCELADA' : 'AGENDADA');
      if (filtroStatus === 'AGENDADA' && status !== 'AGENDADA') return false;
      if (filtroStatus === 'CANCELADA' && status !== 'CANCELADA') return false;
      if (filtroStatus === 'REALIZADA' && status !== 'REALIZADA') return false;

      // Filtro Busca Texto
      if (termoBusca) {
        const s = termoBusca.toLowerCase();
        const pac = (c.pacienteNome || '').toLowerCase();
        const med = (c.medicoNome || '').toLowerCase();
        if (!pac.includes(s) && !med.includes(s)) return false;
      }

      return true;
    });
  }, [consultas, filtroMedico, filtroEspecialidade, filtroStatus, termoBusca, especialidadePorMedico]);

  // Indexação rápida por data (YYYY-MM-DD -> [consultas])
  const consultasPorData = useMemo(() => {
    const map = {};
    consultasFiltradas.forEach((c) => {
      const key = getConsultaDateKey(c);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(c);
      }
    });
    // Ordenar consultas por horário dentro de cada dia
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const tA = a.data || a.dataHora || '';
        const tB = b.data || b.dataHora || '';
        return tA.localeCompare(tB);
      });
    });
    return map;
  }, [consultasFiltradas]);

  // Navegação
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'mes') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'mes') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Dias para visualização mensal
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 a 6
    const totalDays = lastDay.getDate();

    const days = [];

    // Dias do mês anterior para completar a primeira semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateKey: toDateKey(d),
        dayNumber: d.getDate(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateKey: toDateKey(d),
        dayNumber: i,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    // Dias do próximo mês para completar a grade (múltiplo de 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateKey: toDateKey(d),
        dayNumber: i,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    return days;
  }, [currentDate]);

  // Dias para visualização semanal
  const daysInWeek = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);
      week.push({
        date: dayDate,
        isCurrentMonth: dayDate.getMonth() === currentDate.getMonth(),
        dateKey: toDateKey(dayDate),
        dayNumber: dayDate.getDate(),
        dayName: DIAS_SEMANA[dayDate.getDay()],
        dayFullName: DIAS_SEMANA_COMPLETO[dayDate.getDay()],
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
      });
    }
    return week;
  }, [currentDate]);

  const todayKey = toDateKey(new Date());

  // Título da barra de navegação
  const tituloPeriodo = useMemo(() => {
    if (viewMode === 'mes') {
      return `${MESES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    }
    const inicio = daysInWeek[0].date;
    const fim = daysInWeek[6].date;
    if (inicio.getMonth() === fim.getMonth()) {
      return `${inicio.getDate()} a ${fim.getDate()} de ${MESES[inicio.getMonth()]} de ${inicio.getFullYear()}`;
    }
    return `${inicio.getDate()} de ${MESES[inicio.getMonth()]} a ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
  }, [currentDate, viewMode, daysInWeek]);

  // Estatísticas do período visível
  const statsPeriodo = useMemo(() => {
    const keys = viewMode === 'mes'
      ? new Set(daysInMonth.map((d) => d.dateKey))
      : new Set(daysInWeek.map((d) => d.dateKey));

    let total = 0;
    let agendadas = 0;
    let canceladas = 0;

    consultasFiltradas.forEach((c) => {
      const key = getConsultaDateKey(c);
      if (keys.has(key)) {
        total++;
        const status = c.status || (c.motivoCancelamento ? 'CANCELADA' : 'AGENDADA');
        if (status === 'CANCELADA') canceladas++;
        else agendadas++;
      }
    });

    return { total, agendadas, canceladas };
  }, [consultasFiltradas, viewMode, daysInMonth, daysInWeek]);

  const getConfig = (consulta) => {
    const status = consulta.status || (consulta.motivoCancelamento ? 'CANCELADA' : 'AGENDADA');
    if (status === 'CANCELADA') return CANCELADA_CONFIG;
    const esp = consulta.especialidade || especialidadePorMedico[consulta.idMedico];
    return ESPECIALIDADES_CONFIG[esp] || DEFAULT_CONFIG;
  };

  return (
    <div className="calendar-container">
      {/* Barra de Filtros e Busca */}
      <div className="calendar-filter-bar">
        <div className="search-bar" style={{ minWidth: 240, flex: 1.2 }}>
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            placeholder="Filtrar por paciente ou médico..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>

        <div className="calendar-filter-group">
          {/* Filtro Médico */}
          <select
            value={filtroMedico}
            onChange={(e) => setFiltroMedico(e.target.value)}
            className="calendar-select"
            aria-label="Filtrar por médico"
          >
            <option value="">Todos os Médicos</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} ({m.especialidade || 'Geral'})
              </option>
            ))}
          </select>

          {/* Filtro Especialidade */}
          <select
            value={filtroEspecialidade}
            onChange={(e) => setFiltroEspecialidade(e.target.value)}
            className="calendar-select"
            aria-label="Filtrar por especialidade"
          >
            <option value="">Todas Especialidades</option>
            <option value="CARDIOLOGIA">Cardiologia</option>
            <option value="ORTOPEDIA">Ortopedia</option>
            <option value="GINECOLOGIA">Ginecologia</option>
            <option value="DERMATOLOGIA">Dermatologia</option>
          </select>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="calendar-select"
            aria-label="Filtrar por status"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="AGENDADA">Agendadas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Header Principal do Calendário: Navegação + Alternador Mês/Semana */}
      <div className="calendar-header-toolbar">
        <div className="calendar-nav-controls">
          <div className="calendar-btn-group">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrev}
              title="Período anterior"
              aria-label="Período anterior"
            >
              ◀
            </button>
            <button
              type="button"
              className="calendar-today-btn"
              onClick={handleToday}
            >
              Hoje
            </button>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNext}
              title="Próximo período"
              aria-label="Próximo período"
            >
              ▶
            </button>
          </div>
          <h2 className="calendar-period-title">{tituloPeriodo}</h2>
        </div>

        {/* Resumo e Botão de Agendamento */}
        <div className="calendar-header-actions">
          <div className="calendar-stats-pill">
            <span className="stat-item">
              <strong>{statsPeriodo.total}</strong> consultas
            </span>
            <span className="stat-sep">•</span>
            <span className="stat-item stat-agendada">
              <strong>{statsPeriodo.agendadas}</strong> ativas
            </span>
            {statsPeriodo.canceladas > 0 && (
              <>
                <span className="stat-sep">•</span>
                <span className="stat-item stat-cancelada">
                  <strong>{statsPeriodo.canceladas}</strong> canceladas
                </span>
              </>
            )}
          </div>

          <div className="calendar-mode-toggle">
            <button
              type="button"
              className={`calendar-mode-btn ${viewMode === 'mes' ? 'active' : ''}`}
              onClick={() => setViewMode('mes')}
            >
              Mês
            </button>
            <button
              type="button"
              className={`calendar-mode-btn ${viewMode === 'semana' ? 'active' : ''}`}
              onClick={() => setViewMode('semana')}
            >
              Semana
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => exportarConsultasCsv(consultasFiltradas)}
            title="Exportar consultas filtradas para arquivo CSV"
          >
            <span>📥</span> Exportar CSV
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => onAgendar && onAgendar(null)}
          >
            <span>+</span> Agendar Consulta
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60 }}>
          <div className="spinner" /> Carregando agenda da clínica...
        </div>
      ) : viewMode === 'mes' ? (
        /* VISÃO MENSAL */
        <div className="calendar-month-wrapper">
          {/* Cabeçalho dos dias da semana */}
          <div className="calendar-weekdays-row">
            {DIAS_SEMANA.map((dia, idx) => (
              <div
                key={dia}
                className={`calendar-weekday-cell ${idx === 0 || idx === 6 ? 'weekend' : ''}`}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="calendar-month-grid">
            {daysInMonth.map((day) => {
              const items = consultasPorData[day.dateKey] || [];
              const isToday = day.dateKey === todayKey;
              const maxDisplay = 3;
              const hasOverflow = items.length > maxDisplay;
              const visibleItems = items.slice(0, maxDisplay);

              return (
                <div
                  key={day.dateKey}
                  className={`calendar-day-cell ${
                    !day.isCurrentMonth ? 'other-month' : ''
                  } ${isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                >
                  <div className="calendar-day-header">
                    <span className={`calendar-day-number ${isToday ? 'today-badge' : ''}`}>
                      {day.dayNumber}
                    </span>
                    <button
                      type="button"
                      className="calendar-quick-add-btn"
                      title={`Agendar consulta em ${day.dayNumber}`}
                      onClick={() => onAgendar && onAgendar(`${day.dateKey}T09:00`)}
                    >
                      +
                    </button>
                  </div>

                  <div className="calendar-day-events">
                    {visibleItems.map((c) => {
                      const cfg = getConfig(c);
                      const isCanc = c.status === 'CANCELADA' || Boolean(c.motivoCancelamento);
                      const hora = formatHora(c.data || c.dataHora);

                      return (
                        <div
                          key={c.id}
                          className={`calendar-event-pill ${isCanc ? 'canceled' : ''}`}
                          style={{
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                            color: cfg.text,
                          }}
                          onClick={() => setSelectedConsulta(c)}
                          title={`${hora} - ${c.pacienteNome || 'Paciente'} (${c.medicoNome || 'Médico'})`}
                        >
                          <span
                            className="calendar-event-dot"
                            style={{ backgroundColor: cfg.dot }}
                          />
                          <span className="calendar-event-time">{hora}</span>
                          <span className="calendar-event-title">
                            {c.pacienteNome || 'Paciente'}
                          </span>
                        </div>
                      );
                    })}

                    {hasOverflow && (
                      <button
                        type="button"
                        className="calendar-more-badge"
                        onClick={() => setDiaDetalheModal({ day, items })}
                      >
                        +{items.length - maxDisplay} mais
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISÃO SEMANAL */
        <div className="calendar-week-wrapper">
          <div className="calendar-week-header-row">
            <div className="calendar-time-gutter-header">Horário</div>
            {daysInWeek.map((day) => {
              const isToday = day.dateKey === todayKey;
              return (
                <div
                  key={day.dateKey}
                  className={`calendar-week-day-header ${isToday ? 'today' : ''} ${
                    day.isWeekend ? 'weekend' : ''
                  }`}
                >
                  <span className="calendar-week-day-name">{day.dayName}</span>
                  <span className={`calendar-week-day-num ${isToday ? 'today-num' : ''}`}>
                    {day.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="calendar-week-body">
            {HORARIOS_FUNCIONAMENTO.map((hora) => {
              const horaStr = `${String(hora).padStart(2, '0')}:00`;
              return (
                <div key={hora} className="calendar-week-time-row">
                  <div className="calendar-time-gutter">{horaStr}</div>
                  {daysInWeek.map((day) => {
                    const itemsDoDia = consultasPorData[day.dateKey] || [];
                    const itemsDestaHora = itemsDoDia.filter(
                      (c) => getConsultaHour(c) === hora
                    );
                    const isToday = day.dateKey === todayKey;

                    return (
                      <div
                        key={day.dateKey}
                        className={`calendar-week-slot ${isToday ? 'today-slot' : ''} ${
                          day.isWeekend ? 'weekend-slot' : ''
                        }`}
                      >
                        {itemsDestaHora.map((c) => {
                          const cfg = getConfig(c);
                          const isCanc = c.status === 'CANCELADA' || Boolean(c.motivoCancelamento);
                          const horarioFormatado = formatHora(c.data || c.dataHora);

                          return (
                            <div
                              key={c.id}
                              className={`calendar-week-event-card ${isCanc ? 'canceled' : ''}`}
                              style={{
                                backgroundColor: cfg.bg,
                                borderColor: cfg.border,
                                color: cfg.text,
                              }}
                              onClick={() => setSelectedConsulta(c)}
                            >
                              <div className="calendar-week-event-top">
                                <span
                                  className="calendar-event-dot"
                                  style={{ backgroundColor: cfg.dot }}
                                />
                                <strong>{horarioFormatado}</strong>
                                <span className="calendar-week-event-badge">
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="calendar-week-event-pac">
                                {c.pacienteNome || 'Paciente'}
                              </div>
                              <div className="calendar-week-event-med">
                                {c.medicoNome || 'Dr(a). Médico'}
                              </div>
                            </div>
                          );
                        })}

                        {itemsDestaHora.length === 0 && (
                          <button
                            type="button"
                            className="calendar-week-add-slot-btn"
                            onClick={() =>
                              onAgendar &&
                              onAgendar(
                                `${day.dateKey}T${String(hora).padStart(2, '0')}:00`
                              )
                            }
                            title={`Agendar para ${day.dayName}, ${day.dayNumber} às ${horaStr}`}
                          >
                            + Agendar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda de Especialidades */}
      <div className="calendar-legend-bar">
        <span className="legend-label">Especialidades:</span>
        {Object.entries(ESPECIALIDADES_CONFIG).map(([key, cfg]) => (
          <div key={key} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: cfg.dot }} />
            <span>{cfg.label}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: CANCELADA_CONFIG.dot }} />
          <span>Cancelada</span>
        </div>
      </div>

      {/* Modal de Detalhes da Consulta Selecionada (Quick View & Ações) */}
      {selectedConsulta && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedConsulta(null)}
          style={{ zIndex: 250 }}
        >
          <div
            className="modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2>Detalhes da Consulta</h2>
                <span
                  className={`badge ${
                    selectedConsulta.status === 'REALIZADA'
                      ? 'badge-green'
                      : selectedConsulta.status === 'CANCELADA' || selectedConsulta.motivoCancelamento
                      ? 'badge-red'
                      : 'badge-indigo'
                  }`}
                >
                  {selectedConsulta.status || (selectedConsulta.motivoCancelamento ? 'CANCELADA' : 'AGENDADA')}
                </span>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedConsulta(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="calendar-detail-card">
                <div className="calendar-detail-row">
                  <div className="calendar-detail-icon">👤</div>
                  <div>
                    <label>Paciente</label>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>
                      {selectedConsulta.pacienteNome || 'Paciente'}
                    </p>
                    {selectedConsulta.idPaciente && (
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        Código #{selectedConsulta.idPaciente}
                      </span>
                    )}
                  </div>
                </div>

                <div className="calendar-detail-row">
                  <div className="calendar-detail-icon">🩺</div>
                  <div>
                    <label>Médico Responsável</label>
                    <p style={{ fontWeight: 600, fontSize: 14.5 }}>
                      {selectedConsulta.medicoNome || 'Dr(a). Designado'}
                    </p>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Especialidade: {selectedConsulta.especialidade || especialidadePorMedico[selectedConsulta.idMedico] || 'Clínica Geral'}
                    </span>
                  </div>
                </div>

                <div className="calendar-detail-row">
                  <div className="calendar-detail-icon">📅</div>
                  <div>
                    <label>Data & Horário</label>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>
                      {selectedConsulta.data || selectedConsulta.dataHora
                        ? new Date(selectedConsulta.data || selectedConsulta.dataHora).toLocaleString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>

                {selectedConsulta.motivoCancelamento && (
                  <div
                    className="calendar-detail-row"
                    style={{ background: '#fef2f2', padding: 12, borderRadius: 8 }}
                  >
                    <div className="calendar-detail-icon" style={{ color: '#ef4444' }}>⚠️</div>
                    <div>
                      <label style={{ color: '#991b1b' }}>Motivo do Cancelamento</label>
                      <p style={{ color: '#b91c1c', fontWeight: 600, fontSize: 13 }}>
                        {selectedConsulta.motivoCancelamento}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedConsulta(null)}
              >
                Fechar
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {!(selectedConsulta.status === 'CANCELADA' || selectedConsulta.motivoCancelamento) && (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const target = selectedConsulta;
                        setSelectedConsulta(null);
                        onCancelar && onCancelar(target);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const target = selectedConsulta;
                        setSelectedConsulta(null);
                        onEmitirDocumento && onEmitirDocumento(target);
                      }}
                      title="Emitir receita ou atestado"
                    >
                      📄 Documento
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const target = selectedConsulta;
                        setSelectedConsulta(null);
                        onAtendimento && onAtendimento(target);
                      }}
                      title="Abrir prontuário eletrônico"
                    >
                      🩺 Atendimento
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Visualizar Todas as Consultas de um Dia (Overflow) */}
      {diaDetalheModal && (
        <div
          className="modal-overlay"
          onClick={() => setDiaDetalheModal(null)}
          style={{ zIndex: 240 }}
        >
          <div
            className="modal"
            style={{ maxWidth: 460 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                Consultas de {diaDetalheModal.day.dayNumber} de {MESES[diaDetalheModal.day.date.getMonth()]}
              </h2>
              <button
                className="close-btn"
                onClick={() => setDiaDetalheModal(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {diaDetalheModal.items.map((c) => {
                  const cfg = getConfig(c);
                  const hora = formatHora(c.data || c.dataHora);
                  const isCanc = c.status === 'CANCELADA' || Boolean(c.motivoCancelamento);

                  return (
                    <div
                      key={c.id}
                      className="calendar-detail-item-card"
                      style={{
                        borderColor: cfg.border,
                        borderLeftColor: cfg.dot,
                        borderLeftWidth: 4,
                      }}
                      onClick={() => {
                        setDiaDetalheModal(null);
                        setSelectedConsulta(c);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{hora} - {c.pacienteNome || 'Paciente'}</strong>
                        <span className={`badge ${isCanc ? 'badge-red' : 'badge-indigo'}`} style={{ fontSize: 10 }}>
                          {isCanc ? 'Cancelada' : 'Agendada'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {c.medicoNome || 'Médico'} • {cfg.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDiaDetalheModal(null)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const dtKey = diaDetalheModal.day.dateKey;
                  setDiaDetalheModal(null);
                  onAgendar && onAgendar(`${dtKey}T09:00`);
                }}
              >
                + Nova Consulta Neste Dia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

