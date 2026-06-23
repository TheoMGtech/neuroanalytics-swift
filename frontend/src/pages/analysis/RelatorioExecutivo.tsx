import { useEffect, useMemo, useState } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';
import { buildFilterParams } from '../../utils/filterParams';

const formatNps = (value: number | undefined) => Math.round(value || 0);
const formatDecimal = (value: number | undefined) => (value || 0).toFixed(1);
const formatPercent = (value: number | undefined) => `${(value || 0).toFixed(1)}%`;
const formatCount = (value: number | undefined) => (value || 0).toLocaleString('pt-BR');

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

const percent = (value: number, total: number) => (total ? (value / total) * 100 : 0);

const npsWidth = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

const TopicBars = ({ title, rows, tone }: { title: string; rows: any[]; tone: 'good' | 'bad' }) => {
  const max = Math.max(...rows.map((item) => item.count || 0), 1);
  const barClass = tone === 'good' ? 'bg-status-success' : 'bg-status-error';
  return (
    <div className="report-section rounded-lg border border-border-subtle p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-on-surface mb-3">{title}</h3>
      <div className="space-y-3">
        {rows.length ? rows.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between gap-4 text-xs mb-1">
              <span className="font-bold">{item.name}</span>
              <span className="text-on-surface-variant">{formatCount(item.count)}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div className={`h-full ${barClass}`} style={{ width: `${((item.count || 0) / max) * 100}%` }} />
            </div>
          </div>
        )) : (
          <p className="text-sm text-on-surface-variant">Sem volume relevante para o recorte.</p>
        )}
      </div>
    </div>
  );
};

const NpsCompareChart = ({ regular, tocadora }: { regular: any; tocadora: any }) => {
  const rows = [
    { label: 'Regular', data: regular, color: 'bg-primary' },
    { label: 'Tocadora', data: tocadora, color: 'bg-secondary' },
  ];
  return (
    <div className="report-section rounded-lg border border-border-subtle p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-on-surface mb-4">NPS por modelo de gestão</h3>
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="grid grid-cols-[96px_1fr_60px] gap-3 items-center text-sm">
              <span className="font-bold">{row.label}</span>
              <div className="h-4 rounded-full bg-surface-container overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-on-surface-variant/30" style={{ width: npsWidth(row.data.originalNps || 0) }} />
                <div className={`absolute inset-y-0 left-0 ${row.color}`} style={{ width: npsWidth(row.data.nps || 0) }} />
              </div>
              <span className="font-black text-right">{formatDecimal(row.data.nps)}</span>
            </div>
            <p className="ml-[108px] mt-1 text-xs text-on-surface-variant">
              Original {formatDecimal(row.data.originalNps)} · IA {formatDecimal(row.data.nps)} ·
              variação {formatDecimal((row.data.nps || 0) - (row.data.originalNps || 0))}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-on-surface-variant mt-5">
        <span><span className="inline-block w-3 h-3 bg-on-surface-variant/30 rounded-sm mr-1" />NPS original</span>
        <span><span className="inline-block w-3 h-3 bg-primary rounded-sm mr-1" />NPS IA</span>
      </div>
    </div>
  );
};

const MixChart = ({ regular, tocadora }: { regular: any; tocadora: any }) => {
  const rows = [
    { label: 'Regular', data: regular },
    { label: 'Tocadora', data: tocadora },
  ];
  return (
    <div className="report-section rounded-lg border border-border-subtle p-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-on-surface mb-4">Composição das classificações</h3>
      <div className="space-y-5">
        {rows.map((row) => {
          const total = row.data.totalReviews || 0;
          const promoters = percent(row.data.promoters || 0, total);
          const neutral = percent(row.data.neutral || 0, total);
          const detractors = percent(row.data.detractors || 0, total);
          return (
            <div key={row.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold">{row.label}</span>
                <span className="text-on-surface-variant">{formatCount(total)} respostas</span>
              </div>
              <div className="h-5 rounded-full overflow-hidden bg-surface-container flex">
                <div className="bg-status-success" style={{ width: `${promoters}%` }} />
                <div className="bg-secondary" style={{ width: `${neutral}%` }} />
                <div className="bg-status-error" style={{ width: `${detractors}%` }} />
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                Promotores {formatPercent(promoters)} · Neutros {formatPercent(neutral)} · Detratores {formatPercent(detractors)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const managementData = metrics.managementData || [];
  const regular = managementData.find((row: any) => row.flag === 'REGULAR') || {};
  const tocadora = managementData.find((row: any) => row.flag === 'TOCADORA') || managementData.find((row: any) => row.flag === 'TOCADORA/Germinare') || {};

  const managementInsights = useMemo(() => {
    const gap = (regular.nps || 0) - (tocadora.nps || 0);
    const regularDetractorRate = percent(regular.detractors || 0, regular.totalReviews || 0);
    const tocadoraDetractorRate = percent(tocadora.detractors || 0, tocadora.totalReviews || 0);
    const regularMainProblem = regular.topProblems?.[0]?.name || 'sem problema dominante';
    const tocadoraMainProblem = tocadora.topProblems?.[0]?.name || 'sem problema dominante';
    return [
      gap >= 0
        ? `Regular supera Tocadora em ${formatDecimal(gap)} pontos de NPS IA no recorte atual.`
        : `Tocadora supera Regular em ${formatDecimal(Math.abs(gap))} pontos de NPS IA no recorte atual.`,
      `A taxa de detratores é ${formatPercent(regularDetractorRate)} em Regular e ${formatPercent(tocadoraDetractorRate)} em Tocadora.`,
      `O principal tema negativo em Regular é ${regularMainProblem}; em Tocadora, ${tocadoraMainProblem}.`,
    ];
  }, [regular, tocadora]);

  const handleDownloadHtml = () => {
    const element = document.getElementById('executive-report-print');
    if (!element) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatorio Executivo Swift</title><style>body{font-family:Arial,sans-serif;color:#1f2937;margin:32px;}h1,h2,h3{color:#0f172a;}table{width:100%;border-collapse:collapse;margin:16px 0;}td,th{border:1px solid #d1d5db;padding:8px;text-align:left;}th{background:#f3f4f6}.kpi{display:inline-block;margin:8px 16px 8px 0;padding:12px;border:1px solid #d1d5db;border-radius:8px;}</style></head><body>${element.innerHTML}</body></html>`;
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
            Consolidado formal para cliente Swift, com foco no comparativo Regular x Tocadora.
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <article id="executive-report-print" className="report-page bg-surface rounded-xl border border-border-subtle shadow-sm p-8 print:shadow-none print:border-0 print:p-0">
          <header className="report-section border-b border-border-subtle pb-5 mb-6">
            <div className="flex justify-between gap-6">
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-[0.18em]">Swift · Projeto NPS</p>
                <h1 className="text-3xl font-black text-on-surface mt-2">Relatório executivo consolidado</h1>
                <p className="text-on-surface-variant mt-2 max-w-3xl">
                  Avaliação do NPS tradicional e do NPS ajustado por IA, com ênfase na diferença de desempenho entre lojas Regular e Tocadora.
                </p>
              </div>
              <div className="text-right text-xs text-on-surface-variant min-w-[220px]">
                <p>Gerado em {report?.generatedAt ? new Date(report.generatedAt).toLocaleString('pt-BR') : '-'}</p>
                <p>Arquivo: {report?.analysis?.fileName || 'análise atual'}</p>
                <p>Base: {formatCount(metrics.totalReviews)} comentários</p>
              </div>
            </div>
          </header>

          <section className="report-kpi-grid mb-6">
            <div className="report-kpi">
              <p>NPS original</p>
              <strong>{formatNps(metrics.originalNps)}</strong>
            </div>
            <div className="report-kpi report-kpi-primary">
              <p>NPS IA</p>
              <strong>{formatNps(metrics.generalNps)}</strong>
            </div>
            <div className="report-kpi">
              <p>Diferença</p>
              <strong>{formatNps(metrics.generalNps - metrics.originalNps)}</strong>
            </div>
            <div className="report-kpi">
              <p>Comentários</p>
              <strong>{formatCount(metrics.totalReviews)}</strong>
            </div>
            <div className="report-kpi">
              <p>Confiança média</p>
              <strong>{formatPercent((metrics.confidenceAvg || 0) * 100)}</strong>
            </div>
          </section>

          <section className="report-section mb-6">
            <h2 className="text-xl font-black mb-3">Síntese executiva Regular x Tocadora</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {managementInsights.map((insight) => (
                <div key={insight} className="rounded-lg border border-border-subtle bg-surface-faint p-4 text-sm">
                  {insight}
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <NpsCompareChart regular={regular} tocadora={tocadora} />
            <MixChart regular={regular} tocadora={tocadora} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <TopicBars title="Problemas mais citados · Regular" rows={regular.topProblems || []} tone="bad" />
            <TopicBars title="Problemas mais citados · Tocadora" rows={tocadora.topProblems || []} tone="bad" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <TopicBars title="Elogios mais citados · Regular" rows={regular.topPraises || []} tone="good" />
            <TopicBars title="Elogios mais citados · Tocadora" rows={tocadora.topPraises || []} tone="good" />
          </section>

          <section className="report-section mb-6">
            <h2 className="text-xl font-black mb-3">Tabela comparativa de gestão</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Gestão</th>
                  <th>NPS IA</th>
                  <th>NPS original</th>
                  <th>Promotores</th>
                  <th>Neutros</th>
                  <th>Detratores</th>
                  <th>Top problema</th>
                  <th>Top elogio</th>
                </tr>
              </thead>
              <tbody>
                {managementData.map((row: any) => (
                  <tr key={row.flag}>
                    <td className="font-bold">{row.flag}</td>
                    <td>{formatDecimal(row.nps)}</td>
                    <td>{formatDecimal(row.originalNps)}</td>
                    <td>{formatCount(row.promoters)}</td>
                    <td>{formatCount(row.neutral)}</td>
                    <td>{formatCount(row.detractors)}</td>
                    <td>{row.topProblems?.[0]?.name || '-'}</td>
                    <td>{row.topPraises?.[0]?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="report-section mb-6">
            <h2 className="text-xl font-black mb-3">Lojas com maior diferença entre NPS original e IA</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Loja</th>
                  <th>Gestão</th>
                  <th>Original</th>
                  <th>IA</th>
                  <th>Diferença</th>
                  <th>Top problemas</th>
                </tr>
              </thead>
              <tbody>
                {(summary.largestNpsDiffStores || []).map((store: any) => (
                  <tr key={store.name}>
                    <td className="font-bold">{store.name}</td>
                    <td>{store.flag}</td>
                    <td>{formatDecimal(store.originalNps)}</td>
                    <td>{formatDecimal(store.nps)}</td>
                    <td>{formatDecimal(store.diffNps)}</td>
                    <td>{(store.topProblems || []).map((item: any) => item.name).join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <TopicBars title="Fortalezas gerais da rede" rows={summary.topStrengths || []} tone="good" />
            <TopicBars title="Pontos de atenção gerais" rows={summary.topAttention || []} tone="bad" />
          </section>

          <section className="report-section mb-6">
            <h2 className="text-xl font-black mb-3">Diagnóstico técnico em ambiente de teste</h2>
            <p className="text-sm text-on-surface-variant mb-3">{diagnostics.labelPolicy}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border-subtle p-4">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Base manual</p>
                <p>{formatCount(diagnostics?.manualDataset?.totalRows)} comentários anotados</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-4">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Sentimento textual</p>
                <p>Macro-F1 {sentimentReport.macroF1 ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-border-subtle p-4">
                <p className="text-xs uppercase font-bold text-on-surface-variant">Categorização manual</p>
                <p>Macro-F1 {categoryReport.macroF1 ?? '-'}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mt-3">{report?.narrative?.riskNote}</p>
          </section>

          <section className="report-section">
            <h2 className="text-xl font-black mb-3">Comentários representativos</h2>
            <div className="space-y-3">
              {(report?.representativeComments || []).slice(0, 8).map((comment: any, index: number) => (
                <div key={`${comment.storeName}-${index}`} className="rounded-lg border border-border-subtle p-4">
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
