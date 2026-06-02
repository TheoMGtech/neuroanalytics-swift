import { useEffect, useState } from 'react';
import api from '../../services/api';

const Outliers = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/outliers');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching outliers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Detecção de Outliers</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Lojas que destoam significativamente do padrão geral de qualidade (método IQR).</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-on-surface-variant">Carregando...</div>
      ) : data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((store, i) => (
            <div key={i} className="bg-surface rounded-xl border border-status-error/30 shadow-[0_4px_12px_rgba(224,68,3,0.1)] p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-status-error/10 rounded-bl-full -mr-2 -mt-2"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-status-error">warning</span>
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">{store.storeName}</h3>
                </div>
              </div>
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                  <span className="text-on-surface-variant text-sm">NPS</span>
                  <span className="font-bold text-status-error text-xl">{store.nps}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                  <span className="text-on-surface-variant text-sm">Avaliações Totais</span>
                  <span className="font-medium text-on-surface">{store.totalReviews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant text-sm">Detratores</span>
                  <span className="font-medium text-on-surface">{store.detractors}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center">
          <span className="material-symbols-outlined text-status-success text-5xl mb-4">check_circle</span>
          <h3 className="text-xl font-bold text-on-surface">Nenhum Outlier Detectado</h3>
          <p className="text-on-surface-variant mt-2">Todas as lojas estão operando dentro do padrão de qualidade esperado na última análise.</p>
        </div>
      )}
    </div>
  );
};

export default Outliers;
