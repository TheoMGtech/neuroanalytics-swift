import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';

const ComparacaoNPS = () => {
  const { filters, toggleDrawer, activeFilterCount } = useFilters();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
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
      }
    };
    fetchMetrics();
  }, [filters]);

  const evolutionData = data?.evolutionData?.map((item: any) => ({
    month: item.name,
    oldNps: Math.round(item.originalNps || item.nps),
    aiNps: Math.round(item.nps)
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Comparação NPS</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Análise detalhada de como a IA impactou o cálculo do NPS ao longo do tempo.
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

      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
        <h3 className="font-headline-md font-bold text-on-surface mb-6">Evolução: Original vs IA</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="oldNps" name="NPS Original" stroke="#9E9E9E" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="aiNps" name="NPS IA" stroke="#aa3100" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
          <h3 className="font-headline-md font-bold text-on-surface mb-4">Impacto na Classificação</h3>
          <p className="text-sm text-on-surface-variant mb-6">Como a IA redistribuiu os clientes com base nos comentários.</p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold">Promotores Reclassificados</span>
                <span className="text-status-error font-bold">-12%</span>
              </div>
              <p className="text-xs text-on-surface-variant">Clientes que deram nota 9-10 mas relataram problemas (ex: "A carne é boa mas demorou muito para entregar").</p>
            </div>
            
            <hr className="border-border-subtle" />
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold">Neutros Reclassificados</span>
                <span className="text-status-error font-bold">-8%</span>
              </div>
              <p className="text-xs text-on-surface-variant">Clientes que deram nota 7-8 mas mostraram viés claro de detração no comentário.</p>
            </div>
            
            <hr className="border-border-subtle" />
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold">Detratores Identificados</span>
                <span className="text-status-error font-bold">+20%</span>
              </div>
              <p className="text-xs text-on-surface-variant">O total de detratores/tocadores aumentou significativamente com o ajuste da IA.</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
          <h3 className="font-headline-md font-bold text-on-surface mb-4">Distribuição Comparativa</h3>
          <div className="flex h-[200px] gap-8 mt-8">
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex flex-col text-center">
                <div className="h-[120px] bg-status-success/60 rounded-t-lg flex items-center justify-center text-white font-bold text-sm">60%</div>
                <div className="h-[30px] bg-secondary/60 flex items-center justify-center text-white font-bold text-sm">15%</div>
                <div className="h-[50px] bg-status-error/60 flex items-center justify-center text-white font-bold text-sm">25%</div>
              </div>
              <span className="text-center text-sm font-bold mt-4">Original</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex flex-col text-center">
                <div className="h-[96px] bg-status-success rounded-t-lg flex items-center justify-center text-white font-bold text-sm">48%</div>
                <div className="h-[24px] bg-secondary flex items-center justify-center text-white font-bold text-sm">12%</div>
                <div className="h-[80px] bg-status-error flex items-center justify-center text-white font-bold text-sm">40%</div>
              </div>
              <span className="text-center text-sm font-bold mt-4">IA</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-8 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-status-success rounded-full"></span> Promotores</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-secondary rounded-full"></span> Neutros</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-status-error rounded-full"></span> Detratores</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparacaoNPS;
