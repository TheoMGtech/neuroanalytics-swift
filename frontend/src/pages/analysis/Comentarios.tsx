import React, { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import api from '../../services/api';

const Comentarios = () => {
  const { toggleDrawer, activeFilterCount, filters } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const limit = 50;

  useEffect(() => {
    // Reset page when filters or search change
    setPage(1);
  }, [filters, searchTerm]);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard/comments', {
          params: {
            page,
            limit,
            search: searchTerm,
            start_date: filters.startDate,
            end_date: filters.endDate,
            store: filters.store,
            flag: filters.flag
          }
        });
        
        setData(response.data.data);
        setTotalPages(response.data.meta.totalPages);
        setTotalItems(response.data.meta.totalItems);
      } catch (error) {
        console.error('Error fetching comments', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a slight delay for typing search
    const timeoutId = setTimeout(() => {
      fetchComments();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm, page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setSearchTerm(e.target.value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Comentários</h2>
            {activeFilterCount > 0 && (
              <span className="bg-primary-container text-on-primary-container text-xs font-bold px-2 py-1 rounded-md">
                {activeFilterCount} filtros ativos
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Explore a base de dados completa, busque por palavras-chave e veja como a IA avaliou cada comentário.
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

      <div className="bg-surface rounded-xl border border-border-subtle shadow-sm flex flex-col">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-faint rounded-t-xl">
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Buscar em comentários ou lojas..." 
              value={searchInput}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-border-subtle rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
          <div className="text-sm text-on-surface-variant font-bold">
            {totalItems} resultados
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-on-surface">
              <thead className="bg-surface border-b border-border-subtle text-on-surface-variant text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 min-w-[100px]">Data</th>
                  <th className="px-4 py-3 min-w-[120px]">Loja</th>
                  <th className="px-4 py-3 text-center">Nota</th>
                  <th className="px-4 py-3 text-center">Classe Original</th>
                  <th className="px-4 py-3 text-center">Classe IA</th>
                  <th className="px-4 py-3 min-w-[300px]">Comentário</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.map((item, index) => {
                  const isReclassified = item.original_classification !== item.ai_classification;
                  
                  return (
                    <tr key={index} className="hover:bg-surface-faint transition-colors">
                      <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap">
                        {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4 font-bold whitespace-nowrap">{item.store || '-'}</td>
                      <td className="px-4 py-4 text-center font-bold">{item.note}</td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-bold uppercase">{item.original_classification || '-'}</span>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.ai_classification === 'DETRATOR' ? 'bg-status-error/10 text-status-error' :
                          item.ai_classification === 'PROMOTOR' ? 'bg-status-success/10 text-status-success' :
                          'bg-secondary/10 text-secondary'
                        }`}>
                          {item.ai_classification || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 italic text-on-surface-variant">"{item.comment}"</td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${
                          isReclassified ? 'border-primary text-primary bg-primary/5' : 'border-border-subtle text-on-surface-variant bg-surface'
                        }`}>
                          {isReclassified ? 'Reclassificada' : 'Mantida'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                      Nenhum comentário encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-surface-faint rounded-b-xl">
          <span className="text-xs text-on-surface-variant">
            Página {page} de {totalPages || 1}
          </span>
          <div className="flex gap-1">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 border border-border-subtle rounded text-sm text-on-surface-variant bg-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-faint"
            >
              Anterior
            </button>
            <span className="px-3 py-1 border border-primary bg-primary text-on-primary rounded text-sm font-bold">
              {page}
            </span>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-border-subtle rounded text-sm text-on-surface-variant bg-surface disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-faint"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comentarios;
