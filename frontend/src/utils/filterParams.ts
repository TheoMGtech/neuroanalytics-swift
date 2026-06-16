import { FilterState } from '../context/FilterContext';

const joinOrUndefined = (values: string[]) => {
  const clean = values.filter(Boolean);
  return clean.length ? clean.join(',') : undefined;
};

export const buildFilterParams = (filters: FilterState) => ({
  start_date: filters.startDate || undefined,
  end_date: filters.endDate || undefined,
  store: filters.store || undefined,
  analysis_id: filters.file || undefined,
  flag: joinOrUndefined(filters.flag),
  respondent_type: joinOrUndefined(filters.respondentType),
  sentiment: joinOrUndefined(filters.sentiment),
  category: joinOrUndefined(filters.category),
  ai_status: joinOrUndefined(filters.aiStatus),
});
