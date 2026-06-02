import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();
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
          <span className="text-on-secondary-container font-bold text-xs">TS</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
