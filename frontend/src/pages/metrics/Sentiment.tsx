import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const Sentiment = () => {
  const [data, setData] = useState<any>({ distribution: [], comments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/sentiments');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching sentiments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getBadgeColor = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === 'positivo') return 'bg-status-success/20 text-status-success';
    if (s === 'negativo') return 'bg-status-error/20 text-status-error';
    return 'bg-secondary/20 text-secondary';
  };

  const getPieColor = (name: string) => {
    if (name === 'Positivo') return '#346E4A';
    if (name === 'Negativo') return '#E04403';
    return '#525f78';
  };

  const pieData = data.distribution.map((d: any) => ({
    ...d,
    color: getPieColor(d.name)
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Análise de Sentimentos</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Distribuição do sentimento e amostra de comentários por polaridade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição */}
        <div className="bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5">
          <h3 className="font-headline-md text-[16px] font-semibold text-on-surface mb-6">Distribuição Geral</h3>
          <div className="h-64">
            {loading ? (
               <div className="h-full flex items-center justify-center text-on-surface-variant">Carregando...</div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderRadius: '8px', color: '#FFFFFF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">Sem dados disponíveis</div>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
             {pieData.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between font-body-sm text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span>{s.name}</span>
                </div>
                <span className="font-data-tabular font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amostra de Comentários */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 flex flex-col">
          <h3 className="font-headline-md text-[16px] font-semibold text-on-surface mb-6">Amostra Recente de Comentários</h3>
          <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2">
            {loading ? (
               <div className="h-full flex items-center justify-center text-on-surface-variant">Carregando...</div>
            ) : data.comments.length > 0 ? (
              data.comments.map((c: any, i: number) => (
                <div key={i} className="p-4 bg-surface-container rounded-lg border border-border-subtle/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-md font-bold text-on-surface">{c.storeName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeColor(c.sentiment)}`}>
                      {c.sentiment}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm font-body-sm italic mb-3">"{c.text}"</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">label</span>
                    <span className="text-xs font-medium text-on-surface-variant">{c.category}</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="py-12 flex items-center justify-center text-on-surface-variant">Nenhum comentário processado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sentiment;
