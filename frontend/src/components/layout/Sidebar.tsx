import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/app/dashboard' },
    { name: 'Nova Análise', icon: 'add_chart', path: '/app/upload' },
    { name: 'Métricas', icon: 'analytics', path: '/app/metrics' },
    { name: 'Sentimentos', icon: 'psychology', path: '/app/sentiment' },
    { name: 'Outliers', icon: 'error_outline', path: '/app/outliers' },
    { name: 'Categorias', icon: 'category', path: '/app/categories' },
    { name: 'Histórico', icon: 'history', path: '/app/history' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-navy-muted shadow-sm flex flex-col p-base z-50">
      <div className="px-4 py-6 mb-4 flex flex-col gap-1">
        <img src="/swift-logo.png" alt="Swift Logo" className="h-12 w-auto object-contain object-left mb-3" />
        <h1 className="font-headline-md text-[22px] leading-tight font-bold text-on-primary tracking-wide">NeuroAnalytics</h1>
        <p className="font-body-sm text-sm text-secondary-fixed-dim mt-1">Theo - Swift</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
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
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 text-secondary-fixed-dim hover:text-on-primary hover:bg-on-secondary-fixed-variant transition-colors rounded-xl active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">logout</span>
            Sair
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
