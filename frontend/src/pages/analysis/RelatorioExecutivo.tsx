import { useEffect, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';
import { buildFilterParams } from '../../utils/filterParams';

const formatNps = (value: number | undefined) => Math.round(value || 0);

const formatPercent = (value: number | undefined) => `${(value || 0).toFixed(1)}%`;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const RelatorioExecutivo = () => {
  const { filters, toggleDrawer, activeFilterCount } = useFilters();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/executive-report', {
          params: buildFilterParams(filters)
        });
        setReport(response.data);
      } catch (error) {
        console.error('Erro ao gerar relatório executivo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [filters]);

  const metrics = report?.metrics || {};
  const summary = metrics.executiveSummary || {};
  const diagnostics = report?.modelDiagnostics || {};
  const sentimentReport = diagnostics?.sentiment?.report || {};
  const categoryReport = diagnostics?.category?.report || {};

  const handleDownloadHtml = () => {
    const element = document.getElementById('executive-report-print');
    if (!element) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório Executivo Swift</title><style>body{font-family:Arial,sans-serif;color:#1f2937;margin:32px;}h1,h2,h3{color:#0f172a;}table{width:100%;border-collapse:collapse;margin:16px 0;}td,th{border:1px solid #d1d5db;padding:8px;text-align:left;}th{background:#f3f4f6}.kpi{display:inline-block;margin:8px 16px 8px 0;padding:12px;border:1px solid #d1d5db;border-radius:8px;}</style></head><body>${element.innerHTML}</body></html>`;
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), 'relatorio-executivo-swift.html');
  };

  const handleDownloadCsv = async () => {
    const response = await api.get('/dashboard/comments-export', {
      params: buildFilterParams(filters),
      responseType: 'blob'
    });
    downloadBlob(response.data, 'base-inferencia-teste.csv');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8 print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Relatório Executivo</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Consolidado pronto para apresentação, impressão em papel ou salvamento em PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleDrawer} className="flex items-center gap-2 bg-surface border border-border-subtle text-on-surface hover:bg-surface-faint font-bold px-4 py-2 rounded-lg transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">filter_alt</span>
            Filtrar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold px-4 py-2 rounded-lg transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">print</span>
            Imprimir / PDF
          </button>
          <button onClick={handleDownloadHtml} className="flex items-center gap-2 bg-surface border border-border-subtle text-on-surface hover:bg-surface-faint font-bold px-4 py-2 rounded-lg transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Baixar HTML
          </button>
          <button onClick={handleDownloadCsv} className="flex items-center gap-2 bg-surface border border-border-subtle text-on-surface hover:bg-surface-faint font-bold px-4 py-2 rounded-lg transition-colors text-sm">
            <span className="material-symbols-outlined text-[18px]">table_view</span>
            Baixar Base CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 print:hidden">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <article id="executive-report-print" className="bg-surface rounded-xl border border-border-subtle shadow-sm p-8 print:shadow-none print:border-0 print:p-0">
          <header className="border-b border-border-subtle pb-6 mb-6">
            <p className="text-sm font-bold text-primary uppercase">Swift · Projeto NPS</p>
            <h1 className="text-3xl font-black text-on-surface mt-2">Relatório executivo consolidado</h1>
            <p className="text-on-surface-variant mt-2">{report?.narrative?.methodNote}</p>
            <p className="text-xs text-on-surface-variant mt-2">
              Gerado em {report?.generatedAt ? new Date(report.generatedAt).toLocaleString('pt-BR') : '-'} ·
              Arquivo: {report?.analysis?.fileName || 'análise atual'}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="p-4 rounded-lg border border-border-subtle">
              <p className="text-xs uppercase text-on-surface-variant font-bold">NPS Original</p>
              <p className="text-3xl font-black">{formatNps(metrics.originalNps)}</p>
            </div>
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-xs uppercase text-primary font-bold">NPS IA</p>
              <p className="text-3xl font-black text-primary">{formatNps(metrics.generalNps)}</p>
            </div>
            <div className="p-4 rounded-lg border border-border-subtle">
              <p className="text-xs uppercase text-on-surface-variant font-bold">Diferença</p>
              <p className="text-3xl font-black">{formatNps(metrics.generalNps - metrics.originalNps)}</p>
            </div>
            <div className="p-4 rounded-lg border border-border-subtle">
              <p className="text-xs uppercase text-on-surface-variant font-bold">Comentários</p>
              <p className="text-3xl font-black">{(metrics.totalReviews || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg border border-border-subtle">
              <p className="text-xs uppercase text-on-surface-variant font-bold">Confiança média</p>
              <p className="text-3xl font-black">{formatPercent((metrics.confidenceAvg || 0) * 100)}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-black mb-3">Fortalezas da rede</h2>
              <ul className="space-y-2">
                {(summary.topStrengths || []).map((item: any) => (
                  <li key={item.name} className="p-3 rounded border border-status-success/20 bg-status-success/5">
                    <strong>{item.name}</strong> · {item.count.toLocaleString()} menções positivas
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-black mb-3">Pontos de atenção</h2>
              <ul className="space-y-2">
                {(summary.topAttention || []).map((item: any) => (
                  <li key={item.name} className="p-3 rounded border border-status-error/20 bg-status-error/5">
                    <strong>{item.name}</strong> · {item.count.toLocaleString()} menções detratoras
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black mb-3">Comparativo por gestão</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="py-2">Gestão</th>
                  <th className="py-2">NPS IA</th>
                  <th className="py-2">NPS original</th>
                  <th className="py-2">Top problemas</th>
                  <th className="py-2">Top elogios</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.managementData || []).map((row: any) => (
                  <tr key={row.flag} className="border-b border-border-subtle">
                    <td className="py-2 font-bold">{row.flag}</td>
                    <td className="py-2">{formatNps(row.nps)}</td>
                    <td className="py-2">{formatNps(row.originalNps)}</td>
                    <td className="py-2">{(row.topProblems || []).map((item: any) => item.name).join(', ') || '-'}</td>
                    <td className="py-2">{(row.topPraises || []).map((item: any) => item.name).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black mb-3">Lojas com maior diferença entre NPS original e IA</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  <th className="py-2">Loja</th>
                  <th className="py-2">Gestão</th>
                  <th className="py-2">Original</th>
                  <th className="py-2">IA</th>
                  <th className="py-2">Diferença</th>
                  <th className="py-2">Top problemas</th>
                </tr>
              </thead>
              <tbody>
                {(summary.largestNpsDiffStores || []).map((store: any) => (
                  <tr key={store.name} className="border-b border-border-subtle">
                    <td className="py-2 font-bold">{store.name}</td>
                    <td className="py-2">{store.flag}</td>
                    <td className="py-2">{formatNps(store.originalNps)}</td>
                    <td className="py-2">{formatNps(store.nps)}</td>
                    <td className="py-2">{formatNps(store.diffNps)}</td>
                    <td className="py-2">{(store.topProblems || []).map((item: any) => item.name).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-black mb-3">Diagnóstico técnico em teste</h2>
            <p className="text-sm text-on-surface-variant mb-3">{diagnostics.labelPolicy}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-border-subtle">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Base manual</p>
                <p>{diagnostics?.manualDataset?.totalRows || 0} comentários anotados</p>
              </div>
              <div className="p-4 rounded border border-border-subtle">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Sentimento textual</p>
                <p>Macro-F1 {sentimentReport.macroF1 ?? '-'}</p>
              </div>
              <div className="p-4 rounded border border-border-subtle">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Categorização manual</p>
                <p>Macro-F1 {categoryReport.macroF1 ?? '-'}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mt-3">{report?.narrative?.riskNote}</p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3">Comentários representativos</h2>
            <div className="space-y-3">
              {(report?.representativeComments || []).map((comment: any, index: number) => (
                <div key={`${comment.storeName}-${index}`} className="p-4 rounded border border-border-subtle">
                  <p className="text-sm italic">"{comment.text}"</p>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {comment.storeName} · {comment.sentiment} · {comment.category} ·
                    Conf. {formatPercent(comment.confidence * 100)}
                    {comment.lowConfidence ? ' · baixa confiança' : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>
      )}
    </div>
  );
};

export default RelatorioExecutivo;
