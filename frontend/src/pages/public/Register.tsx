import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        password: formData.password
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/app/dashboard');
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Erro de conexão: O servidor backend está offline ou inacessível.');
      } else {
        setError(err.response?.data?.detail || 'Erro ao criar conta');
      }
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-surface-faint flex flex-col font-body-md text-on-surface selection:bg-primary selection:text-on-primary">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-semibold">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar para Home
        </Link>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-4 pb-12">
        <div className="w-full max-w-md bg-surface-container-lowest border border-border-subtle rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <img src="/swift-logo.png" alt="Swift Logo" className="h-14 object-contain" />
            <h1 className="font-headline-md text-2xl font-bold tracking-wide text-primary">
              NeuroAnalytics
            </h1>
          </div>
          
          <h2 className="font-headline-md text-xl font-semibold mb-6 text-center text-on-surface">Crie sua conta</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-container text-on-error-container text-sm rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Nome completo</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Theo Martins"
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">E-mail corporativo</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="theo@swift.com.br"
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1">Empresa</label>
              <input 
                type="text" 
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ex: Swift"
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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
              <div className="relative">
                <label className="block text-sm font-semibold text-on-surface-variant mb-1">Confirmar senha</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 pr-10 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-bold py-3.5 rounded-lg shadow-sm transition-all mt-6 text-base"
            >
              Criar conta
            </button>
          </form>

          <p className="text-center text-sm font-medium text-on-surface-variant mt-8">
            Já tenho conta. <Link to="/login" className="text-primary hover:underline font-bold">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
