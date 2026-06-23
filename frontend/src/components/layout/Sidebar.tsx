import { Link, useLocation } from 'react-router-dom';
import { testFeaturesEnabled } from '../../config/features';

const Sidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{"name": "Usuário", "company": "Empresa"}');

  const menuItems = [
    { name: 'Visão Geral', icon: 'dashboard', path: '/app/dashboard' },
    { name: 'Nova Análise', icon: 'add_chart', path: '/app/upload' },
    { name: 'Comparação NPS', icon: 'compare_arrows', path: '/app/comparacao' },
    { name: 'Gestão: Regular x Tocadora', icon: 'store', path: '/app/gestao' },
    { name: 'Promotores x Detratores', icon: 'groups', path: '/app/grupos' },
    { name: 'Visão por Lojas', icon: 'storefront', path: '/app/lojas' },
    { name: 'Explicabilidade IA', icon: 'memory', path: '/app/explicabilidade' },
    { name: 'Comentários', icon: 'forum', path: '/app/comentarios' },
    ...(testFeaturesEnabled
      ? [{ name: 'Relatório Executivo', icon: 'summarize', path: '/app/relatorio' }]
      : []),
    { name: 'Histórico', icon: 'history', path: '/app/history' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-navy-muted shadow-sm flex flex-col p-base z-50">
      <div className="px-4 py-6 mb-4 flex flex-col gap-1">
        <img src="/swift-logo.png" alt="Swift Logo" className="h-12 w-auto object-contain object-left mb-3" />
        <h1 className="font-headline-md text-[22px] leading-tight font-bold text-on-primary tracking-wide">NeuroAnalytics</h1>
        <p className="font-body-sm text-sm text-secondary-fixed-dim mt-1 truncate" title={`${user.name} - ${user.company}`}>{user.name} - {user.company}</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto hide-scrollbar">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-95 transition-transform ${
                isActive
                  ? 'text-on-primary bg-primary font-bold'
                  : 'text-secondary-fixed-dim hover:text-on-primary hover:bg-on-secondary-fixed-variant'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}

        <div className="mt-auto flex flex-col gap-1">
          <Link
            to="/app/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-95 transition-transform ${
              location.pathname.startsWith('/app/settings')
                ? 'text-on-primary bg-primary font-bold'
                : 'text-secondary-fixed-dim hover:text-on-primary hover:bg-on-secondary-fixed-variant'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            Configurações
          </Link>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 text-secondary-fixed-dim hover:text-on-primary hover:bg-on-secondary-fixed-variant transition-colors rounded-xl active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            Sair
          </a>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
