import { Link } from 'react-router-dom';
import { LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    evolutionData: [],
    storeData: [],
    sentimentData: [],
    insights: [],
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, metricsRes] = await Promise.all([
          api.get('/history'),
          api.get('/dashboard/metrics')
        ]);
        setHistory(historyRes.data);
        setMetrics(metricsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAnalyses = history.length;
  const avgNps = totalAnalyses > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.generalNps, 0) / totalAnalyses) 
    : 0;
  const totalComments = history.reduce((acc, curr) => acc + curr.totalReviews, 0);

  const getSentimentText = () => {
    if (!metrics.sentimentData || metrics.sentimentData.length === 0) return "Neutro";
    const top = [...metrics.sentimentData].sort((a, b) => b.value - a.value)[0];
    return top.name;
  };

  const getSentimentColor = () => {
    const text = getSentimentText();
    if (text === "Positivo") return "text-status-success";
    if (text === "Negativo") return "text-status-error";
    return "text-secondary";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Visão Geral</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Acompanhamento de métricas de satisfação e análise de sentimentos.</p>
        </div>
        <div className="flex gap-2">
          <select className="border border-border-subtle rounded-lg bg-surface px-3 py-1.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-navy-muted">
            <option>Últimos 30 dias</option>
            <option>Este Trimestre</option>
            <option>Este Ano</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Total de Análises</span>
            <span className="material-symbols-outlined text-secondary">analytics</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-display-lg font-bold text-on-surface">{loading ? '...' : totalAnalyses}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-status-success font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Atualizado</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">NPS Médio (Geral)</span>
            <span className="material-symbols-outlined text-primary">speed</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-display-lg font-bold text-primary">{loading ? '...' : avgNps}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
            <span className="px-2 py-0.5 bg-tertiary-container/20 text-tertiary-container rounded-full text-xs font-medium">Zona de Qualidade</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Comentários</span>
            <span className="material-symbols-outlined text-secondary">forum</span>
          </div>
          <div className="mt-2">
            <span className="font-display-lg text-display-lg font-bold text-on-surface">{loading ? '...' : totalComments}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-status-success font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Total processado</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface rounded-xl p-5 border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-tertiary-fixed/20 rounded-bl-full -mr-4 -mt-4 z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-2">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Sentimento Geral</span>
            <span className="material-symbols-outlined text-tertiary-container">mood</span>
          </div>
          <div className="relative z-10 mt-2">
            <span className={`font-headline-lg text-headline-lg font-bold ${getSentimentColor()}`}>{getSentimentText()}</span>
          </div>
          <div className="relative z-10 mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden flex">
              {metrics.sentimentData.map((s: any, i: number) => (
                <div key={i} style={{ width: `${s.value}%`, backgroundColor: s.color }} className="h-full"></div>
              ))}
              {metrics.sentimentData.length === 0 && <div className="w-full bg-surface-variant h-full"></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">show_chart</span>
              Evolução do NPS
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="h-64 w-full">
            {metrics.evolutionData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.evolutionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <Line type="monotone" dataKey="nps" stroke="#aa3100" strokeWidth={3} dot={{ r: 4, fill: '#aa3100' }} activeDot={{ r: 6 }} />
                  <XAxis dataKey="name" stroke="#8f7067" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8f7067" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E0E0E0', borderRadius: '8px', color: '#1b1b1b', fontSize: '12px', fontFamily: 'Inter' }}
                    itemStyle={{ color: '#aa3100', fontWeight: 'bold' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : metrics.evolutionData.length === 1 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant bg-surface-container/30 rounded-lg border border-dashed border-border-subtle">
                <span className="font-display-md text-3xl font-bold text-primary mb-2">{metrics.evolutionData[0].nps} NPS</span>
                <span className="text-sm text-center px-4">Esta é sua primeira análise.<br/>Envie mais dados no futuro para visualizar a evolução do gráfico.</span>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant">Nenhum dado disponível. Envie uma análise.</div>
            )}
          </div>
        </div>

        {/* Pie/Donut Chart */}
        <div className="bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">pie_chart</span>
              Distribuição (Última Análise)
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-48 relative">
            {metrics.sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {metrics.sentimentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E0E0E0', borderRadius: '8px', color: '#1b1b1b', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-on-surface-variant text-sm">Sem dados</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-headline-md text-xl font-bold text-on-surface">{metrics.totalReviews > 0 ? metrics.totalReviews : '-'}</span>
              <span className="font-label-md text-[10px] text-on-surface-variant">Total</span>
            </div>
          </div>
          
          <div className="mt-6 w-full space-y-2">
            {metrics.sentimentData.map((s: any, i: number) => (
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
      </div>

      {/* Bottom Section: Insights & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights List */}
        <div className="bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-surface-container pb-4">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
              Insights da IA
            </h3>
          </div>
          <div className="flex-1 space-y-4">
            {metrics.insights.length > 0 ? metrics.insights.map((insight: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-faint transition-colors group cursor-pointer border border-transparent hover:border-border-subtle">
                <div className={`mt-0.5 p-1.5 rounded-md ${
                  insight.type === 'alert' ? 'bg-status-error/10 text-status-error' :
                  insight.type === 'success' ? 'bg-status-success/10 text-status-success' :
                  'bg-secondary/10 text-secondary'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">{insight.icon}</span>
                </div>
                <div>
                  <h4 className="font-label-md text-sm font-semibold text-on-surface">{insight.title}</h4>
                  <p className="font-body-sm text-sm text-on-surface-variant mt-1">{insight.description}</p>
                </div>
              </div>
            )) : (
              <div className="text-on-surface-variant text-sm py-4">Nenhum insight gerado ainda. Processando mais dados...</div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container">
            <Link to="/app/history">
              <button className="w-full py-2 bg-transparent border border-navy-muted text-navy-muted font-label-md text-sm font-bold rounded-lg hover:bg-surface-container transition-colors">
                Ver análises completas
              </button>
            </Link>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-[16px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
              Avaliações por Loja
            </h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          
          <div className="space-y-4 mt-4 max-h-64 overflow-y-auto pr-2">
            {metrics.storeData.length > 0 ? metrics.storeData.map((store: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between font-label-md text-xs mb-1 text-on-surface-variant">
                  <span>Loja {store.name}</span>
                  <span className="font-data-tabular">NPS: {store.nps}</span>
                </div>
                <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, store.nps)}%`, backgroundColor: store.color }}></div>
                </div>
              </div>
            )) : (
              <div className="text-on-surface-variant text-sm">Nenhum dado disponível.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
