import React, { useState } from 'react'

interface HomeProps {
  onUploadSuccess: () => void
}

export default function Home({ onUploadSuccess }: HomeProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saveAnalysis, setSaveAnalysis] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleProcess = () => {
    if (!selectedFile) return
    setIsProcessing(true)
    // Simulate process
    setTimeout(() => {
      setIsProcessing(false)
      onUploadSuccess()
    }, 2000)
  }

  return (
    <div className="max-w-xl mx-auto py-10 flex flex-col gap-6">
      {/* Introduction Card */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-white">Análise de NPS & Sentimentos</h2>
        <p className="text-gray-400 text-sm">
          Faça upload da base de avaliações mensais das lojas Swift para processar indicadores, mapear gerências e realizar análise de NLP.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          dragActive
            ? 'border-[#E30613] bg-[#e306130a]'
            : 'border-[#333333] bg-[#161616] hover:border-gray-600'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
        />
        
        {/* Upload Icon */}
        <div className="w-16 h-16 rounded-full bg-[#222222] flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8 text-[#E30613]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        {selectedFile ? (
          <div className="text-center flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        ) : (
          <div className="text-center flex flex-col gap-1">
            <p className="text-sm font-medium text-white">
              Arraste e solte seu arquivo aqui, ou{' '}
              <label htmlFor="file-upload" className="text-[#E30613] hover:underline cursor-pointer">
                procure
              </label>
            </p>
            <p className="text-xs text-gray-500">Formatos aceitos: CSV, XLSX, XLS (Max. 30MB)</p>
          </div>
        )}
      </div>

      {/* Configurations Card */}
      {selectedFile && (
        <div className="bg-[#161616] border border-[#222222] rounded-2xl p-5 flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveAnalysis}
              onChange={(e) => setSaveAnalysis(e.target.checked)}
              className="accent-[#E30613] h-4 w-4 rounded border-[#333333] bg-[#222222]"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Salvar Análise no Histórico</span>
              <span className="text-xs text-gray-500">Persistir os resultados agregados e comentários processados no banco de dados.</span>
            </div>
          </label>

          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full mt-2 py-3 rounded-xl bg-[#E30613] text-white font-bold hover:bg-[#c20510] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processando Base...</span>
              </>
            ) : (
              <span>Iniciar Análise</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
