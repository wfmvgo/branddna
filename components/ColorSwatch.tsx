import React from 'react';

interface ColorSwatchProps {
  color: string;
  label: string;
  usage: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, label, usage }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(color);
    // Could add a toast here
  };

  return (
    <div 
      className="group flex flex-col gap-2 cursor-pointer"
      onClick={copyToClipboard}
    >
      <div 
        className="w-full h-24 rounded-2xl shadow-lg transition-transform transform group-hover:scale-[1.02] border border-white/5 relative overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
             <span className="text-white opacity-0 group-hover:opacity-100 font-mono text-xs bg-black/50 px-2 py-1 rounded">Копировать</span>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div>
           <p className="text-zinc-200 text-sm font-medium">{label}</p>
           <p className="text-zinc-500 text-xs">{usage}</p>
        </div>
        <p className="text-zinc-400 font-mono text-xs uppercase">{color}</p>
      </div>
    </div>
  );
};