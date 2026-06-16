import { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';

const Explicabilidade = () => {
  const { filters, toggleDrawer, activeFilterCount } = useFilters();
  const [examples, setExamples] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ reclassifiedCount: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsRes = await api.get('/dashboard/metrics', {
          params: { start_date: filters.startDate, end_date: filters.endDate, store: filters.store, flag: filters.flag }
        });
        setMetrics({ reclassifiedCount: metricsRes.data.reclassifiedCount || 0 });

        const commentsRes = await api.get('/dashboard/comments', {
          params: { page: 1, limit: 100, store: filters.store, flag: filters.flag }
        });
        
        // Filtrar apenas os que foram reclassificados
        const reclassified = commentsRes.data.data
          .filter((c: any) => c.reclassificationRule)
          .slice(0, 10)
          .map((c: any) => ({
            id: c.id,
            original: c.originalClassification,
            new: c.aiClassification,
            text: c.text,
            aiJustification: c.reclassificationRule,
            conf: `${(c.confidence * 100).toFixed(1)}%`
          }));
          
        setExamples(reclassified);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchData();
  }, [filters]);

  const rules = [
    {
      title: "Reclassificação de Promotores",
      condition: "Nota 9 ou 10, mas Sentimento Negativo",
      action: "Alterado para Detrator ou Neutro",
      example: "Nota: 9 | Texto: 'A carne estava estragada e o gerente não quis trocar.'",
      confidence: "Alta"
    },
    {
      title: "Reclassificação de Neutros (Viés Negativo)",
      condition: "Nota 7 ou 8, mas Sentimento fortemente Negativo",
      action: "Alterado para Detrator",
      example: "Nota: 7 | Texto: 'Não volto mais, fila horrível.'",
      confidence: "Alta"
    },
    {
      title: "Reclassificação de Detratores (Viés Positivo)",
      condition: "Nota 0 a 6, mas Sentimento Positivo",
      action: "Alterado para Promotor ou Neutro",
      example: "Nota: 5 | Texto: 'Tudo perfeito, adoro comprar aqui!'",
      confidence: "Média"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Explicabilidade da IA</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Entenda as regras utilizadas pela IA para reclassificar avaliações e corrigir o NPS.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-status-success mb-2">verified</span>
          <span className="font-display-md font-bold text-on-surface">92.4%</span>
          <span className="text-sm text-on-surface-variant">Confiança Média da IA</span>
        </div>
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-2">find_replace</span>
          <span className="font-display-md font-bold text-on-surface">{metrics.reclassifiedCount.toLocaleString()}</span>
          <span className="text-sm text-on-surface-variant">Avaliações Reclassificadas</span>
        </div>
        <div className="bg-surface rounded-xl border border-border-subtle shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2">rule</span>
          <span className="font-display-md font-bold text-on-surface">3</span>
          <span className="text-sm text-on-surface-variant">Regras Principais Aplicadas</span>
        </div>
      </div>

      <h3 className="font-headline-md font-bold text-on-surface mb-4">Critérios e Regras</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {rules.map((rule, idx) => (
          <div key={idx} className="bg-surface rounded-xl border border-border-subtle shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <h4 className="font-bold text-on-surface mb-2 pr-12">{rule.title}</h4>
            <div className="absolute top-6 right-6 bg-surface-container rounded-full px-2 py-0.5 text-xs font-bold text-on-surface-variant">
              {rule.confidence}
            </div>
            
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-on-surface-variant block text-xs uppercase font-bold mb-1">Condição Identificada</span>
                <span className="text-on-surface bg-surface-faint px-2 py-1 rounded inline-block border border-border-subtle">{rule.condition}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-xs uppercase font-bold mb-1">Ação da IA</span>
                <span className="text-primary font-bold">{rule.action}</span>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-on-surface-variant block text-xs uppercase font-bold mb-1">Exemplo de Ocorrência</span>
                <span className="text-on-surface italic">"{rule.example}"</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="font-headline-md font-bold text-on-surface mb-4">Exemplos de Justificativas</h3>
      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-on-surface">
            <thead className="bg-surface-faint border-b border-border-subtle text-on-surface-variant text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4 w-1/4">Comentário Original</th>
                <th className="px-6 py-4 text-center">Classificação Antiga</th>
                <th className="px-6 py-4 text-center">Classificação Nova</th>
                <th className="px-6 py-4">Justificativa da IA</th>
                <th className="px-6 py-4 text-center">Confiança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {examples.map((ex) => (
                <tr key={ex.id} className="hover:bg-surface-faint transition-colors">
                  <td className="px-6 py-4 italic text-on-surface-variant">"{ex.text}"</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold">{ex.original}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      ex.new === 'Detrator' ? 'bg-status-error/10 text-status-error' : 'bg-status-success/10 text-status-success'
                    }`}>{ex.new}</span>
                  </td>
                  <td className="px-6 py-4 text-on-surface">{ex.aiJustification}</td>
                  <td className="px-6 py-4 text-center font-bold text-primary">{ex.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Explicabilidade;
