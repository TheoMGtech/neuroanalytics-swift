import { useState, useEffect } from 'react';
import api from '../../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  // Profile State
  const [name, setName] = useState(user.name || '');
  const [company, setCompany] = useState(user.company || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    // Fetch latest info from DB
    api.get('/auth/me').then(res => {
      setUser(res.data);
      setName(res.data.name);
      setCompany(res.data.company);
      localStorage.setItem('user', JSON.stringify(res.data));
    }).catch(err => console.error(err));
  }, []);

  const handleProfileUpdate = async () => {
    setProfileMsg({ text: '', type: '' });
    try {
      const res = await api.put('/users/profile', { name, company });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setProfileMsg({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      
      // Update Topbar/Sidebar by dispatching a storage event or reloading (for simplicity here, reload is safe, or let react state do it if we used context, but local storage doesn't trigger reactivity. A reload is easiest if we don't have context)
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setProfileMsg({ text: err.response?.data?.detail || 'Erro ao atualizar perfil.', type: 'error' });
    }
  };

  const handlePasswordUpdate = async () => {
    setPwdMsg({ text: '', type: '' });
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'As novas senhas não coincidem.', type: 'error' });
      return;
    }
    try {
      await api.put('/users/password', { current_password: currentPassword, new_password: newPassword });
      setPwdMsg({ text: 'Senha atualizada com sucesso!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ text: err.response?.data?.detail || 'Erro ao atualizar senha.', type: 'error' });
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Configurações</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Gerencie seu perfil e preferências da conta.</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-surface-container/30 border-r border-border-subtle p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-3 rounded-lg font-label-md transition-colors flex items-center gap-3 ${
              activeTab === 'profile' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-on-surface hover:bg-surface-faint'
            }`}
          >
            <span className="material-symbols-outlined">person</span>
            Perfil
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-lg font-label-md transition-colors flex items-center gap-3 ${
              activeTab === 'security' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-on-surface hover:bg-surface-faint'
            }`}
          >
            <span className="material-symbols-outlined">lock</span>
            Segurança
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-3 rounded-lg font-label-md transition-colors flex items-center gap-3 ${
              activeTab === 'notifications' 
                ? 'bg-primary/10 text-primary font-bold' 
                : 'text-on-surface hover:bg-surface-faint'
            }`}
          >
            <span className="material-symbols-outlined">notifications</span>
            Notificações
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-4">Informações Pessoais</h3>
              
              {profileMsg.text && (
                <div className={`p-3 rounded-lg text-sm font-bold ${profileMsg.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-status-success/20 text-status-success'}`}>
                  {profileMsg.text}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
                  <span className="material-symbols-outlined text-[32px]">account_circle</span>
                </div>
                <div>
                  <button className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-sm font-bold text-on-surface transition-colors border border-border-subtle">
                    Alterar Foto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Nome Completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Empresa/Organização</label>
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Email</label>
                  <input type="email" value={user.email || ''} disabled className="w-full bg-surface-container border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface-variant opacity-70" />
                </div>
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end">
                <button onClick={handleProfileUpdate} className="px-6 py-2.5 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-bold transition-colors">
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-4">Segurança e Senha</h3>
              
              {pwdMsg.text && (
                <div className={`p-3 rounded-lg text-sm font-bold ${pwdMsg.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-status-success/20 text-status-success'}`}>
                  {pwdMsg.text}
                </div>
              )}

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Senha Atual</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Nova Senha</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-sm text-on-surface-variant">Confirmar Nova Senha</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="pt-4 border-t border-border-subtle flex justify-end">
                <button onClick={handlePasswordUpdate} className="px-6 py-2.5 bg-primary hover:bg-surface-tint text-on-primary rounded-lg font-bold transition-colors">
                  Atualizar Senha
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-4">Preferências de Notificação</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-faint">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary bg-surface border-border-subtle rounded" />
                  <div>
                    <p className="font-bold text-on-surface">Alerta de Outliers</p>
                    <p className="text-sm text-on-surface-variant">Receber email quando uma loja cair para nível crítico.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-faint">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary bg-surface border-border-subtle rounded" />
                  <div>
                    <p className="font-bold text-on-surface">Resumo Semanal</p>
                    <p className="text-sm text-on-surface-variant">Receber relatório semanal consolidado do NPS das lojas.</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
