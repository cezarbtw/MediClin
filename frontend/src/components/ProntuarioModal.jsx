import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DocumentoModal } from './DocumentoModal';
import { AuditBadge } from './AuditInfo';

export function ProntuarioModal({ paciente, consulta, medicos = [], onClose, showToast }) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'novo'
  const [prontuarios, setProntuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentoItem, setDocumentoItem] = useState(null);

  // Form state
  const [idMedico, setIdMedico] = useState(consulta?.idMedico || medicos[0]?.id || '');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [prescricao, setPrescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [pressaoArterial, setPressaoArterial] = useState('');

  const pacienteId = paciente?.id || consulta?.idPaciente;
  const pacienteNome = paciente?.nome || consulta?.pacienteNome || 'Paciente';

  const carregarHistorico = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/prontuarios/paciente/${pacienteId}`);
      setProntuarios(api.extractData(res));
    } catch (err) {
      console.warn('Erro ao carregar prontuários:', err);
      setProntuarios([]);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    carregarHistorico();
    if (consulta) {
      // Se abriu a partir de uma consulta específica, abre diretamente na aba de registro
      setActiveTab('novo');
    }
  }, [carregarHistorico, consulta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnostico.trim()) {
      showToast('O diagnóstico é obrigatório.');
      return;
    }
    if (!idMedico) {
      showToast('Selecione o médico responsável pelo atendimento.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        idPaciente: Number(pacienteId),
        idMedico: Number(idMedico),
        idConsulta: consulta?.id ? Number(consulta.id) : null,
        queixaPrincipal: queixaPrincipal.trim() || null,
        diagnostico: diagnostico.trim(),
        prescricao: prescricao.trim() || null,
        observacoes: observacoes.trim() || null,
        peso: peso ? parseFloat(peso) : null,
        altura: altura ? parseInt(altura, 10) : null,
        pressaoArterial: pressaoArterial.trim() || null,
      };

      await api.post('/prontuarios', payload);
      showToast('Evolução médica registrada com sucesso no prontuário!');
      
      // Limpar formulário e voltar para timeline
      setQueixaPrincipal('');
      setDiagnostico('');
      setPrescricao('');
      setObservacoes('');
      setPeso('');
      setAltura('');
      setPressaoArterial('');
      setActiveTab('timeline');
      carregarHistorico();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar prontuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const calcularImc = (p, a) => {
    if (!p || !a || a <= 0) return null;
    const alturaMetros = a / 100;
    const imc = p / (alturaMetros * alturaMetros);
    return imc.toFixed(1);
  };

  const formatarDataHora = (dataStr) => {
    if (!dataStr) return '—';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2>Prontuário Eletrônico do Paciente (PEP)</h2>
              <span className="badge badge-role-admin" style={{ fontSize: 11 }}>
                Histórico Clínico
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Paciente: <strong>{pacienteNome}</strong>
              {paciente?.cpf && ` · CPF: ${paciente.cpf}`}
              {paciente?.tipoSanguineo && ` · Tipo Sanguíneo: ${paciente.tipoSanguineo}`}
              {paciente?.alergias && ` · Alergias: ${paciente.alergias}`}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Abas de Navegação do Prontuário */}
        <div className="auth-tabs" style={{ margin: '12px 24px 0' }}>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📋 Linha do Tempo ({prontuarios.length})
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'novo' ? 'active' : ''}`}
            onClick={() => setActiveTab('novo')}
          >
            ✍️ Novo Registro de Atendimento
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
          {activeTab === 'timeline' ? (
            <div>
              {loading ? (
                <div className="loading" style={{ padding: 40 }}>
                  <div className="spinner" /> Carregando histórico clínico...
                </div>
              ) : prontuarios.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="icon" style={{ fontSize: 36 }}>🩺</div>
                  <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    Nenhum registro clínico encontrado
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Este paciente ainda não possui atendimentos ou anotações médicas registradas.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('novo')}>
                    + Registrar Primeiro Atendimento
                  </button>
                </div>
              ) : (
                <div className="pep-timeline">
                  {prontuarios.map((item) => {
                    const imc = calcularImc(item.peso, item.altura);
                    return (
                      <div key={item.id} className="pep-entry-card">
                        <div className="pep-entry-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="pep-badge-date">
                              {formatarDataHora(item.dataRegistro)}
                            </div>
                            {item.idConsulta && (
                              <span className="badge badge-role-medico" style={{ fontSize: 10 }}>
                                Consulta #{item.idConsulta}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                            Atendido por <strong>{item.nomeMedico}</strong> (CRM {item.crmMedico || '—'})
                          </div>
                        </div>

                        {/* Sinais Vitais */}
                        {(item.pressaoArterial || item.peso || item.altura) && (
                          <div className="pep-vitals-row">
                            {item.pressaoArterial && (
                              <div className="pep-vital-badge">
                                <span className="label">PA:</span>
                                <strong>{item.pressaoArterial} mmHg</strong>
                              </div>
                            )}
                            {item.peso && (
                              <div className="pep-vital-badge">
                                <span className="label">Peso:</span>
                                <strong>{item.peso} kg</strong>
                              </div>
                            )}
                            {item.altura && (
                              <div className="pep-vital-badge">
                                <span className="label">Altura:</span>
                                <strong>{item.altura} cm</strong>
                              </div>
                            )}
                            {imc && (
                              <div className="pep-vital-badge">
                                <span className="label">IMC:</span>
                                <strong>{imc}</strong>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Queixa e Diagnóstico */}
                        {item.queixaPrincipal && (
                          <div className="pep-field-block">
                            <label>Queixa Principal / Anamnese:</label>
                            <p>{item.queixaPrincipal}</p>
                          </div>
                        )}

                        <div className="pep-field-block" style={{ borderLeftColor: 'var(--primary)' }}>
                          <label style={{ color: 'var(--primary)' }}>Diagnóstico / Hipótese:</label>
                          <p style={{ fontWeight: 600, color: 'var(--text)' }}>{item.diagnostico}</p>
                        </div>

                        {item.prescricao && (
                          <div className="pep-field-block" style={{ borderLeftColor: '#059669' }}>
                            <label style={{ color: '#059669' }}>Prescrição Médica & Medicamentos:</label>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{item.prescricao}</p>
                          </div>
                        )}

                        {item.observacoes && (
                          <div className="pep-field-block">
                            <label>Conduta & Observações:</label>
                            <p>{item.observacoes}</p>
                          </div>
                        )}

                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          {isAdmin ? <AuditBadge auditoria={item.auditoria} inline /> : <span />}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            onClick={() => setDocumentoItem(item)}
                          >
                            📄 Emitir Receita / Atestado em PDF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Médico Responsável *</label>
                  <select
                    value={idMedico}
                    onChange={(e) => setIdMedico(e.target.value)}
                    required
                  >
                    <option value="">Selecione o médico...</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.especialidade || 'Médico'}) - CRM {m.crm}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Consulta Vinculada</label>
                  <input
                    value={consulta?.id ? `Consulta #${consulta.id}` : 'Atendimento Avulso'}
                    disabled
                    style={{ background: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* Sinais Vitais */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#fcfdfe' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  📊 Sinais Vitais (Opcional)
                </span>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Pressão Arterial</label>
                    <input
                      placeholder="ex: 120/80"
                      value={pressaoArterial}
                      onChange={(e) => setPressaoArterial(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ex: 75.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input
                      type="number"
                      placeholder="ex: 175"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Queixa Principal / Sintomas Relatados</label>
                <textarea
                  rows={2}
                  placeholder="Relato do paciente, início dos sintomas, queixas clínicas..."
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Diagnóstico / Avaliação Clínica *</label>
                <input
                  placeholder="Hipótese diagnóstica ou diagnóstico confirmado (ex: CID ou descrição)"
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prescrição Médica & Orientações de Tratamento</label>
                <textarea
                  rows={3}
                  placeholder="Medicamento, dosagem, frequência (ex: Dipirona 500mg 1 comp de 6/6h se dor)..."
                  value={prescricao}
                  onChange={(e) => setPrescricao(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Observações Gerais & Conduta</label>
                <textarea
                  rows={2}
                  placeholder="Recomendações, solicitação de exames complementares, prazo de retorno..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('timeline')}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Salvar no Prontuário'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            🔒 Registros do PEP são protegidos e auditáveis conforme padrões hospitalares.
          </span>
          <button className="btn btn-outline" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {documentoItem && (
        <DocumentoModal
          consulta={{
            id: documentoItem.idConsulta,
            idMedico: documentoItem.idMedico,
            nomeMedico: documentoItem.nomeMedico,
            crmMedico: documentoItem.crmMedico,
            idPaciente: documentoItem.idPaciente || paciente?.id,
            nomePaciente: documentoItem.nomePaciente || paciente?.nome || pacienteNome,
            cpfPaciente: paciente?.cpf || '',
          }}
          prontuario={documentoItem}
          onClose={() => setDocumentoItem(null)}
        />
      )}
    </div>
  );
}

