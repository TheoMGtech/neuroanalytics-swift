import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/app/dashboard');
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Erro de conexão: O servidor backend está offline ou inacessível.');
      } else {
        setError(err.response?.data?.detail || 'Erro ao fazer login');
      }
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-surface-faint flex flex-col font-body-md text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Top bar with back button */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-semibold">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar para Home
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-md bg-surface-container-lowest border border-border-subtle rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <img src="/swift-logo.png" alt="Swift Logo" className="h-14 object-contain" />
            <h1 className="font-headline-md text-2xl font-bold tracking-wide text-primary">
              NeuroAnalytics
            </h1>
          </div>
          
          <h2 className="font-headline-md text-xl font-semibold mb-6 text-center text-on-surface">Entrar na plataforma</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">E-mail corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="theo@swift.com.br"
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-on-surface-variant">Senha</label>
                <a href="#" className="text-xs font-semibold text-primary hover:underline">Esqueci minha senha</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 pr-10 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="remember" className="rounded border-border-subtle bg-surface accent-primary w-4 h-4" />
              <label htmlFor="remember" className="text-sm font-medium text-on-surface-variant cursor-pointer">Lembrar-me</label>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 rounded-lg shadow-sm transition-all mt-4 text-base"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-sm font-medium text-on-surface-variant mt-8">
            Ainda não tem conta? <Link to="/register" className="text-primary hover:underline font-bold">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
