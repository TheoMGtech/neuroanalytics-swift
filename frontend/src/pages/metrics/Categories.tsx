import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

const Categories = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/categories');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Categorização</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Tópicos e categorias mais frequentes nos comentários baseados na última análise gerada.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-5">
        <h3 className="font-headline-md text-[16px] font-semibold text-on-surface flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[20px] text-primary">category</span>
          Frequência de Menções por Categoria
        </h3>
        
        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-on-surface-variant">Carregando...</div>
          ) : data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2A2A2A" />
                <XAxis type="number" stroke="#8f7067" />
                <YAxis dataKey="name" type="category" stroke="#8f7067" width={150} tick={{ fill: '#e6e0df' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderRadius: '8px', color: '#FFFFFF' }}
                  itemStyle={{ color: '#E30613', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#E30613" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-on-surface-variant">Nenhum dado disponível. Execute uma análise primeiro.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
