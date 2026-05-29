import { useState } from 'react'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import History from './pages/History'

function App() {
  const [currentTab, setCurrentTab] = useState<'upload' | 'dashboard' | 'history'>('upload')
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null)

  const navigateToDashboard = (analysisId: number | null = null) => {
    setSelectedAnalysisId(analysisId)
    setCurrentTab('dashboard')
  }

  return (
    <div className="min-height-screen bg-[#111111] text-white flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="border-b border-[#222222] bg-[#161616] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Swift Red Branding Circle */}
          <div className="w-4 h-4 rounded-full bg-[#E30613] animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-white">
            NEURO<span className="text-[#E30613]">ANALYTICS</span>
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-[#333333] text-gray-400 font-mono">
            SWIFT PARTNER
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentTab === 'upload'
                ? 'bg-[#E30613] text-white shadow-lg shadow-[#e3061333]'
                : 'text-gray-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentTab === 'dashboard'
                ? 'bg-[#E30613] text-white shadow-lg shadow-[#e3061333]'
                : 'text-gray-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentTab === 'history'
                ? 'bg-[#E30613] text-white shadow-lg shadow-[#e3061333]'
                : 'text-gray-400 hover:text-white hover:bg-[#222222]'
            }`}
          >
            Histórico
          </button>
        </nav>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {currentTab === 'upload' && (
          <Home onUploadSuccess={() => navigateToDashboard()} />
        )}
        {currentTab === 'dashboard' && (
          <Dashboard analysisId={selectedAnalysisId} />
        )}
        {currentTab === 'history' && (
          <History onSelectAnalysis={(id) => navigateToDashboard(id)} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] bg-[#161616] py-4 text-center text-xs text-gray-500">
        © 2026 NeuroAnalytics & Swift. Todos os direitos reservados.
      </footer>
    </div>
  )
}

export default App
