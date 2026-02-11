import React, { useState } from 'react';
import { InputCard } from './components/InputCard';
import { BrandDashboard } from './components/BrandDashboard';
import { analyzeBrandIdentity } from './geminiService';
import { AppState, BusinessDNA } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [brandData, setBrandData] = useState<BusinessDNA | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAnalysis = async (url: string) => {
    setAppState(AppState.ANALYZING);
    setLoadingMessage("Анализируем бренд...");
    
    try {
      const data = await analyzeBrandIdentity(url);
      setBrandData(data);
      setAppState(AppState.COMPLETE);

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || String(error));
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setBrandData(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-zinc-100 selection:bg-zinc-700 selection:text-white">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        
        {/* Nav */}
        <nav className="flex justify-between items-center py-6 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center font-serif italic font-bold text-white">
              B
            </div>
            <span className="font-semibold tracking-tight text-lg">BrandDNA</span>
          </div>
          <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">Документация</a>
        </nav>

        {/* Content Switcher */}
        <div className="flex-grow flex flex-col justify-center">
          
          {appState === AppState.IDLE && (
            <div className="animate-fade-in-up">
              <InputCard onSubmit={handleAnalysis} isLoading={false} />
            </div>
          )}

          {(appState === AppState.ANALYZING || appState === AppState.GENERATING_ASSETS) && (
             <div className="flex flex-col items-center justify-center animate-pulse">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                  <div className="absolute inset-0 border-t-4 border-zinc-200 rounded-full animate-spin"></div>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl italic text-white mb-2">{loadingMessage}</h2>
                <p className="text-zinc-500 text-sm">Работает на AI</p>
             </div>
          )}

          {appState === AppState.COMPLETE && brandData && (
            <BrandDashboard data={brandData} onReset={handleReset} />
          )}

          {appState === AppState.ERROR && (
             <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Ошибка анализа</h2>
                <p className="text-zinc-400 mb-4">Произошла ошибка при анализе бренда.</p>
                {errorMessage && <p className="text-red-400/70 text-xs font-mono mb-6 max-w-md break-all">{errorMessage}</p>}
                <button onClick={handleReset} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors">
                  Попробовать снова
                </button>
             </div>
          )}

        </div>

        <footer className="py-6 text-center text-zinc-600 text-xs mt-12">
          &copy; {new Date().getFullYear()} BrandDNA. Анализ на основе AI.
        </footer>
      </main>
    </div>
  );
};

export default App;