import React, { useState } from 'react';

interface InputCardProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const InputCard: React.FC<InputCardProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-[1px] rounded-3xl bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-2xl">
      <div className="bg-[#1c1c1e] rounded-3xl p-8 md:p-12 text-center border border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-white/5 blur-[80px] rounded-full pointer-events-none" />

        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4 italic tracking-wide relative z-10">
          Введите сайт
        </h1>
        
        <p className="text-zinc-400 text-sm md:text-base mb-10 relative z-10 font-light">
          Мы проанализируем ваш бизнес и создадим ДНК бренда
        </p>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
          <input
            type="text"
            placeholder="www.example.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[#121214] text-zinc-200 placeholder-zinc-600 rounded-2xl px-6 py-4 text-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all text-center"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`w-full py-4 rounded-full font-medium text-lg transition-all duration-300 ${
              input.trim() && !isLoading
                ? 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg cursor-pointer'
                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Анализируем...
              </span>
            ) : (
              'Анализировать'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};