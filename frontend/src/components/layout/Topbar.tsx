import { useNavigate } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext';

const Topbar = () => {
  const navigate = useNavigate();
  const { toggleDrawer, activeFilterCount } = useFilters();
  const user = JSON.parse(localStorage.getItem('user') || '{"name": "Usuário"}');
  
  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const initials = getInitials(user.name);
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] z-40 bg-surface border-b border-border-subtle flex justify-between items-center h-16 px-gutter">
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-2 border border-border-subtle rounded-lg bg-surface text-on-surface focus:outline-none focus:border-navy-muted focus:ring-1 focus:ring-navy-muted font-body-sm text-body-sm w-64 transition-shadow"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleDrawer}
          className="flex items-center gap-2 px-3 py-1.5 border border-border-subtle rounded-lg hover:bg-surface-faint transition-colors relative"
        >
          <span className="material-symbols-outlined text-on-surface-variant">filter_alt</span>
          <span className="font-body-sm font-medium text-on-surface-variant">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-on-primary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-border-subtle"></div>

        <div className="flex items-center gap-3 text-on-surface-variant">
          <button className="hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/app/upload')}
          className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg hover:bg-surface-tint transition-colors text-sm"
        >
          Nova Análise
        </button>

        <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden border border-border-subtle flex items-center justify-center">
          <span className="text-on-secondary-container font-bold text-xs" title={user.name}>{initials}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
