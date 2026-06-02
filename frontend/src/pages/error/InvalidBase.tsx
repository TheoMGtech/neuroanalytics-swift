const InvalidBase = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-error">Erro de Base Inválida</h2>
        </div>
      </div>
      <div className="bg-surface rounded-xl p-8 border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
        <h3 className="font-headline-md text-xl font-semibold text-on-surface mb-2">Página em construção</h3>
      </div>
    </div>
  );
};

export default InvalidBase;
