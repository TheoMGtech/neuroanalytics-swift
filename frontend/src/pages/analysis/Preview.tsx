import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { testFeaturesEnabled } from '../../config/features';

const Preview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result;
  
  if (!result) {
    navigate('/app/upload');
    return null;
  }
  
  const { summary, store_results, comments_sample, analysis_id } = result;
  
  // Calculate outliers from store_results
  const outliersCount = store_results?.filter((s: any) => s.is_outlier).length || 0;

  const handleDownloadCsv = async () => {
    if (!analysis_id) return;
    const response = await api.get('/dashboard/comments-export', {
      params: { analysis_id },
      responseType: 'blob'
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `base-inferencia-teste-${analysis_id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161616] p-6 rounded-2xl border border-[#222222]">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Análise Concluída com Sucesso!</h1>
          <p className="text-gray-400">Processamos {summary?.total_reviews || 0} avaliações. Abaixo está uma pré-visualização dos dados classificados.</p>
        </div>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="bg-[#E30613] hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#e3061344] transition-all whitespace-nowrap"
        >
          Ir para o Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Avaliações válidas</p>
            <p className="text-2xl font-bold text-white">{summary?.total_reviews || 0}</p>
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
        <Card>
          <p className="text-sm text-gray-400">Base gerada</p>
          <p className="text-sm font-medium mt-1 truncate">
            {testFeaturesEnabled && analysis_id ? `analise_${analysis_id}_enriquecida.csv` : 'base_com_predicoes.csv'}
          </p>
          {testFeaturesEnabled && analysis_id && (
            <button onClick={handleDownloadCsv} className="text-xs text-[#E30613] hover:underline mt-2 inline-block">
              Baixar CSV enriquecido
            </button>
          )}
        </Card>
      </div>

      <Card title="Pré-visualização dos Dados" description="Amostra das 5 primeiras linhas analisadas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#222222]">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">ID</th>
                <th className="px-6 py-3">Loja</th>
                <th className="px-6 py-3">Comentário</th>
                <th className="px-6 py-3 text-center">Nota NPS</th>
                <th className={`px-6 py-3 ${testFeaturesEnabled ? '' : 'rounded-tr-lg'}`}>Sentimento</th>
                {testFeaturesEnabled && (
                  <>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3 rounded-tr-lg">Confiança</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {comments_sample?.map((row: any, index: number) => (
                <tr key={index} className="border-b border-[#222222] hover:bg-[#222222]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-300">{index + 1}</td>
                  <td className="px-6 py-4 text-white">{row.loja}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{row.comentario}</td>
                  <td className="px-6 py-4 text-center font-bold">{row.nota}</td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      row.sentiment?.toLowerCase() === 'positivo' ? 'positive' : 
                      row.sentiment?.toLowerCase() === 'negativo' ? 'negative' : 'neutral'
                    }>
                      {row.sentiment || 'Neutro'}
                    </Badge>
                  </td>
                  {testFeaturesEnabled && (
                    <>
                      <td className="px-6 py-4 text-gray-300">{row.category || '-'}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {row.confidence !== undefined ? `${(row.confidence * 100).toFixed(1)}%` : '-'}
                        {row.low_confidence ? ' · baixa' : ''}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Preview;
