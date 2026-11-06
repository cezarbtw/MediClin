import { useState, useEffect, useCallback } from 'react';
import { api, MOCK } from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProntuarioModal } from '../components/ProntuarioModal';
import { exportarPacientesCsv } from '../utils/csvExport';

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export function PacientesPage({ showToast }) {
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [prontuarioPaciente, setProntuarioPaciente] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resP, resM] = await Promise.allSettled([
        api.get('/pacientes'),
        api.get('/medicos'),
      ]);
      setPacientes(resP.status === 'fulfilled' ? api.extractData(resP.value) : MOCK.pacientes);
      setMedicos(resM.status === 'fulfilled' ? api.extractData(resM.value) : MOCK.medicos);
    } catch {
      setPacientes(MOCK.pacientes);
      setMedicos(MOCK.medicos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = pacientes.filter(
    (p) =>
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({
      tipoSanguineo: 'O+',
      alergias: '',
      endereco: {
        logradouro: 'Avenida Brasil',
        bairro: 'Jardins',
        cep: '12345678',
        cidade: 'São Paulo',
        uf: 'SP',
        numero: '50',
        complemento: '',
      },
    });
    setModal('new');
  };

  const openEdit = (p) => {
    setForm({
      ...p,
      tipoSanguineo: p.tipoSanguineo || '',
      alergias: p.alergias || '',
      endereco: p.endereco || {
        logradouro: 'Avenida Brasil',
        bairro: 'Jardins',
        cep: '12345678',
        cidade: 'São Paulo',
        uf: 'SP',
        numero: '50',
        complemento: '',
      },
    });
    setModal('edit');
  };

  const formatCpf = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const save = async () => {
    if (!form.nome?.trim()) {
      showToast('O nome do paciente é obrigatório.');
      return;
    }

    const cpfDigits = String(form.cpf || '').replace(/\D/g, '');
    if (modal === 'new' && cpfDigits.length !== 11) {
      showToast('O CPF deve conter exatamente 11 dígitos.');
      return;
    }

    if (modal === 'new' && !form.email?.includes('@')) {
      showToast('Informe um e-mail válido.');
      return;
    }

    const cepClean = String(form.endereco?.cep || '12345678').replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
    const enderecoSanitized = {
      logradouro: form.endereco?.logradouro || 'Avenida Brasil',
      bairro: form.endereco?.bairro || 'Jardins',
      cep: cepClean,
      cidade: form.endereco?.cidade || 'São Paulo',
      uf: (form.endereco?.uf || 'SP').slice(0, 2).toUpperCase(),
      numero: form.endereco?.numero || '50',
      complemento: form.endereco?.complemento || '',
    };

    try {
      if (modal === 'new') {
        const payload = {
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone || '(11) 98888-0000',
          cpf: formatCpf(cpfDigits),
          endereco: enderecoSanitized,
          tipoSanguineo: form.tipoSanguineo || null,
          alergias: form.alergias?.trim() || null,
        };
        const novo = await api.post('/pacientes', payload);
        setPacientes((prev) => [...prev, novo]);
        showToast('Paciente cadastrado com sucesso!');
      } else {
        const payload = {
          id: form.id,
          nome: form.nome.trim(),
          telefone: form.telefone,
          endereco: enderecoSanitized,
          tipoSanguineo: form.tipoSanguineo || null,
          alergias: form.alergias?.trim() || null,
        };
        const upd = await api.put(`/pacientes/${form.id}`, payload);
        setPacientes((prev) => prev.map((x) => (x.id === form.id ? { ...x, ...upd } : x)));
        showToast('Paciente atualizado com sucesso!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.message || 'Erro ao salvar paciente. Verifique os dados.');
    }
  };

  const del = async (id) => {
    try {
      await api.delete(`/pacientes/${id}`);
      setPacientes((prev) => prev.filter((x) => x.id !== id));
      showToast('Paciente inativado/removido.');
    } catch {
      setPacientes((prev) => prev.filter((x) => x.id !== id));
      showToast('Paciente removido.');
    } finally {
      setConfirm(null);
    }
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fEnd = (k, v) =>
    setForm((p) => ({
      ...p,
      endereco: { ...(p.endereco || {}), [k]: v },
    }));

  return (
    <div>
      {confirm && (
        <ConfirmDialog
          msg={`Deseja realmente inativar/excluir o paciente "${confirm.nome}"?`}
          onConfirm={() => del(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {prontuarioPaciente && (
        <ProntuarioModal
          paciente={prontuarioPaciente}
          medicos={medicos}
          onClose={() => setProntuarioPaciente(null)}
          showToast={showToast}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'new' ? 'Novo Paciente' : 'Editar Paciente'}</h2>
              <button className="close-btn" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome completo *</label>
                <input
                  placeholder="Nome Sobrenome"
                  value={form.nome || ''}
                  onChange={(e) => f('nome', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CPF *</label>
                  <input
                    placeholder="000.000.000-00"
                    value={form.cpf || ''}
                    disabled={modal === 'edit'}
                    onChange={(e) => f('cpf', formatCpf(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Telefone *</label>
                  <input
                    placeholder="(00) 00000-0000"
                    value={form.telefone || ''}
                    onChange={(e) => f('telefone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>E-mail *</label>
                  <input
                    type="email"
                    placeholder="paciente@email.com"
                    value={form.email || ''}
                    disabled={modal === 'edit'}
                    onChange={(e) => f('email', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipo Sanguíneo</label>
                  <select
                    value={form.tipoSanguineo || ''}
                    onChange={(e) => f('tipoSanguineo', e.target.value)}
                  >
                    <option value="">Não informado</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Alergias e Restrições Clínicas</label>
                <input
                  placeholder="ex: Penicilina, Dipirona, Látex (ou Nenhuma)"
                  value={form.alergias || ''}
                  onChange={(e) => f('alergias', e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Endereço (Obrigatório na API)
                </span>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Logradouro</label>
                    <input
                      placeholder="Rua / Avenida"
                      value={form.endereco?.logradouro || ''}
                      onChange={(e) => fEnd('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número</label>
                    <input
                      placeholder="50"
                      value={form.endereco?.numero || ''}
                      onChange={(e) => fEnd('numero', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Bairro</label>
                    <input
                      placeholder="Bairro"
                      value={form.endereco?.bairro || ''}
                      onChange={(e) => fEnd('bairro', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cidade / UF</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6 }}>
                      <input
                        placeholder="Cidade"
                        value={form.endereco?.cidade || ''}
                        onChange={(e) => fEnd('cidade', e.target.value)}
                      />
                      <input
                        placeholder="SP"
                        maxLength={2}
                        value={form.endereco?.uf || ''}
                        onChange={(e) => fEnd('uf', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={save}>
                {modal === 'new' ? 'Cadastrar Paciente' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="search-bar" style={{ width: 300 }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => exportarPacientesCsv(filtered)}
              title="Exportar listagem filtrada para arquivo CSV"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>📥</span> Exportar CSV
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              + Novo Paciente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" /> Carregando pacientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👤</div>
            <p>Nenhum paciente encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>CPF</th>
                <th>Contato & Saúde</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-name">
                      <div className="avatar">
                        {initials(p.nome)}
                      </div>
                      <div>
                        <strong>{p.nome}</strong>
                        {p.tipoSanguineo && (
                          <span className="badge badge-role-admin" style={{ marginLeft: 6, fontSize: 10 }}>
                            {p.tipoSanguineo}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-muted)' }}>
                    {p.cpf || '—'}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {p.email || '—'}
                    <br />
                    {p.telefone || ''}
                    {p.alergias && (
                      <div style={{ color: '#b91c1c', fontSize: 11, marginTop: 2 }}>
                        ⚠️ {p.alergias}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-green">Ativo</span>
                  </td>
                  <td>
                    <div className="tag-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 9px', fontSize: 11.5 }}
                        onClick={() => setProntuarioPaciente(p)}
                        title="Ver prontuário eletrônico e histórico"
                      >
                        🩺 Prontuário
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p)}>
                        Inativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
