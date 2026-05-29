import { useState } from 'react'

interface DashboardProps {
  analysisId: number | null
}

export default function Dashboard({ analysisId }: DashboardProps) {
  const [saveConfirmed, setSaveConfirmed] = useState(false)

  // Mock static data for aesthetic demonstration
  const stats = {
    totalReviews: 12000,
    generalNps: 48.5,
    promoters: 7200,
    neutral: 2600,
    detractors: 2200,
    storesCount: 228,
    outliersCount: 4,
    commentCoverage: "85%"
  }

  const handleSaveToHistory = () => {
    setSaveConfirmed(true)
    setTimeout(() => setSaveConfirmed(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6 py-4 animate-fade-in">
      {/* Dashboard Top Header Actions */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Resultados da Análise</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {analysisId ? `Exibindo histórico da análise ID: ${analysisId}` : 'Exibindo resultados do último arquivo carregado'}
          </p>
        </div>
        <button
          onClick={handleSaveToHistory}
          className="px-5 py-2.5 rounded-xl bg-[#E30613] hover:bg-[#c20510] text-white text-sm font-bold shadow-lg shadow-[#e3061322] transition-all duration-200"
        >
          {saveConfirmed ? '✓ Salvo no Histórico' : 'Salvar Análise no Histórico'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NPS Card */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between hover:border-[#E30613] transition-colors duration-300">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NPS Geral</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-[#E30613]">{stats.generalNps}%</span>
            <span className="text-xs text-green-500 font-medium">Zona de Aperfeiçoamento</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">Cálculo ponderado por volume de avaliações</p>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-colors duration-300">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Avaliações</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{stats.totalReviews.toLocaleString()}</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">{stats.commentCoverage} dos clientes enviaram feedbacks de texto</p>
        </div>

        {/* Distribution Card */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition-colors duration-300">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lojas Analisadas</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-white">{stats.storesCount}</span>
            <span className="text-xs text-gray-400">lojas Swift</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">58 gerentes Germinare / 158 Regulares</p>
        </div>

        {/* Outliers Card */}
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between hover:border-[#F2A900] transition-colors duration-300">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outliers Identificados</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-extrabold text-[#F2A900]">{stats.outliersCount}</span>
            <span className="text-xs text-[#F2A900] bg-[#f2a90014] px-1.5 py-0.5 rounded">Atenção</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">Lojas com baixo volume de amostragem estatística</p>
        </div>
      </div>

      {/* Visualizations Grid Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Charts & Performance */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Chart Panel */}
          <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="font-bold text-white">Comparativo de Desempenho</h3>
              <span className="text-xs text-gray-400">NPS por Tipo de Gerente</span>
            </div>
            <div className="h-60 rounded-xl bg-[#222222] flex items-center justify-center text-gray-500 text-sm">
              [Visualização Gráfica Recharts será renderizada aqui]
            </div>
          </div>

          {/* Store Ranking Panel */}
          <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="font-bold text-white">Ranking de Lojas Swift</h3>
              <span className="text-xs text-gray-400">Classificação por NPS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-[#222222] text-xs text-gray-300 uppercase">
                  <tr>
                    <th className="py-2 px-3 rounded-l-lg">Loja (CentroNv2)</th>
                    <th className="py-2 px-3">Gerência (Flag)</th>
                    <th className="py-2 px-3">Avaliações</th>
                    <th className="py-2 px-3 rounded-r-lg">NPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  <tr>
                    <td className="py-3 px-3 text-white font-medium">Loja Centenário</td>
                    <td className="py-3 px-3">TOCADORA</td>
                    <td className="py-3 px-3">450</td>
                    <td className="py-3 px-3 text-green-400 font-bold">75.0%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-white font-medium">Loja Jardins</td>
                    <td className="py-3 px-3">REGULAR</td>
                    <td className="py-3 px-3">620</td>
                    <td className="py-3 px-3 text-green-400 font-bold">68.5%</td>
                  </tr>
                  <tr className="bg-[#e306130a]">
                    <td className="py-3 px-3 text-white font-medium">Loja Pinheiros</td>
                    <td className="py-3 px-3">REGULAR</td>
                    <td className="py-3 px-3">12 *</td>
                    <td className="py-3 px-3 text-[#F2A900] font-bold">25.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column: NLP Comment Classification */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <h3 className="font-bold text-white">Classificação de Feedbacks</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-[#E30613] text-white">IA MOCK</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Comment Card 1 */}
              <div className="bg-[#222222] rounded-xl p-3 border-l-4 border-green-500 flex flex-col gap-1.5">
                <p className="text-xs text-white">"Atendimento excelente e loja limpa."</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                  <span className="text-green-400">POSITIVO</span>
                  <span className="bg-[#333333] px-1 rounded text-gray-400">Atendimento</span>
                </div>
              </div>

              {/* Comment Card 2 */}
              <div className="bg-[#222222] rounded-xl p-3 border-l-4 border-red-500 flex flex-col gap-1.5">
                <p className="text-xs text-white">"Não encontrei o produto que queria."</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                  <span className="text-red-400">NEGATIVO</span>
                  <span className="bg-[#333333] px-1 rounded text-gray-400">Abastecimento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
