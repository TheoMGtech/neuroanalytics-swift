import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import api from '../../services/api';

const Metrics = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/history');
        setHistory(response.data);
      } catch (error) {}
    };
    fetchHistory();
  }, []);

  const totalReviews = history.reduce((acc, curr) => acc + curr.totalReviews, 0);
  const avgNps = history.length > 0 ? (history.reduce((acc, curr) => acc + curr.generalNps, 0) / history.length).toFixed(2) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Métricas de Performance</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <p className="text-sm text-gray-400">Total de Avaliações Processadas</p>
          <p className="text-4xl font-bold text-white mt-2">{totalReviews}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400">NPS Global</p>
          <p className="text-4xl font-bold text-primary mt-2">{avgNps}</p>
        </Card>
      </div>
    </div>
  );
};

export default Metrics;
