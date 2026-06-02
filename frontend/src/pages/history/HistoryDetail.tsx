import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../../services/api';

const HistoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/history/${id}`);
        setAnalysis(response.data);
      } catch (error) {
        console.error('Error fetching detail', error);
        alert('Erro ao carregar detalhes');
        navigate('/app/history');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta análise?')) return;
    try {
      await api.delete(`/history/${id}`);
      navigate('/app/history');
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant animate-spin">refresh</span>
      </div>
    );
  }

  if (!analysis) return null;

  const outliersCount = analysis.storeResults?.filter((s: any) => s.isOutlier).length || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/app/history')} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{analysis.fileName}</h1>
          <p className="text-gray-400">Analisado em {new Date(analysis.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-auto">
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-error-container text-on-error-container hover:bg-error/20 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
            <span className="font-semibold text-sm">Excluir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Reviews</p>
            <p className="text-2xl font-bold text-white">{analysis.totalReviews}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">speed</span>
          </div>
          <div>
            <p className="text-sm text-gray-400">NPS Geral</p>
            <p className="text-2xl font-bold text-primary">{analysis.generalNps.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-[#E30613]/20">
          <div className="w-12 h-12 bg-[#E30613]/10 text-[#E30613] rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Lojas Outliers</p>
            <p className="text-2xl font-bold text-[#E30613]">{outliersCount}</p>
          </div>
        </Card>
      </div>

      <Card title="Amostra de Comentários">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#222222]">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">ID</th>
                <th className="px-6 py-3">Loja</th>
                <th className="px-6 py-3">Comentário</th>
                <th className="px-6 py-3">Nota</th>
                <th className="px-6 py-3 rounded-tr-lg">Sentimento</th>
              </tr>
            </thead>
            <tbody>
              {analysis.commentResults?.map((row: any, index: number) => (
                <tr key={row.id || index} className="border-b border-[#222222] hover:bg-[#222222]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-300">{index + 1}</td>
                  <td className="px-6 py-4 text-white">{row.storeName}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{row.content}</td>
                  <td className="px-6 py-4 font-bold">{row.score}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      row.sentiment?.toLowerCase() === 'positivo' ? 'positive' : 
                      row.sentiment?.toLowerCase() === 'negativo' ? 'negative' : 'neutral'
                    }>
                      {row.sentiment || 'Neutro'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {(!analysis.commentResults || analysis.commentResults.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma amostra de comentário salva.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default HistoryDetail;
