import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const HistoryList = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/history');
        setHistory(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Histórico</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Veja as análises anteriores realizadas na plataforma.</p>
        </div>
      </div>
      
      <div className="bg-surface rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 animate-spin">refresh</span>
            <p>Carregando histórico...</p>
          </div>
        ) : history.length === 0 ? (
          <>
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">history</span>
            <h3 className="font-headline-md text-xl font-semibold text-on-surface mb-2">Nenhuma análise encontrada</h3>
            <p className="font-body-md text-on-surface-variant max-w-md">O histórico de análises está vazio. Vá para a tela de Upload para realizar sua primeira análise.</p>
          </>
        ) : (
          <div className="w-full text-left">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-3 px-4">Arquivo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Reviews</th>
                  <th className="py-3 px-4">NPS Geral</th>
                  <th className="py-3 px-4">Ação</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-border-subtle hover:bg-surface-container transition-colors">
                    <td className="py-3 px-4">{item.fileName}</td>
                    <td className="py-3 px-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{item.totalReviews}</td>
                    <td className="py-3 px-4 text-primary font-bold">{item.generalNps.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Link to={`/app/history/${item.id}`} className="text-secondary hover:underline">Ver Detalhes</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryList;
