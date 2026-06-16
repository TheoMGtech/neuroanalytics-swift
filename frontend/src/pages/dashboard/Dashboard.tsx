import { Link } from 'react-router-dom';
import { useFilters } from '../../context/FilterContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const { filters, toggleDrawer, activeFilterCount } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/metrics', {
          params: {
            start_date: filters.startDate,
            end_date: filters.endDate,
            store: filters.store,
            flag: filters.flag
          }
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [filters]);

  const metrics = {
    totalReviews: data?.totalReviews || 0,
    reclassifiedReviews: data?.reclassifiedCount || 0,
    confidenceAvg: 92.4, // Média geral
    oldNps: Math.round(data?.originalNps || 0),
    aiNps: Math.round(data?.generalNps || 0),
  };

  const diffNps = metrics.aiNps - metrics.oldNps;
  
  // Use real stores and originalNps
  const topStores = (data?.storeData || [])
    .slice(0, 5)
    .map((s: any) => ({
      name: s.name,
      new: Math.round(s.nps),
      old: Math.round(s.originalNps || s.nps),
      diff: Math.round(s.nps) - Math.round(s.originalNps || s.nps)
    }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Visão Geral</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Análise geral do NPS, impacto da IA e principais insights de reclassificação.
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
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* NPS Antigo */}
            <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-on-surface-variant uppercase">NPS Original</span>
                <span className="material-symbols-outlined text-secondary">history</span>
              </div>
              <div className="mt-2">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">{metrics.oldNps}</span>
              </div>
              <div className="mt-2 text-on-surface-variant font-body-sm text-sm">
                Cálculo tradicional da base
              </div>
            </div>

            {/* NPS IA */}
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-primary uppercase font-bold">NPS IA</span>
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
              </div>
              <div className="mt-2">
                <span className="font-display-lg text-display-lg font-bold text-primary">{metrics.aiNps}</span>
              </div>
              <div className="mt-2 text-primary/80 font-body-sm text-sm">
                Após reclassificação
              </div>
            </div>

            {/* Diferença */}
            <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-on-surface-variant uppercase">Diferença</span>
                <span className="material-symbols-outlined text-status-error">trending_down</span>
              </div>
              <div className="mt-2">
                <span className="font-display-lg text-display-lg font-bold text-status-error">{diffNps}</span>
              </div>
              <div className="mt-2 text-status-error font-body-sm text-sm">
                Pontos de NPS perdidos
              </div>
            </div>

            {/* Avaliações Totais */}
            <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-on-surface-variant uppercase">Total de Avaliações</span>
                <span className="material-symbols-outlined text-secondary">forum</span>
              </div>
              <div className="mt-2">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">{metrics.totalReviews.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-on-surface-variant font-body-sm text-sm">
                Neste período
              </div>
            </div>

            {/* Reclassificadas */}
            <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="font-label-md text-on-surface-variant uppercase">Reclassificadas</span>
                <span className="material-symbols-outlined text-secondary">find_replace</span>
              </div>
              <div className="mt-2">
                <span className="font-display-lg text-display-lg font-bold text-on-surface">{metrics.reclassifiedReviews.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-on-surface-variant font-body-sm text-sm">
                {metrics.totalReviews > 0 ? ((metrics.reclassifiedReviews / metrics.totalReviews) * 100).toFixed(1) : 0}% da base
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Why did it change? Insights Section */}
            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">psychology</span>
                <h3 className="font-headline-md font-bold text-on-surface">Por que o NPS mudou?</h3>
              </div>
              <p className="text-on-surface-variant mb-6 text-sm">
                A Inteligência Artificial reclassificou algumas avaliações com base na inconsistência entre a nota dada pelo cliente e o sentimento real expresso no comentário.
              </p>

              <div className="space-y-4">
                {data?.insights?.length > 0 ? (
                  data.insights.map((insight: any, idx: number) => {
                    // Define styles and icons based on the type
                    let bgClass = "bg-surface border-border-subtle";
                    let textClass = "text-on-surface";
                    let iconClass = "text-on-surface-variant";
                    let icon = insight.icon || "info";

                    if (insight.type === "error" || (insight.title && insight.title.includes("Detrator"))) {
                      bgClass = "bg-status-error/10 border-status-error/20";
                      textClass = "text-status-error";
                      iconClass = "text-status-error";
                    } else if (insight.type === "info" || insight.type === "success") {
                      bgClass = "bg-secondary/10 border-secondary/20";
                      textClass = "text-secondary";
                      iconClass = "text-secondary";
                    }

                    return (
                      <div key={idx} className={`flex gap-4 p-4 rounded-lg border ${bgClass}`}>
                        <span className={`material-symbols-outlined mt-0.5 ${iconClass}`}>{icon}</span>
                        <div>
                          <h4 className={`font-bold text-sm ${textClass}`}>
                            {insight.title || insight.rule}
                          </h4>
                          <p className={`text-xs mt-1 ${textClass}/80`}>{insight.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-on-surface-variant text-sm text-center py-4">Nenhuma reclassificação significativa nesta análise.</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <Link to="/app/explicabilidade" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                  Ver regras detalhadas de reclassificação
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Mock Chart Area (Replace later) */}
            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant text-[24px]">compare</span>
                <h3 className="font-headline-md font-bold text-on-surface">Diferença por Loja (Top 5)</h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-6">
                {topStores.map((store: any) => (
                  <div key={store.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-on-surface">{store.name}</span>
                      <span className="font-bold text-status-error">{store.diff} pts</span>
                    </div>
                    <div className="relative h-4 bg-surface-container rounded-full overflow-hidden flex">
                      {/* Fake stacked bar for old vs new */}
                      <div className="absolute top-0 bottom-0 left-0 bg-primary/30" style={{ width: `${store.old}%` }}></div>
                      <div className="absolute top-0 bottom-0 left-0 bg-primary" style={{ width: `${store.new}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-on-surface-variant">
                      <span>NPS Original: {store.old}</span>
                      <span>NPS IA: {store.new}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-border-subtle">
                <Link to="/app/lojas" className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                  Ver ranking completo de lojas
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
