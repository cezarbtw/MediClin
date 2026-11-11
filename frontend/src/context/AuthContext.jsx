import { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  registerOnUnauthorized,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    registerOnUnauthorized(() => {
      logout();
    });
  }, []);

  const login = async (loginName, senha) => {
    setLoading(true);
    try {
      const data = await api.post('/login', { login: loginName, senha });
      const jwtToken = data.token || data.tokenJWT;
      if (!jwtToken) {
        throw new Error('Token não retornado pela API');
      }

      const userData = {
        login: data.login || loginName,
        perfil: data.perfil || 'ADMIN',
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, jwtToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      let message = 'Falha ao autenticar. Verifique usuário e senha.';
      if (err.data && typeof err.data === 'string') {
        message = err.data;
      } else if (err.data && err.data.error) {
        message = err.data.error;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const cadastrar = async (loginName, senha, perfil = 'RECEPCIONISTA') => {
    setLoading(true);
    try {
      const data = await api.post('/cadastro', { login: loginName, senha, perfil });
      const jwtToken = data.token || data.tokenJWT;
      if (!jwtToken) {
        throw new Error('Conta criada, mas o token não foi retornado pela API.');
      }

      const userData = {
        login: data.login || loginName,
        perfil: data.perfil || perfil,
      };
      localStorage.setItem(TOKEN_STORAGE_KEY, jwtToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      let message = 'Falha ao realizar cadastro.';
      if (err.data && err.data.error) {
        message = err.data.error;
      } else if (err.data && typeof err.data === 'string') {
        message = err.data;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const solicitarRecuperacao = async (loginName) => {
    setLoading(true);
    try {
      const data = await api.post('/recuperar-senha', { login: loginName });
      return { success: true, mensagem: data.mensagem, token: data.token };
    } catch (err) {
      let message = 'Falha ao solicitar recuperação de senha.';
      if (err.data && err.data.error) {
        message = err.data.error;
      } else if (err.data && err.data.mensagem) {
        message = err.data.mensagem;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const redefinirSenha = async (tokenRecuperacao, novaSenha) => {
    setLoading(true);
    try {
      const data = await api.post('/redefinir-senha', {
        token: tokenRecuperacao,
        novaSenha,
      });
      return { success: true, mensagem: data.mensagem };
    } catch (err) {
      let message = 'Falha ao redefinir senha.';
      if (err.data && err.data.error) {
        message = err.data.error;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        isAdmin: user?.perfil === 'ADMIN',
        loading,
        login,
        cadastrar,
        solicitarRecuperacao,
        redefinirSenha,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
