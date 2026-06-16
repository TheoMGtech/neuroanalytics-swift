import { useEffect, useState } from 'react';
import { useFilters, FilterState } from '../../context/FilterContext';
import api from '../../services/api';

type FilterOptions = {
  stores: { name: string; flag?: string }[];
  files: { id: number; name: string }[];
  categories: string[];
  sentiments: string[];
};

const FilterDrawer = () => {
  const { isDrawerOpen, closeDrawer, filters, updateFilter, clearFilters, activeFilterCount } = useFilters();
  const [options, setOptions] = useState<FilterOptions>({
    stores: [],
    files: [],
    categories: [],
    sentiments: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await api.get('/dashboard/filter-options', {
          params: { analysis_id: filters.file || undefined },
        });
        setOptions({
          stores: response.data.stores || [],
          files: response.data.files || [],
          categories: response.data.categories || [],
          sentiments: response.data.sentiments || [],
        });
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isDrawerOpen, filters.file]);

  if (!isDrawerOpen) return null;

  const handleCheckboxChange = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[];
    if (current.includes(value)) {
      updateFilter(key, current.filter(v => v !== value));
    } else {
      updateFilter(key, [...current, value]);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-50 transition-opacity" 
        onClick={closeDrawer}
      ></div>
      <div className="fixed top-0 right-0 h-full w-[400px] bg-surface shadow-lg z-50 flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">filter_alt</span>
            <h2 className="font-headline-sm font-bold text-on-surface">Filtros Avançados</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Período */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Período</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Data Inicial</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Data Final</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface"
                />
              </div>
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Tipo de Respondente */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Tipo de Respondente</h3>
            <div className="flex flex-col gap-2">
              {['Promotor', 'Neutro', 'Detrator'].map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.respondentType.includes(type)}
                    onChange={() => handleCheckboxChange('respondentType', type)}
                    className="rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Gestão */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Gestão</h3>
            <div className="flex flex-col gap-2">
              {['REGULAR', 'TOCADORA', 'NAO_IDENTIFICADO'].map(flag => (
                <label key={flag} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.flag.includes(flag)}
                    onChange={() => handleCheckboxChange('flag', flag)}
                    className="rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{flag}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Status IA */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Status da IA</h3>
            <div className="flex flex-col gap-2">
              {['Mantida', 'Reclassificada', 'Divergente', 'Inconsistente'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.aiStatus.includes(status)}
                    onChange={() => handleCheckboxChange('aiStatus', status)}
                    className="rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Sentimento */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Sentimento</h3>
            <div className="flex flex-col gap-2">
              {(options.sentiments.length ? options.sentiments : ['Positivo', 'Neutro', 'Negativo']).map(sentiment => (
                <label key={sentiment} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.sentiment.includes(sentiment)}
                    onChange={() => handleCheckboxChange('sentiment', sentiment)}
                    className="rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{sentiment}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Categoria */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Categoria</h3>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {(options.categories.length ? options.categories : ['Outros', 'Atendimento', 'Preco', 'Produto/Qualidade', 'Entrega', 'Abastecimento', 'Estrutura/Loja']).map(category => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={() => handleCheckboxChange('category', category)}
                    className="rounded border-border-subtle text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle" />

          {/* Loja */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Loja</h3>
            <select 
              value={filters.store}
              onChange={(e) => updateFilter('store', e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface"
            >
              <option value="">Todas as lojas</option>
              {options.stores.map(store => (
                <option key={store.name} value={store.name}>
                  {store.name}{store.flag ? ` (${store.flag})` : ''}
                </option>
              ))}
            </select>
            {loadingOptions && (
              <p className="text-xs text-on-surface-variant mt-2">Carregando lojas da analise...</p>
            )}
          </div>

          <hr className="border-border-subtle" />

          {/* Arquivo / Analise */}
          <div>
            <h3 className="font-body-md font-bold text-on-surface mb-3">Arquivo / Analise</h3>
            <select
              value={filters.file}
              onChange={(e) => updateFilter('file', e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface"
            >
              <option value="">Analise mais recente</option>
              {options.files.map(file => (
                <option key={file.id} value={file.id}>
                  #{file.id} - {file.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="p-4 border-t border-border-subtle bg-surface-faint flex gap-3">
          <button 
            onClick={clearFilters}
            className="flex-1 py-2 px-4 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-dim transition-colors"
          >
            Limpar Filtros
          </button>
          <button 
            onClick={closeDrawer}
            className="flex-1 py-2 px-4 rounded-lg font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDrawer;
