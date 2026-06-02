import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Database, Brain, BarChart, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const steps = [
  { id: 1, text: 'Enviando arquivo...', icon: Database },
  { id: 2, text: 'Processando dados via IA...', icon: Brain },
  { id: 3, text: 'Gerando métricas e insights...', icon: BarChart },
];

const Processing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const location = useLocation();
  const file = location.state?.file;

  useEffect(() => {
    if (!file) {
      navigate('/app/upload');
      return;
    }

    const processFile = async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('save_analysis', 'true');

        setCurrentStep(2);
        
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setCurrentStep(3);
        
        // Wait a bit to show step 3
        setTimeout(() => {
          navigate('/app/preview', { state: { result: response.data } });
        }, 1500);

      } catch (error: any) {
        console.error('Upload error', error);
        setErrorMsg(error.response?.data?.detail || 'Erro inesperado ao processar arquivo. Verifique o formato e tente novamente.');
      }
    };

    processFile();
  }, [file, navigate]);

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto space-y-8">
        <div className="w-24 h-24 bg-status-error/10 border border-status-error/30 rounded-full flex items-center justify-center text-status-error shadow-[0_0_30px_rgba(224,68,3,0.2)]">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-on-surface">Falha no Processamento</h2>
          <p className="text-status-error font-medium">{errorMsg}</p>
        </div>
        <button
          onClick={() => navigate('/app/upload')}
          className="bg-surface border border-border-subtle hover:bg-surface-faint text-on-surface px-8 py-3 rounded-lg font-bold transition-all"
        >
          Voltar e tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto space-y-12">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-[#E30613]/20 blur-3xl rounded-full w-48 h-48 animate-pulse" />
        <div className="w-32 h-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full flex items-center justify-center relative z-10 shadow-2xl">
          <Loader2 className="w-12 h-12 text-[#E30613] animate-spin" />
        </div>
      </div>

      <div className="w-full space-y-4 bg-[#161616] p-8 rounded-2xl border border-[#222222] shadow-xl">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          
          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-4 transition-all duration-500 ${
                isActive ? 'opacity-100 scale-105' : isCompleted ? 'opacity-50' : 'opacity-30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isActive 
                  ? 'bg-[#E30613] text-white shadow-lg shadow-[#e3061344]' 
                  : isCompleted 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-[#222222] text-gray-500'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <p className={`font-medium ${isActive ? 'text-white' : isCompleted ? 'text-green-500' : 'text-gray-500'}`}>
                {step.text}
              </p>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#E30613] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <p className="text-center text-sm text-gray-400">
        Este processo pode levar alguns segundos dependendo do tamanho da base de dados.
      </p>
    </div>
  );
};

export default Processing;
