import { useEffect, useState } from 'react';
import api from '../../services/api';
import { testFeaturesEnabled } from '../../config/features';
import {
  ANALYSIS_JOB_EVENT,
  ActiveAnalysisJob,
  getActiveAnalysisJob,
  mergeActiveAnalysisJob,
  setActiveAnalysisJob,
} from '../../utils/analysisJob';

const stageLabel: Record<string, string> = {
  queued: 'Na fila',
  validating: 'Validando base',
  modeling: 'Aplicando modelos',
  scoring: 'Calculando NPS',
  saving: 'Salvando análise',
  completed: 'Concluída',
  failed: 'Falhou',
};

const AnalysisJobWatcher = () => {
  const [job, setJob] = useState<ActiveAnalysisJob | null>(() => getActiveAnalysisJob());

  useEffect(() => {
    if (!testFeaturesEnabled) return;

    const sync = () => setJob(getActiveAnalysisJob());
    window.addEventListener(ANALYSIS_JOB_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ANALYSIS_JOB_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!testFeaturesEnabled || !job?.jobId || ['completed', 'failed'].includes(job.status)) return;

    const poll = async () => {
      try {
        const response = await api.get(`/upload/jobs/${job.jobId}`);
        const payload = response.data;
        const next = mergeActiveAnalysisJob({
          status: payload.status,
          stage: payload.stage,
          progress: payload.progress,
          analysisId: payload.analysis_id,
          error: payload.error,
          updatedAt: payload.updated_at,
        });
        if (next) setJob(next);

        if (payload.status === 'completed' && !window.location.pathname.includes('/app/processing')) {
          setActiveAnalysisJob(null);
          const shouldRefresh = window.confirm('A nova análise terminou. Atualizar a tela agora para carregar a análise completa?');
          if (shouldRefresh) window.location.reload();
        }

        if (payload.status === 'failed' && !window.location.pathname.includes('/app/processing')) {
          setActiveAnalysisJob(null);
          window.alert(`A nova análise falhou: ${payload.error || 'erro inesperado'}`);
        }
      } catch (error) {
        console.error('Erro ao acompanhar job de análise', error);
      }
    };

    poll();
    const interval = window.setInterval(poll, 3000);
    return () => window.clearInterval(interval);
  }, [job?.jobId, job?.status]);

  if (!testFeaturesEnabled || !job || ['completed', 'failed'].includes(job.status)) return null;

  const progress = Math.max(0, Math.min(100, job.progress || 0));
  return (
    <div className="fixed right-6 bottom-6 z-50 w-80 rounded-xl border border-primary/20 bg-surface shadow-xl p-4 print:hidden">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary animate-pulse">model_training</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-on-surface">Nova análise em execução</p>
          <p className="text-xs text-on-surface-variant truncate">{job.fileName}</p>
          <div className="h-2 bg-surface-container rounded-full overflow-hidden mt-3">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            {stageLabel[job.stage || job.status] || job.stage || job.status} · {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisJobWatcher;
