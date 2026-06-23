export const ACTIVE_ANALYSIS_JOB_KEY = 'neuroanalytics.activeAnalysisJob';
export const ANALYSIS_JOB_EVENT = 'neuroanalytics.analysisJobUpdated';

export type ActiveAnalysisJob = {
  jobId: string;
  fileName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  stage?: string;
  progress?: number;
  analysisId?: number | null;
  error?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export const getActiveAnalysisJob = (): ActiveAnalysisJob | null => {
  try {
    const raw = localStorage.getItem(ACTIVE_ANALYSIS_JOB_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setActiveAnalysisJob = (job: ActiveAnalysisJob | null) => {
  if (job) {
    localStorage.setItem(ACTIVE_ANALYSIS_JOB_KEY, JSON.stringify(job));
  } else {
    localStorage.removeItem(ACTIVE_ANALYSIS_JOB_KEY);
  }
  window.dispatchEvent(new CustomEvent(ANALYSIS_JOB_EVENT, { detail: job }));
};

export const mergeActiveAnalysisJob = (changes: Partial<ActiveAnalysisJob>) => {
  const current = getActiveAnalysisJob();
  if (!current) return null;
  const next = { ...current, ...changes };
  setActiveAnalysisJob(next);
  return next;
};
