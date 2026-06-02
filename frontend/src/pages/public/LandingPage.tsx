import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
      {/* Header */}
      <header className="w-full bg-surface-container-lowest border-b border-border-subtle sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/swift-logo.png" alt="Swift Logo" className="h-8 object-contain" />
            <span className="font-headline-md text-xl font-bold text-primary tracking-wide hidden sm:block">
              NeuroAnalytics
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md font-bold text-primary border-b-2 border-primary pb-1" href="#inicio">Início</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md" href="#recursos">Recursos</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-body-md" href="#comofunciona">Como funciona</a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-on-surface-variant hover:text-primary transition-colors font-body-md font-medium">Entrar</Link>
            <Link to="/register" className="bg-primary text-on-primary font-body-md font-bold py-2 px-5 rounded-lg hover:bg-surface-tint transition-colors">
              Começar agora
            </Link>
          </div>
          <button className="md:hidden text-on-surface-variant">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface-faint py-20 md:py-32" id="inicio">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
            <h1 className="font-display-lg text-4xl md:text-5xl lg:text-6xl text-on-surface font-bold leading-tight">
              Transforme avaliações de clientes em <span className="text-primary">decisões inteligentes</span>
            </h1>
            <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl mx-auto lg:mx-0">
              Utilize IA avançada para extrair insights reais do feedback dos seus clientes. Calcule NPS automaticamente, identifique outliers e entenda o sentimento por trás de cada palavra com precisão.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="bg-primary text-on-primary font-body-md font-bold py-3 px-8 rounded-lg shadow-sm hover:bg-surface-tint transition-colors flex items-center justify-center gap-2">
                Começar análise
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <Link to="/login" className="bg-transparent border border-navy-muted text-navy-muted font-body-md font-bold py-3 px-8 rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">play_circle</span>
                Ver demonstração
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl relative mx-auto lg:mx-0">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl transform -translate-y-1/4 translate-x-1/4"></div>
            <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-border-subtle p-2 md:p-6 relative z-10 rotate-1 hover:rotate-0 transition-transform duration-500">
              <img 
                alt="Dashboard Mockup" 
                className="w-full h-auto rounded-lg border border-border-subtle" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgjEbs8crYMmwoE3W6OzjVlgqY8MrxnZOpm3uYfKBYw7wUotnVShfG7-jRNPytVxxdIU4S-_VbEjsOGXOMF5P3XrIGBJ7_pSdj-SL8mCuMIx1ZvsghrjfdC0Cpe3oPekv9Y6SvjMxBzUWiNDCKb7zPg0fHpWHnew__CUBBvyS-xCAVcdEWPUSh8XQOxPX5mK0xEp1jzdfzwDGnnGWYyS6Q7GigPagJkCJK6jTrScYUA1kjvPOz5ZdIZFyGWNmPW_DTc5FHyns0qA"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section className="py-24 bg-surface" id="recursos">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface mb-4">Recursos Analíticos Avançados</h2>
            <p className="font-body-md text-lg text-on-surface-variant max-w-2xl mx-auto">
              Nossa plataforma foi desenhada para processamento denso de dados com uma interface limpa e focada.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'cloud_upload', title: 'Upload Inteligente', desc: 'Importação rápida e estruturada de grandes volumes de dados de planilhas e sistemas.', color: 'primary' },
              { icon: 'analytics', title: 'Cálculo de NPS', desc: 'Métricas de Net Promoter Score calculadas em tempo real com histórico de variações.', color: 'navy' },
              { icon: 'psychology', title: 'Análise de Sentimento', desc: 'Classificação automatizada de feedbacks em positivos, neutros e negativos utilizando IA.', color: 'primary' },
              { icon: 'error_outline', title: 'Detecção de Outliers', desc: 'Identificação imediata de anomalias nos dados que exigem atenção gerencial imediata.', color: 'navy' },
              { icon: 'category', title: 'Categorização Automática', desc: 'Agrupamento semântico de avaliações por temas recorrentes como produto, atendimento ou entrega.', color: 'primary' },
              { icon: 'history', title: 'Histórico', desc: 'Acesso consolidado a análises passadas para comparação longitudinal de performance.', color: 'navy' },
            ].map((f, i) => (
              <div key={i} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <div className={`w-14 h-14 ${f.color === 'primary' ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-navy-muted'} rounded-xl flex items-center justify-center mb-6`}>
                  <span className="material-symbols-outlined text-[28px]">{f.icon}</span>
                </div>
                <h3 className="font-headline-md text-xl font-semibold text-on-surface mb-3">{f.title}</h3>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="py-24 bg-surface-faint border-y border-border-subtle" id="comofunciona">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-20">
            <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-on-surface mb-4">Fluxo de Operação</h2>
            <p className="font-body-md text-lg text-on-surface-variant max-w-2xl mx-auto">
              Processo linear e seguro para transformar dados brutos em decisões.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-12 md:gap-4">
            {/* Line connecting steps */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-border-subtle -translate-y-[20px] z-0"></div>
            
            {[
              { icon: 'upload_file', step: 'Etapa 1', title: 'Upload', border: 'border-primary', text: 'text-primary' },
              { icon: 'fact_check', step: 'Etapa 2', title: 'Validação', border: 'border-border-subtle', text: 'text-secondary' },
              { icon: 'memory', step: 'Etapa 3', title: 'Processamento IA', border: 'border-border-subtle', text: 'text-secondary' },
              { icon: 'insights', step: 'Etapa 4', title: 'Insights', border: 'border-border-subtle', text: 'text-secondary' }
            ].map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center w-full md:w-1/4">
                <div className={`w-20 h-20 rounded-full bg-surface-container-lowest border-[3px] ${s.border} flex items-center justify-center mb-6 shadow-sm`}>
                  <span className={`material-symbols-outlined text-[32px] ${s.text}`}>{s.icon}</span>
                </div>
                <h4 className="font-label-md text-sm font-bold text-navy-muted mb-2 tracking-wider uppercase">{s.step}</h4>
                <h3 className="font-headline-md text-xl font-semibold text-on-surface">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-navy-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10">
          <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-on-primary mb-6">Pronto para entender melhor seus clientes?</h2>
          <p className="font-body-lg text-xl text-secondary-fixed-dim mb-10 max-w-2xl mx-auto">
            Junte-se a empresas data-driven que já utilizam o NeuroAnalytics para otimizar suas estratégias de experiência do cliente.
          </p>
          <Link to="/register" className="inline-block bg-primary text-on-primary font-body-md font-bold py-4 px-10 rounded-xl shadow-lg hover:bg-surface-tint hover:scale-105 transition-all">
            Criar minha primeira análise
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-surface-container-lowest border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center px-4 md:px-8 gap-4 mt-auto">
        <div className="font-label-md text-sm font-semibold text-on-surface-variant">
          © 2026 NeuroAnalytics SaaS. Todos os direitos reservados.
        </div>
        <nav className="flex gap-6">
          <a className="font-body-sm text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Termos</a>
          <a className="font-body-sm text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacidade</a>
          <a className="font-body-sm text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Suporte</a>
        </nav>
      </footer>
    </div>
  );
};

export default LandingPage;
