import { useState, useMemo } from 'react';

export function DocumentoModal({ consulta, paciente, medico, prontuario, onClose, showToast }) {
  const [tipo, setTipo] = useState(prontuario?.prescricao ? 'RECEITA' : 'RECEITA'); // 'RECEITA' | 'ATESTADO'
  const [viewMode, setViewMode] = useState('previa'); // 'previa' | 'editar'

  // Dados do médico
  const medicoNome = medico?.nome || consulta?.medicoNome || 'Dr. Médico Responsável';
  const medicoCrm = medico?.crm || consulta?.crm || '123456/SP';
  const medicoEspecialidade = medico?.especialidade || consulta?.especialidade || 'Clínica Geral';

  // Dados do paciente
  const pacienteNome = paciente?.nome || consulta?.pacienteNome || 'Paciente';
  const pacienteCpf = paciente?.cpf || '000.000.000-00';

  // Campos do Receituário
  const [medicamentos, setMedicamentos] = useState(
    prontuario?.prescricao ||
      '1. Dipirona Monoidratada 500mg\n   Tomar 1 comprimido por via oral a cada 6 horas em caso de dor ou febre.\n\n2. Amoxicilina + Clavulanato 875/125mg\n   Tomar 1 comprimido por via oral de 12 em 12 horas por 7 dias.'
  );
  const [instrucoesReceita, setInstrucoesReceita] = useState(
    'Manter boa hidratação (mínimo 2 litros de água ao dia) e repouso. Retornar se houver persistência dos sintomas após 5 dias.'
  );

  // Campos do Atestado
  const [diasRepouso, setDiasRepouso] = useState('2');
  const [motivoAtestado, setMotivoAtestado] = useState(
    'por motivo de doença e necessita de repouso para recuperação clínica'
  );
  const [cid, setCid] = useState('J06.9 (Infecção aguda das vias aéreas superiores)');
  const [horarioAtendimento, setHorarioAtendimento] = useState('09:00 às 09:40');

  // Código de autenticidade único para o documento
  const codigoAutenticidade = useMemo(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MDC-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }, []);

  const dataAtualFormatada = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const handleImprimir = () => {
    window.print();
    if (showToast) {
      showToast('Documento enviado para impressão / download em PDF.');
    }
  };

  return (
    <div className="modal-overlay no-print-bg" onClick={onClose}>
      <div
        className="modal"
        style={{
          maxWidth: 860,
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de controle (não visível na impressão) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderBottom: '1px solid var(--border)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Emissão de Documento Médico</h2>
              <span className="badge badge-indigo">PDF A4 Oficial</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Paciente: <strong>{pacienteNome}</strong> · Médico: <strong>{medicoNome}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Seletor de Tipo */}
            <div className="auth-tabs" style={{ margin: 0, padding: 3 }}>
              <button
                type="button"
                className={`auth-tab-btn ${tipo === 'RECEITA' ? 'active' : ''}`}
                onClick={() => setTipo('RECEITA')}
                style={{ padding: '6px 12px', fontSize: 12.5 }}
              >
                💊 Receituário
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${tipo === 'ATESTADO' ? 'active' : ''}`}
                onClick={() => setTipo('ATESTADO')}
                style={{ padding: '6px 12px', fontSize: 12.5 }}
              >
                📋 Atestado
              </button>
            </div>

            {/* Alternador Prévia / Editar */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setViewMode(viewMode === 'previa' ? 'editar' : 'previa')}
            >
              {viewMode === 'previa' ? '✏️ Editar Dados' : '👁️ Ver Folha Timbrada'}
            </button>

            {/* Botão de Imprimir */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleImprimir}
              style={{ gap: 6 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Imprimir / PDF
            </button>

            <button className="close-btn" onClick={onClose} style={{ marginLeft: 6 }}>
              ×
            </button>
          </div>
        </div>

        {/* Corpo do Modal: Formulário de Edição OU Folha A4 Timbrada */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {viewMode === 'editar' ? (
            <div className="card no-print" style={{ padding: 24, background: '#fff' }}>
              <h3 style={{ fontSize: 15, marginBottom: 16 }}>Configurar Dados do Documento</h3>
              {tipo === 'RECEITA' ? (
                <div className="login-form">
                  <div className="form-group">
                    <label>Prescrição Médica (Medicamentos e Posologia)</label>
                    <textarea
                      rows={6}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      placeholder="Nome do medicamento, dosagem, via e horários..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Orientações Gerais ao Paciente</label>
                    <textarea
                      rows={3}
                      value={instrucoesReceita}
                      onChange={(e) => setInstrucoesReceita(e.target.value)}
                      placeholder="Recomendações, dieta, sinais de alerta..."
                    />
                  </div>
                </div>
              ) : (
                <div className="login-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Dias de Repouso / Afastamento</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={diasRepouso}
                        onChange={(e) => setDiasRepouso(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Horário de Atendimento</label>
                      <input
                        value={horarioAtendimento}
                        onChange={(e) => setHorarioAtendimento(e.target.value)}
                        placeholder="ex: 08:30 às 09:15"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Motivo do Afastamento</label>
                    <input
                      value={motivoAtestado}
                      onChange={(e) => setMotivoAtestado(e.target.value)}
                      placeholder="ex: necessita de repouso médico para recuperação clínica"
                    />
                  </div>
                  <div className="form-group">
                    <label>CID-10 (Opcional, com consentimento do paciente)</label>
                    <input
                      value={cid}
                      onChange={(e) => setCid(e.target.value)}
                      placeholder="ex: J06.9 ou Deixar em branco"
                    />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 18, textAlign: 'right' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setViewMode('previa')}>
                  Visualizar Folha Timbrada →
                </button>
              </div>
            </div>
          ) : (
            /* Folha Timbrada Oficial A4 */
            <div className="documento-a4-wrapper">
              <div className="documento-a4 documento-a4-print">
                {/* Cabeçalho da Folha Timbrada */}
                <div className="doc-header">
                  <div className="doc-header-brand">
                    <img
                      src="/mediclin-logo-horizontal.png"
                      alt="MediClin · Gestão Clínica"
                      className="doc-brand-logo"
                    />
                    <div>
                      <span className="doc-clinic-sub">Rede Hospitalar Integrada</span>
                    </div>
                  </div>
                  <div className="doc-header-info">
                    <p>Unidade Hospitalar Central</p>
                    <p>Av. Paulista, 1500 · São Paulo - SP</p>
                    <p>Tel: (11) 3456-7890 · SAC 0800-MEDICLIN</p>
                  </div>
                </div>

                <div className="doc-divider" />

                {/* Título do Documento */}
                <div className="doc-title-block">
                  <h2>
                    {tipo === 'RECEITA' ? 'RECEITUÁRIO MÉDICO' : 'ATESTADO MÉDICO DE COMPARECIMENTO'}
                  </h2>
                  <span className="doc-subtitle">
                    {tipo === 'RECEITA'
                      ? 'Prescrição Terapêutica Ambulatorial'
                      : 'Declaração para fins comprobatórios e trabalhistas'}
                  </span>
                </div>

                {/* Dados de Identificação */}
                <div className="doc-id-box">
                  <div className="doc-id-item">
                    <span className="label">Paciente:</span>
                    <strong>{pacienteNome}</strong>
                  </div>
                  <div className="doc-id-item">
                    <span className="label">CPF:</span>
                    <span>{pacienteCpf}</span>
                  </div>
                  <div className="doc-id-item">
                    <span className="label">Médico Assistente:</span>
                    <span>{medicoNome}</span>
                  </div>
                  <div className="doc-id-item">
                    <span className="label">CRM:</span>
                    <span>{medicoCrm} · {medicoEspecialidade}</span>
                  </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="doc-content-body">
                  {tipo === 'RECEITA' ? (
                    <div>
                      <div className="doc-section-label">Indicação Terapêutica / Medicamentos:</div>
                      <div className="doc-prescription-text">
                        {medicamentos.split('\n').map((line, idx) => (
                          <p key={idx} style={{ margin: line ? '4px 0' : '10px 0' }}>
                            {line}
                          </p>
                        ))}
                      </div>

                      {instrucoesReceita && (
                        <div style={{ marginTop: 24 }}>
                          <div className="doc-section-label">Orientações Gerais:</div>
                          <p className="doc-instructions-text">{instrucoesReceita}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="doc-attest-text">
                      <p>
                        Atesto para os devidos fins que o(a) Sr(a). <strong>{pacienteNome}</strong>, inscrito(a) sob o CPF nº <strong>{pacienteCpf}</strong>, esteve sob atendimento médico nesta unidade de saúde na presente data, no período de <strong>{horarioAtendimento}</strong>.
                      </p>
                      <p style={{ marginTop: 16 }}>
                        Em decorrência do quadro clínico avaliado, declaro que o(a) paciente <strong>{motivoAtestado}</strong>, devendo permanecer afastado(a) de suas atividades laborais e/ou escolares pelo período de <strong>{diasRepouso} ({diasRepouso === '1' ? 'um' : diasRepouso} dia{diasRepouso === '1' ? '' : 's'})</strong> a contar desta data.
                      </p>
                      {cid && (
                        <p style={{ marginTop: 16, fontSize: 13, color: '#475569' }}>
                          <strong>CID-10:</strong> {cid}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Rodapé: Data e Assinatura */}
                <div className="doc-footer-section">
                  <div className="doc-date-location">
                    São Paulo - SP, {dataAtualFormatada}.
                  </div>

                  <div className="doc-signature-block">
                    <div className="doc-signature-line" />
                    <strong>{medicoNome}</strong>
                    <span>CRM {medicoCrm}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{medicoEspecialidade}</span>
                  </div>
                </div>

                {/* Rodapé de Segurança e Autenticação */}
                <div className="doc-bottom-auth">
                  <div>
                    <span>Código de Validação Digital:</span> <code>{codigoAutenticidade}</code>
                  </div>
                  <div>
                    Documento emitido eletronicamente via Sistema Hospitalar MediClin.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé da Janela Modal */}
        <div
          className="no-print"
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            💡 Dica: Ao abrir a janela de impressão, selecione o destino <strong>"Salvar como PDF"</strong> para baixar o arquivo.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={onClose}>
              Fechar
            </button>
            <button className="btn btn-primary" onClick={handleImprimir}>
              🖨️ Imprimir / Baixar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

