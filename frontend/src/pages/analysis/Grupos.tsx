import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

const Grupos = () => {
  const { toggleDrawer, activeFilterCount, filters } = useFilters();
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

  // Aggregate categories
  const categories = data?.categoryData || [];
  
  // Sort and slice top 5 for promoters
  const temasPromotores = categories
    .map((c: any) => ({ tema: c.category, freq: c.promoters }))
    .filter((c: any) => c.freq > 0)
    .sort((a: any, b: any) => b.freq - a.freq)
    .slice(0, 5);

  // Sort and slice top 5 for detractors
  const temasDetratores = categories
    .map((c: any) => ({ tema: c.category, freq: c.detractors }))
    .filter((c: any) => c.freq > 0)
    .sort((a: any, b: any) => b.freq - a.freq)
    .slice(0, 5);

  const totalPromoters = categories.reduce((acc: number, c: any) => acc + c.promoters, 0);
  const totalDetractors = categories.reduce((acc: number, c: any) => acc + c.detractors, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Promotores x Detratores</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Comparação de temas e comportamentos entre os grupos, com base na classificação da IA.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 border-t-4 border-t-status-success">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-success">sentiment_very_satisfied</span>
                  Promotores
                </h3>
                <span className="text-2xl font-bold text-status-success">{totalPromoters.toLocaleString()}</span>
              </div>
              
              <h4 className="font-bold text-sm text-on-surface-variant mb-4">Temas mais citados</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={temasPromotores} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis dataKey="tema" type="category" axisLine={false} tickLine={false} width={120} fontSize={12} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '8px'}} />
                    <Bar dataKey="freq" fill="#4caf50" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 border-t-4 border-t-status-error">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-error">sentiment_dissatisfied</span>
                  Detratores
                </h3>
                <span className="text-2xl font-bold text-status-error">{totalDetractors.toLocaleString()}</span>
              </div>
              
              <h4 className="font-bold text-sm text-on-surface-variant mb-4">Temas mais citados</h4>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={temasDetratores} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis dataKey="tema" type="category" axisLine={false} tickLine={false} width={120} fontSize={12} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{borderRadius: '8px'}} />
                    <Bar dataKey="freq" fill="#f44336" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 mt-6">
            <h3 className="font-headline-md font-bold text-on-surface mb-6">Palavras-chave em destaque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-status-success/10 text-status-success rounded-full text-sm font-medium border border-status-success/20">carne macia</span>
                <span className="px-3 py-1 bg-status-success/10 text-status-success rounded-full text-sm font-medium border border-status-success/20">atendente simpático</span>
                <span className="px-3 py-1 bg-status-success/10 text-status-success rounded-full text-sm font-medium border border-status-success/20">loja limpa</span>
                <span className="px-3 py-1 bg-status-success/10 text-status-success rounded-full text-sm font-medium border border-status-success/20">fresquinho</span>
                <span className="px-3 py-1 bg-status-success/10 text-status-success rounded-full text-sm font-medium border border-status-success/20">rápido</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-full text-sm font-medium border border-status-error/20">demora na fila</span>
                <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-full text-sm font-medium border border-status-error/20">muito caro</span>
                <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-full text-sm font-medium border border-status-error/20">faltou picanha</span>
                <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-full text-sm font-medium border border-status-error/20">caixa lento</span>
                <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-full text-sm font-medium border border-status-error/20">atendente grosso</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Grupos;
