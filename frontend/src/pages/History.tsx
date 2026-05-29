interface HistoryProps {
  onSelectAnalysis: (id: number) => void
}

export default function History({ onSelectAnalysis }: HistoryProps) {
  // Mock history database records
  const historyList = [
    {
      id: 1,
      fileName: "avaliacoes_jan_2026.xlsx",
      createdAt: "2026-06-01T15:00:00",
      generalNps: 48.5,
      totalReviews: 12000
    },
    {
      id: 2,
      fileName: "avaliacoes_dez_2025.xlsx",
      createdAt: "2025-12-05T10:30:00",
      generalNps: 52.1,
      totalReviews: 10500
    }
  ]

  return (
    <div className="flex flex-col gap-6 py-4 animate-fade-in">
      <div className="border-b border-[#222222] pb-4">
        <h2 className="text-2xl font-bold text-white">Histórico de Análises</h2>
        <p className="text-gray-400 text-xs mt-0.5">Explore e compare relatórios de NPS consolidados anteriormente</p>
      </div>

      {historyList.length === 0 ? (
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-10 text-center text-gray-500">
          Nenhuma análise foi persistida no histórico ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyList.map((item) => (
            <div
              key={item.id}
              className="bg-[#161616] border border-[#222222] rounded-2xl p-5 hover:border-[#E30613] transition-colors duration-300 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">#{item.id}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base truncate">{item.fileName}</h3>
              </div>

              <div className="flex items-center justify-between bg-[#222222] px-4 py-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">NPS Geral</span>
                  <span className="text-xl font-extrabold text-[#E30613]">{item.generalNps}%</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Avaliações</span>
                  <span className="text-sm font-bold text-white">{item.totalReviews.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectAnalysis(item.id)}
                  className="flex-1 py-2 px-4 rounded-lg bg-[#222222] hover:bg-[#333333] text-white text-sm font-semibold transition-colors duration-200"
                >
                  Visualizar Detalhes
                </button>
                <button
                  className="p-2 rounded-lg bg-[#222222] hover:bg-red-950 text-red-500 transition-colors duration-200"
                  aria-label="Delete analysis"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
