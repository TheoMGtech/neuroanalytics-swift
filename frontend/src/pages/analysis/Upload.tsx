import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { testFeaturesEnabled } from '../../config/features';

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveToHistory, setSaveToHistory] = useState(testFeaturesEnabled);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (
        selectedFile.type === 'text/csv' || 
        selectedFile.name.endsWith('.csv') || 
        selectedFile.name.endsWith('.xlsx')
      ) {
        setFile(selectedFile);
      } else {
        setError('Por favor, envie apenas arquivos CSV ou Excel (.xlsx)');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleUpload = () => {
    if (!file) return;
    navigate('/app/processing', { state: { file, saveToHistory } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">Nova Análise</h1>
        <p className="font-body-md text-on-surface-variant">Envie a base de dados com as avaliações dos seus clientes.</p>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-primary bg-primary-fixed/20' 
            : 'border-border-subtle bg-surface hover:border-primary/50 hover:bg-surface-container'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center transition-colors">
            <span className={`material-symbols-outlined text-[40px] ${isDragActive ? 'text-primary' : 'text-on-surface-variant'}`}>
              cloud_upload
            </span>
          </div>
        </div>

        <h3 className="font-headline-md text-xl font-semibold text-on-surface mb-2">
          {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste e solte seu arquivo aqui'}
        </h3>
        <p className="font-body-sm text-on-surface-variant mb-6">
          ou clique para selecionar do seu computador
        </p>

        <div className="inline-flex items-center gap-2 font-label-md text-xs bg-surface-container-high px-3 py-1.5 rounded text-on-surface-variant">
          Suporta .CSV e .XLSX (Máx 50MB)
        </div>
      </div>

      {error && (
        <div className="bg-error-container border border-error/20 text-on-error-container p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">error</span>
          <p className="font-body-sm text-sm">{error}</p>
        </div>
      )}

      {file && !error && (
        <div className="bg-surface border border-border-subtle p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary-container">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <p className="font-label-md font-medium text-on-surface truncate max-w-[200px] sm:max-w-sm">{file.name}</p>
              <p className="font-data-tabular text-xs text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-status-success">check_circle</span>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-border-subtle">
        <label className="mr-auto flex items-center gap-3 text-sm text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={saveToHistory}
            onChange={(e) => setSaveToHistory(e.target.checked)}
            className="rounded border-border-subtle text-primary focus:ring-primary"
          />
          Salvar análise no histórico
        </label>
        <button
          onClick={handleUpload}
          disabled={!file || !!error}
          className={`px-8 py-3 rounded-lg font-bold shadow-sm transition-all ${
            file && !error
              ? 'bg-primary text-on-primary hover:bg-surface-tint'
              : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
          }`}
        >
          Iniciar Análise com IA
        </button>
      </div>
    </div>
  );
};

export default Upload;
