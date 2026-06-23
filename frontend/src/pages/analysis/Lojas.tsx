import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';
import { buildFilterParams } from '../../utils/filterParams';
import { testFeaturesEnabled } from '../../config/features';

const Lojas = () => {
  const { toggleDrawer, activeFilterCount, filters } = useFilters();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/metrics', {
          params: buildFilterParams(filters)
        });
        
        if (response.data.storeData) {
          const mapped = response.data.storeData.map((s: any, index: number) => {
            const aiNps = Math.round(s.nps);
            const oldNps = Math.round(s.originalNps || s.nps);
            return {
              id: index,
              name: s.name,
              aiNps,
              oldNps,
              diff: aiNps - oldNps,
              promotores: s.promoters || 0,
              neutros: s.neutral || 0,
              detratores: s.detractors || 0,
              sentimentAverage: Number(s.sentimentAverage || 0),
              topProblems: s.topProblems || [],
              topPraises: s.topPraises || [],
              alert: Boolean(s.alert)
            };
          });
          setData(mapped.sort((a: any, b: any) => a.diff - b.diff));
        }
      } catch (error) {
        console.error('Error fetching stores metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Visão por Lojas</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Ranking das lojas e impacto da reclassificação da IA no NPS de cada unidade.
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
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-on-surface">
              <thead className="bg-surface-faint border-b border-border-subtle text-on-surface-variant text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Loja</th>
                  <th className="px-6 py-4 text-center">NPS Original</th>
                  <th className="px-6 py-4 text-center text-primary">NPS IA</th>
                  <th className="px-6 py-4 text-center">Diferença</th>
                  <th className="px-6 py-4 text-center">Promotores</th>
                  <th className="px-6 py-4 text-center">Neutros</th>
                  <th className="px-6 py-4 text-center">Detratores</th>
                  {testFeaturesEnabled && (
                    <>
                      <th className="px-6 py-4 text-center">Sentimento</th>
                      <th className="px-6 py-4">Top 3 Problemas</th>
                      <th className="px-6 py-4">Top 3 Elogios</th>
                      <th className="px-6 py-4 text-center">Alerta</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.map((store) => (
                  <tr key={store.id} className="hover:bg-surface-faint transition-colors">
                    <td className="px-6 py-4 font-bold">{store.name}</td>
                    <td className="px-6 py-4 text-center">{store.oldNps}</td>
                    <td className="px-6 py-4 text-center font-bold text-primary">{store.aiNps}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        store.diff < -10 ? 'bg-status-error/10 text-status-error' :
                        store.diff < 0 ? 'bg-secondary/10 text-secondary' :
                        store.diff > 0 ? 'bg-status-success/10 text-status-success' :
                        'bg-surface-variant text-on-surface-variant'
                      }`}>
                        {store.diff > 0 ? '+' : ''}{store.diff}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-status-success">{store.promotores}</td>
                    <td className="px-6 py-4 text-center text-secondary">{store.neutros}</td>
                    <td className="px-6 py-4 text-center text-status-error">{store.detratores}</td>
                    {testFeaturesEnabled && (
                      <>
                        <td className="px-6 py-4 text-center font-bold">{store.sentimentAverage.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {store.topProblems.length ? store.topProblems.map((item: any) => (
                              <span key={item.name} className="px-2 py-1 rounded bg-status-error/10 text-status-error text-xs font-bold">
                                {item.name} ({item.count})
                              </span>
                            )) : <span className="text-on-surface-variant text-xs">Sem volume negativo</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {store.topPraises.length ? store.topPraises.map((item: any) => (
                              <span key={item.name} className="px-2 py-1 rounded bg-status-success/10 text-status-success text-xs font-bold">
                                {item.name} ({item.count})
                              </span>
                            )) : <span className="text-on-surface-variant text-xs">Sem volume positivo</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {store.alert ? (
                            <span className="material-symbols-outlined text-status-error">warning</span>
                          ) : (
                            <span className="material-symbols-outlined text-status-success">check_circle</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lojas;
