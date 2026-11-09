import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, cadastrar, solicitarRecuperacao, redefinirSenha, loading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'cadastro' | 'recuperar'
  
  // Login / Cadastro fields
  const [loginName, setLoginName] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [perfil, setPerfil] = useState('RECEPCIONISTA'); // 'RECEPCIONISTA' | 'MEDICO' | 'ADMIN'

  // Recuperação de senha fields
  const [recoveryStep, setRecoveryStep] = useState(1); // 1 = solicitar, 2 = redefinir
  const [recoveryLogin, setRecoveryLogin] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [generatedToken, setGeneratedToken] = useState(null);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setGeneratedToken(null);
    setRecoveryStep(1);
  };

  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginName || !senha) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'cadastro') {
      if (senha.length < 6) {
        setError('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (senha !== confirmarSenha) {
        setError('As senhas não coincidem. Verifique a digitação.');
        return;
      }

      const res = await cadastrar(loginName, senha, perfil);
      if (!res.success) {
        setError(res.error || 'Erro ao realizar cadastro.');
      } else {
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
      }
    } else {
      const res = await login(loginName, senha);
      if (!res.success) {
        setError(res.error || 'Erro ao efetuar login. Verifique os dados.');
      }
    }
  };

  const handleSolicitarRecuperacao = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!recoveryLogin) {
      setError('Informe seu login ou e-mail cadastrado.');
      return;
    }

    const res = await solicitarRecuperacao(recoveryLogin);
    if (!res.success) {
      setError(res.error || 'Não foi possível solicitar a recuperação.');
    } else {
      setGeneratedToken(res.token);
      setRecoveryToken(res.token || '');
      setSuccessMsg('Código gerado com sucesso! Preencha a nova senha abaixo.');
      setRecoveryStep(2);
    }
  };

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!recoveryToken || !novaSenha) {
      setError('Preencha o código/token e a nova senha.');
      return;
    }

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    const res = await redefinirSenha(recoveryToken, novaSenha);
    if (!res.success) {
      setError(res.error || 'Erro ao redefinir senha. Verifique se o código é válido.');
    } else {
      setSuccessMsg('Senha redefinida com sucesso! Você já pode efetuar login.');
      setTimeout(() => {
        handleSwitchMode('login');
      }, 2500);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src="/mediclin-logo.png"
            alt="MediClin · Gestão Clínica"
            className="login-brand-logo"
          />
          <p>
            {mode === 'login' && 'Gestão Clínica & Hospitalar · Acesse sua conta'}
            {mode === 'cadastro' && 'Crie sua conta com controle de perfil de acesso'}
            {mode === 'recuperar' && 'Recuperação segura de acesso e redefinição de senha'}
          </p>
        </div>

        {/* Alternador de Abas */}
        {mode !== 'recuperar' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('login')}
              disabled={loading}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'cadastro' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('cadastro')}
              disabled={loading}
            >
              Cadastre-se
            </button>
          </div>
        )}

        {error && (
          <div className="login-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulário de Login / Cadastro */}
        {mode !== 'recuperar' && (
          <form onSubmit={handleSubmitAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="login">Usuário ou E-mail</label>
              <input
                id="login"
                type="text"
                placeholder="ex: admin@voll.med"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            {mode === 'cadastro' && (
              <div className="form-group">
                <label htmlFor="perfil">Perfil de Acesso (RBAC)</label>
                <select
                  id="perfil"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="RECEPCIONISTA">Recepcionista / Atendimento</option>
                  <option value="MEDICO">Médico / Corpo Clínico</option>
                  <option value="ADMIN">Administrador Geral</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="senha">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('recuperar')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
              />
            </div>

            {mode === 'cadastro' && (
              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar Senha</label>
                <input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} />
                  {mode === 'login' ? 'Autenticando...' : 'Cadastrando...'}
                </>
              ) : mode === 'login' ? (
                'Entrar no Sistema'
              ) : (
                'Cadastrar e Entrar'
              )}
            </button>
          </form>
        )}

        {/* Fluxo de Recuperação de Senha */}
        {mode === 'recuperar' && (
          <div className="recovery-flow">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => handleSwitchMode('login')}
                style={{ padding: '4px 8px' }}
              >
                ← Voltar ao login
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Etapa {recoveryStep} de 2
              </span>
            </div>

            {recoveryStep === 1 && (
              <form onSubmit={handleSolicitarRecuperacao} className="login-form">
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Digite seu usuário ou e-mail cadastrado para gerar o código de recuperação seguro.
                </p>

                <div className="form-group">
                  <label htmlFor="recoveryLogin">Usuário ou E-mail</label>
                  <input
                    id="recoveryLogin"
                    type="text"
                    placeholder="ex: admin@voll.med"
                    value={recoveryLogin}
                    onChange={(e) => setRecoveryLogin(e.target.value)}
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} />
                      Gerando código...
                    </>
                  ) : (
                    'Gerar Código de Recuperação'
                  )}
                </button>
              </form>
            )}

            {recoveryStep === 2 && (
              <form onSubmit={handleRedefinirSenha} className="login-form">
                {generatedToken && (
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                      🔑 Token gerado com sucesso:
                    </div>
                    <code
                      style={{
                        wordBreak: 'break-all',
                        fontSize: 11,
                        background: '#f1f5f9',
                        padding: '4px 6px',
                        borderRadius: 4,
                        display: 'block',
                      }}
                    >
                      {generatedToken}
                    </code>
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                      Preenchido automaticamente no campo de token abaixo.
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="recoveryToken">Token / Código de Recuperação</label>
                  <input
                    id="recoveryToken"
                    type="text"
                    placeholder="Cole aqui o token recebido"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="novaSenha">Nova Senha</label>
                  <input
                    id="novaSenha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</label>
                  <input
                    id="confirmarNovaSenha"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} />
                      Redefinindo senha...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13 }}>
          {mode === 'login' ? (
            <span style={{ color: 'var(--text-muted)' }}>
              Não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('cadastro')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Cadastre-se aqui
              </button>
            </span>
          ) : mode === 'cadastro' ? (
            <span style={{ color: 'var(--text-muted)' }}>
              Já possui conta cadastrada?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Faça login
              </button>
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              Lembrou sua senha?{' '}
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Retornar ao Login
              </button>
            </span>
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <p>Autenticação JWT · Controle de Acesso RBAC · Spring Boot 3</p>
        </div>
      </div>
    </div>
  );
}
