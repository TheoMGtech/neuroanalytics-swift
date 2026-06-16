import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';
import { buildFilterParams } from '../../utils/filterParams';

const Gestao = () => {
  const { toggleDrawer, activeFilterCount, filters } = useFilters();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/metrics', {
          params: buildFilterParams(filters)
        });
        if (response.data.managementData) {
          setData(response.data.managementData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados de gestão:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const regularData = data.find(d => d.flag === 'REGULAR') || { flag: 'REGULAR', nps: 0, totalReviews: 0, promoters: 0, neutral: 0, detractors: 0 };
  const tocadoraData = data.find(d => d.flag === 'TOCADORA') || { flag: 'TOCADORA', nps: 0, totalReviews: 0, promoters: 0, neutral: 0, detractors: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Gestão: Regular x Tocadora</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Comparativo de performance (NPS) e avaliações separadas por modelo de gestão da loja.
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={toggleDrawer}
             className="flex items-center gap-2 bg-surface border border-border-subtle text-on-surface hover:bg-surface-faint font-bold px-4 py-2 rounded-lg transition-colors text-sm"
           >
             <span className="material-symbols-outlined text-[18px]">filter_alt</span>
             Filtrar Dados
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* REGULAR */}
          <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
            <div className="bg-primary/10 p-6 border-b border-primary/20 text-center relative">
              <span className="material-symbols-outlined absolute top-4 left-4 text-primary opacity-20 text-6xl">store</span>
              <h3 className="font-headline-md font-bold text-primary relative z-10">REGULAR</h3>
              <p className="text-sm text-on-surface-variant mt-1 relative z-10">Modelo padrão de gestão</p>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center border-b border-border-subtle">
              <span className="text-sm text-on-surface-variant uppercase font-bold tracking-widest mb-2">NPS Global</span>
              <div className={`text-6xl font-black ${
                regularData.nps >= 75 ? 'text-status-success' : regularData.nps >= 50 ? 'text-secondary' : 'text-status-error'
              }`}>
                {regularData.nps.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border-subtle p-6 bg-surface-faint">
              <div className="flex flex-col items-center">
                <span className="text-status-success font-bold text-2xl">{regularData.promoters}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Promotores</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-secondary font-bold text-2xl">{regularData.neutral}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Neutros</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-status-error font-bold text-2xl">{regularData.detractors}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Detratores</span>
              </div>
            </div>
            
            <div className="p-4 text-center text-sm font-bold text-on-surface bg-surface border-t border-border-subtle">
              Total de Avaliações: {regularData.totalReviews}
            </div>
          </div>

          {/* TOCADORA */}
          <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
            <div className="bg-secondary/10 p-6 border-b border-secondary/20 text-center relative">
              <span className="material-symbols-outlined absolute top-4 left-4 text-secondary opacity-20 text-6xl">verified_user</span>
              <h3 className="font-headline-md font-bold text-secondary relative z-10">TOCADORA</h3>
              <p className="text-sm text-on-surface-variant mt-1 relative z-10">Modelo diferenciado</p>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center border-b border-border-subtle">
              <span className="text-sm text-on-surface-variant uppercase font-bold tracking-widest mb-2">NPS Global</span>
              <div className={`text-6xl font-black ${
                tocadoraData.nps >= 75 ? 'text-status-success' : tocadoraData.nps >= 50 ? 'text-secondary' : 'text-status-error'
              }`}>
                {tocadoraData.nps.toFixed(1)}
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border-subtle p-6 bg-surface-faint">
              <div className="flex flex-col items-center">
                <span className="text-status-success font-bold text-2xl">{tocadoraData.promoters}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Promotores</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-secondary font-bold text-2xl">{tocadoraData.neutral}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Neutros</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-status-error font-bold text-2xl">{tocadoraData.detractors}</span>
                <span className="text-xs text-on-surface-variant uppercase mt-1">Detratores</span>
              </div>
            </div>
            
            <div className="p-4 text-center text-sm font-bold text-on-surface bg-surface border-t border-border-subtle">
              Total de Avaliações: {tocadoraData.totalReviews}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Gestao;
