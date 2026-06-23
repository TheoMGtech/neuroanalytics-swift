import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../services/api';
import { buildFilterParams } from '../../utils/filterParams';
import { testFeaturesEnabled } from '../../config/features';

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
  const percent = (value: number, total: number) => total ? Number(((value / total) * 100).toFixed(1)) : 0;
  const npsChartData = [
    { gestao: 'Regular', original: Number((regularData.originalNps || 0).toFixed(1)), ajustado: Number((regularData.nps || 0).toFixed(1)) },
    { gestao: 'Tocadora', original: Number((tocadoraData.originalNps || 0).toFixed(1)), ajustado: Number((tocadoraData.nps || 0).toFixed(1)) },
  ];
  const mixChartData = [
    {
      gestao: 'Regular',
      Promotores: percent(regularData.promoters || 0, regularData.totalReviews || 0),
      Neutros: percent(regularData.neutral || 0, regularData.totalReviews || 0),
      Detratores: percent(regularData.detractors || 0, regularData.totalReviews || 0),
    },
    {
      gestao: 'Tocadora',
      Promotores: percent(tocadoraData.promoters || 0, tocadoraData.totalReviews || 0),
      Neutros: percent(tocadoraData.neutral || 0, tocadoraData.totalReviews || 0),
      Detratores: percent(tocadoraData.detractors || 0, tocadoraData.totalReviews || 0),
    },
  ];
  const topicComparison = (field: 'topProblems' | 'topPraises') => {
    const labels = Array.from(new Set([
      ...(regularData[field] || []).map((item: any) => item.name),
      ...(tocadoraData[field] || []).map((item: any) => item.name),
    ])).slice(0, 6);
    return labels.map((label) => ({
      categoria: label,
      Regular: regularData[field]?.find((item: any) => item.name === label)?.count || 0,
      Tocadora: tocadoraData[field]?.find((item: any) => item.name === label)?.count || 0,
    }));
  };
  const npsGap = (regularData.nps || 0) - (tocadoraData.nps || 0);
  const reclassImpactRegular = (regularData.nps || 0) - (regularData.originalNps || 0);
  const reclassImpactTocadora = (tocadoraData.nps || 0) - (tocadoraData.originalNps || 0);
  const insights = [
    npsGap >= 0
      ? `Regular está ${npsGap.toFixed(1)} pontos acima de Tocadora no NPS ajustado.`
      : `Tocadora está ${Math.abs(npsGap).toFixed(1)} pontos acima de Regular no NPS ajustado.`,
    `A reclassificação por comentário alterou Regular em ${reclassImpactRegular.toFixed(1)} pontos e Tocadora em ${reclassImpactTocadora.toFixed(1)} pontos.`,
    `O principal problema em Regular é ${regularData.topProblems?.[0]?.name || 'sem destaque'}; em Tocadora é ${tocadoraData.topProblems?.[0]?.name || 'sem destaque'}.`,
  ];

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
        <>
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

        {testFeaturesEnabled && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
                <h3 className="font-headline-md font-bold text-on-surface mb-4">NPS Original x NPS Ajustado</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={npsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                      <XAxis dataKey="gestao" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0' }} />
                      <Legend />
                      <Bar dataKey="original" name="NPS Original" fill="#8d827c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ajustado" name="NPS Ajustado" fill="#aa3100" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
                <h3 className="font-headline-md font-bold text-on-surface mb-4">Composição por classificação ajustada</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mixChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
                      <XAxis type="number" unit="%" axisLine={false} tickLine={false} />
                      <YAxis dataKey="gestao" type="category" axisLine={false} tickLine={false} width={80} />
                      <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0' }} />
                      <Legend />
                      <Bar dataKey="Promotores" stackId="a" fill="#346E4A" />
                      <Bar dataKey="Neutros" stackId="a" fill="#525f78" />
                      <Bar dataKey="Detratores" stackId="a" fill="#E04403" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
                <h3 className="font-headline-md font-bold text-on-surface mb-4">Problemas que puxam a diferença</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicComparison('topProblems')} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="categoria" type="category" axisLine={false} tickLine={false} width={130} fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0' }} />
                      <Legend />
                      <Bar dataKey="Regular" fill="#aa3100" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Tocadora" fill="#525f78" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6">
                <h3 className="font-headline-md font-bold text-on-surface mb-4">Elogios que sustentam o resultado</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicComparison('topPraises')} layout="vertical" margin={{ top: 10, right: 20, left: 70, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E0E0" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="categoria" type="category" axisLine={false} tickLine={false} width={130} fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E0E0E0' }} />
                      <Legend />
                      <Bar dataKey="Regular" fill="#346E4A" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Tocadora" fill="#8390aa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 mt-6">
              <h3 className="font-headline-md font-bold text-on-surface mb-4">Insights executivos da diferença</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight) => (
                  <div key={insight} className="p-4 rounded-lg border border-border-subtle bg-surface-faint text-sm text-on-surface">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        </>
      )}
    </div>
  );
};

export default Gestao;
