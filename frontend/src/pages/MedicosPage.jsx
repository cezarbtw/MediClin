import { useState, useEffect, useCallback } from 'react';
import { api, MOCK } from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { exportarMedicosCsv } from '../utils/csvExport';

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const ESPECIALIDADES = [
  { value: 'CARDIOLOGIA', label: 'Cardiologia' },
  { value: 'ORTOPEDIA', label: 'Ortopedia' },
  { value: 'GINECOLOGIA', label: 'Ginecologia' },
  { value: 'DERMATOLOGIA', label: 'Dermatologia' },
];

export function MedicosPage({ showToast }) {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicos');
      setMedicos(api.extractData(res));
    } catch {
      setMedicos(MOCK.medicos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = medicos.filter(
    (m) =>
      m.nome?.toLowerCase().includes(search.toLowerCase()) ||
      m.especialidade?.toLowerCase().includes(search.toLowerCase()) ||
      m.crm?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({
      ativo: true,
      especialidade: 'CARDIOLOGIA',
      endereco: {
        logradouro: 'Rua Principal',
        bairro: 'Centro',
        cep: '12345678',
        cidade: 'São Paulo',
        uf: 'SP',
        numero: '100',
        complemento: '',
      },
    });
    setModal('new');
  };

  const openEdit = (m) => {
    setForm({
      ...m,
      endereco: m.endereco || {
        logradouro: 'Rua Principal',
        bairro: 'Centro',
        cep: '12345678',
        cidade: 'São Paulo',
        uf: 'SP',
        numero: '100',
        complemento: '',
      },
    });
    setModal('edit');
  };

  const save = async () => {
    const crmClean = String(form.crm || '').replace(/\D/g, '').slice(0, 6);
    if (!form.nome?.trim()) {
      showToast('O nome do médico é obrigatório.');
      return;
    }
    if (modal === 'new' && (!crmClean || crmClean.length < 4)) {
      showToast('CRM deve conter entre 4 e 6 dígitos numéricos.');
      return;
    }
    if (modal === 'new' && !form.email?.includes('@')) {
      showToast('Informe um e-mail válido.');
      return;
    }

    const cepClean = String(form.endereco?.cep || '12345678').replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
    const enderecoSanitized = {
      logradouro: form.endereco?.logradouro || 'Rua Principal',
      bairro: form.endereco?.bairro || 'Centro',
      cep: cepClean,
      cidade: form.endereco?.cidade || 'São Paulo',
      uf: (form.endereco?.uf || 'SP').slice(0, 2).toUpperCase(),
      numero: form.endereco?.numero || '100',
      complemento: form.endereco?.complemento || '',
    };

    try {
      if (modal === 'new') {
        const payload = {
          nome: form.nome.trim(),
          email: form.email.trim(),
          telefone: form.telefone || '(11) 99999-0000',
          crm: crmClean,
          especialidade: form.especialidade || 'CARDIOLOGIA',
          endereco: enderecoSanitized,
        };
        const novo = await api.post('/medicos', payload);
        setMedicos((prev) => [...prev, novo]);
        showToast('Médico cadastrado com sucesso!');
      } else {
        const payload = {
          id: form.id,
          nome: form.nome.trim(),
          telefone: form.telefone,
          endereco: enderecoSanitized,
        };
        const upd = await api.put(`/medicos/${form.id}`, payload);
        setMedicos((prev) => prev.map((m) => (m.id === form.id ? { ...m, ...upd } : m)));
        showToast('Médico atualizado com sucesso!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.message || 'Erro ao salvar médico. Verifique os dados.');
    }
  };

  const del = async (id) => {
    try {
      await api.delete(`/medicos/${id}`);
      setMedicos((prev) => prev.filter((m) => m.id !== id));
      showToast('Médico inativado/removido com sucesso.');
    } catch {
      setMedicos((prev) => prev.filter((m) => m.id !== id));
      showToast('Médico removido.');
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
          msg={`Deseja realmente inativar/excluir o médico "${confirm.nome}"?`}
          onConfirm={() => del(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'new' ? 'Cadastrar Novo Médico' : 'Editar Médico'}</h2>
              <button className="close-btn" onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome completo *</label>
                <input
                  placeholder="Dr. Nome Sobrenome"
                  value={form.nome || ''}
                  onChange={(e) => f('nome', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CRM (somente dígitos) *</label>
                  <input
                    placeholder="123456"
                    value={form.crm || ''}
                    disabled={modal === 'edit'}
                    onChange={(e) => f('crm', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Especialidade *</label>
                  <select
                    value={form.especialidade || 'CARDIOLOGIA'}
                    disabled={modal === 'edit'}
                    onChange={(e) => f('especialidade', e.target.value)}
                  >
                    {ESPECIALIDADES.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>E-mail *</label>
                  <input
                    type="email"
                    placeholder="email@clinica.com"
                    value={form.email || ''}
                    disabled={modal === 'edit'}
                    onChange={(e) => f('email', e.target.value)}
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

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  Endereço (Obrigatório na API)
                </span>
                <div className="form-row" style={{ marginTop: 8 }}>
                  <div className="form-group">
                    <label>Logradouro</label>
                    <input
                      placeholder="Rua..."
                      value={form.endereco?.logradouro || ''}
                      onChange={(e) => fEnd('logradouro', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Número</label>
                    <input
                      placeholder="100"
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
                {modal === 'new' ? 'Cadastrar Médico' : 'Salvar Alterações'}
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
              placeholder="Buscar por nome, CRM ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => exportarMedicosCsv(filtered)}
              title="Exportar listagem filtrada para arquivo CSV"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>📥</span> Exportar CSV
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              + Novo Médico
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" /> Carregando médicos...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🩺</div>
            <p>Nenhum médico encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Médico</th>
                <th>CRM</th>
                <th>Especialidade</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="cell-name">
                      <div className="avatar">{initials(m.nome)}</div>
                      <div>
                        <strong>{m.nome}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13 }}>
                    {m.crm}
                  </td>
                  <td>
                    <span className="badge badge-indigo">{m.especialidade || '—'}</span>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {m.email || '—'}
                    <br />
                    {m.telefone || ''}
                  </td>
                  <td>
                    <span className={`badge ${m.ativo !== false ? 'badge-green' : 'badge-amber'}`}>
                      {m.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="tag-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(m)}>
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

