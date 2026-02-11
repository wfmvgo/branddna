import React from 'react';
import { BusinessDNA } from '../types';
import { ColorSwatch } from './ColorSwatch';

interface BrandDashboardProps {
  data: BusinessDNA;
  onReset: () => void;
}

export const BrandDashboard: React.FC<BrandDashboardProps> = ({ data, onReset }) => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
        <div>
          <h2 className="text-zinc-500 text-sm tracking-widest uppercase mb-2">Идентификация бренда</h2>
          <h1 className="font-serif text-5xl md:text-7xl text-white italic">{data.businessName}</h1>
          <p className="text-zinc-400 mt-2 text-lg">{data.tagline}</p>
        </div>
        <button 
          onClick={onReset}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Новый анализ
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Col: Logo & Image */}
        <div className="md:col-span-5 flex flex-col gap-8">
          {/* Logo Section */}
          <div className="glass-card rounded-3xl p-8 min-h-[400px] flex flex-col justify-between">
            <div>
              <h3 className="text-zinc-300 font-medium mb-1">Логотип</h3>
              <p className="text-zinc-500 text-sm">С сайта компании</p>
            </div>
            <div className="flex-grow flex items-center justify-center py-8">
               {data.logoUrl ? (
                 <img 
                  src={data.logoUrl} 
                  alt="Generated Logo" 
                  className="w-48 h-48 object-contain drop-shadow-2xl rounded-xl"
                 />
               ) : (
                 <div className="w-48 h-48 bg-zinc-800 rounded-full animate-pulse opacity-50"></div>
               )}
            </div>
            <div className="text-xs text-zinc-600 font-mono border-t border-white/5 pt-4">
              ПРОМПТ: {data.logoPrompt.slice(0, 100)}...
            </div>
          </div>

           {/* Brand Image Section */}
           <div className="glass-card rounded-3xl p-2 relative overflow-hidden group">
            {data.brandImageUrl ? (
                <img 
                  src={data.brandImageUrl} 
                  alt="Brand Mood" 
                  className="w-full h-64 object-cover rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity"
                />
            ) : (
                <div className="w-full h-64 bg-zinc-800 rounded-2xl animate-pulse"></div>
            )}
             <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
               <span className="text-white text-xs font-medium">Изображение бренда</span>
             </div>
           </div>
        </div>

        {/* Right Col: Details */}
        <div className="md:col-span-7 flex flex-col gap-8">
          
          {/* Colors */}
          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-zinc-300 font-medium mb-6">Цветовая палитра</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <ColorSwatch color={data.colors.primary} label="Основной" usage="Главный" />
              <ColorSwatch color={data.colors.secondary} label="Вторичный" usage="Поддержка" />
              <ColorSwatch color={data.colors.accent} label="Акцент" usage="Выделение" />
              <ColorSwatch color={data.colors.background} label="Фон" usage="Подложка" />
              <ColorSwatch color={data.colors.text} label="Текст" usage="Содержимое" />
            </div>
          </div>

          {/* Typography */}
          <div className="glass-card rounded-3xl p-8">
             <h3 className="text-zinc-300 font-medium mb-6">Типографика</h3>
             <div className="space-y-8">
                <div>
                  <p className="text-zinc-500 text-xs uppercase mb-2">Заголовки</p>
                  <p className="text-4xl text-white" style={{ fontFamily: data.typography.headingFont }}>
                    {data.typography.headingFont}
                  </p>
                  <p className="text-zinc-400 text-lg mt-1" style={{ fontFamily: data.typography.headingFont }}>
                    Быстрая коричневая лиса прыгает через ленивую собаку.
                  </p>
                </div>
                <div className="h-[1px] bg-white/5 w-full"></div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase mb-2">Основной текст</p>
                  <p className="text-2xl text-white" style={{ fontFamily: data.typography.bodyFont }}>
                    {data.typography.bodyFont}
                  </p>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed max-w-lg" style={{ fontFamily: data.typography.bodyFont }}>
                     Эффективно используйте кросс-медийную информацию для максимизации результатов. Создавайте своевременные решения для реальных задач.
                  </p>
                </div>
             </div>
          </div>

          {/* Tone & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card rounded-3xl p-8">
              <h3 className="text-zinc-300 font-medium mb-4">Тон коммуникации</h3>
              <div className="flex flex-wrap gap-2">
                {data.toneOfVoice.map((tone, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full border border-white/10 text-zinc-300 text-sm bg-white/5">
                    {tone}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-8">
               <h3 className="text-zinc-300 font-medium mb-4">О бренде</h3>
               <p className="text-zinc-400 text-sm leading-relaxed">
                 {data.brandSummary}
               </p>
            </div>
          </div>

          {/* Real Sources Info */}
          {data.sources && data.sources.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border-t border-white/5">
               <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Источники анализа</p>
               <div className="flex flex-wrap gap-3">
                  {data.sources.map((source, idx) => {
                     let hostname = source;
                     try { hostname = new URL(source).hostname; } catch(e) {}
                     return (
                      <a 
                        key={idx} 
                        href={source} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-zinc-400 text-xs bg-white/5 px-3 py-1.5 rounded-md hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                      >
                         <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                         </svg>
                         {hostname}
                      </a>
                     )
                  })}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};