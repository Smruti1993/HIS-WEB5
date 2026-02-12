
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface DentalChartProps {
  onSave: (toothNumbers: string[]) => void;
  onClose: () => void;
  initialSelection?: string[];
}

// Tooth component to render SVG shape
const Tooth = ({ number, isSelected, onClick, jaw }: { number: number, isSelected: boolean, onClick: () => void, jaw: 'upper' | 'lower' }) => {
  const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(number);
  
  return (
    <div className="flex flex-col items-center gap-1 group cursor-pointer relative" onClick={onClick}>
        {/* The Tooth Visual */}
        <div className={`
            relative w-10 h-16 transition-all duration-200
            ${isSelected ? 'scale-110 drop-shadow-md z-10' : 'hover:scale-105 z-0'}
        `}>
            {/* Crown & Root SVG */}
            <svg viewBox="0 0 100 160" className="w-full h-full filter drop-shadow-sm">
                <defs>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.2" />
                    </filter>
                </defs>
                
                {/* Root (Different for Upper/Lower) */}
                <path 
                    d={jaw === 'upper' 
                       ? "M30,70 Q40,10 50,0 Q60,10 70,70 L30,70" 
                       : "M30,90 Q40,150 50,160 Q60,150 70,90 L30,90"
                    }
                    fill="#fefcf0"
                    stroke="#d4d4d4"
                    strokeWidth="2"
                />
                
                {/* Crown */}
                <path 
                    d={jaw === 'upper'
                        ? "M20,70 C10,70 10,110 20,130 Q50,140 80,130 C90,110 90,70 80,70 Z"
                        : "M20,90 C10,90 10,50 20,30 Q50,20 80,30 C90,50 90,90 80,90 Z"
                    }
                    fill={isSelected ? "#bfdbfe" : "#ffffff"} // Blue tint if selected
                    stroke={isSelected ? "#2563eb" : "#9ca3af"}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="transition-colors duration-200"
                />
                
                {/* Surface Markings (Simple Cross for molars) */}
                {isMolar && (
                    <path 
                        d={jaw === 'upper' ? "M35,90 L65,110 M65,90 L35,110" : "M35,50 L65,70 M65,50 L35,70"}
                        stroke="#e5e7eb" strokeWidth="2" fill="none"
                    />
                )}
            </svg>
            
            {/* Selection Indicator Overlay (Box) from screenshot style */}
            {isSelected && (
                <div className="absolute inset-0 border-2 border-red-500 rounded-sm pointer-events-none animate-in fade-in zoom-in duration-200"></div>
            )}
        </div>

        {/* FDI Number */}
        <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-600' : 'text-white'}`}>
            {number}
        </span>
    </div>
  );
};

export const DentalChart: React.FC<DentalChartProps> = ({ onSave, onClose, initialSelection = [] }) => {
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>(initialSelection);

  // FDI Notation Arrays
  const adultUpperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const adultUpperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const adultLowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const adultLowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const childUpperRight = [55, 54, 53, 52, 51];
  const childUpperLeft = [61, 62, 63, 64, 65];
  const childLowerRight = [85, 84, 83, 82, 81];
  const childLowerLeft = [71, 72, 73, 74, 75];

  const toggleTooth = (num: number) => {
    const sNum = num.toString();
    setSelectedTeeth(prev => 
        prev.includes(sNum) ? prev.filter(t => t !== sNum) : [...prev, sNum]
    );
  };

  const handleUpdate = () => {
      onSave(selectedTeeth);
  };

  const removeSelected = () => {
      setSelectedTeeth([]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-400">
            {/* Header */}
            <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 text-sm">Tooth Selection Chart</h3>
                <button onClick={onClose} className="hover:bg-slate-200 p-1 rounded transition-colors"><X className="w-5 h-5 text-slate-600"/></button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chart Visualization */}
                <div className="flex-1 bg-[#d4a5a5] p-6 overflow-y-auto relative flex flex-col items-center justify-center border-r border-slate-300">
                    {/* Background Texture/Gum Color mimic */}
                    <div className="absolute inset-0 bg-[#eebbbb] opacity-50 pointer-events-none"></div>
                    
                    {/* ADULT TEETH */}
                    <div className="relative z-10 w-full max-w-4xl space-y-8">
                        {/* Upper Arch */}
                        <div className="flex justify-center gap-1">
                            <div className="flex gap-1 border-b-2 border-red-400/30 pb-2 px-4 rounded-b-[3rem] bg-[#e39e9e] shadow-inner">
                                {adultUpperRight.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="upper" />)}
                            </div>
                            <div className="w-px bg-red-800/20 mx-2"></div>
                            <div className="flex gap-1 border-b-2 border-red-400/30 pb-2 px-4 rounded-b-[3rem] bg-[#e39e9e] shadow-inner">
                                {adultUpperLeft.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="upper" />)}
                            </div>
                        </div>

                        {/* Lower Arch */}
                        <div className="flex justify-center gap-1">
                            <div className="flex gap-1 border-t-2 border-red-400/30 pt-2 px-4 rounded-t-[3rem] bg-[#e39e9e] shadow-inner">
                                {adultLowerRight.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="lower" />)}
                            </div>
                            <div className="w-px bg-red-800/20 mx-2"></div>
                            <div className="flex gap-1 border-t-2 border-red-400/30 pt-2 px-4 rounded-t-[3rem] bg-[#e39e9e] shadow-inner">
                                {adultLowerLeft.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="lower" />)}
                            </div>
                        </div>
                    </div>

                    {/* DECIDUOUS TEETH (Small section below) */}
                    <div className="relative z-10 w-full max-w-2xl mt-12 pt-8 border-t border-red-900/10">
                        <h4 className="text-center text-[#7f1d1d] font-bold text-xs uppercase mb-4 tracking-wider opacity-60">Deciduous Dentition (Child)</h4>
                        <div className="flex flex-col gap-4">
                             {/* Upper Child */}
                            <div className="flex justify-center gap-1 opacity-90 scale-90">
                                {childUpperRight.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="upper" />)}
                                <div className="w-4"></div>
                                {childUpperLeft.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="upper" />)}
                            </div>
                             {/* Lower Child */}
                            <div className="flex justify-center gap-1 opacity-90 scale-90">
                                {childLowerRight.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="lower" />)}
                                <div className="w-4"></div>
                                {childLowerLeft.map(t => <Tooth key={t} number={t} isSelected={selectedTeeth.includes(t.toString())} onClick={() => toggleTooth(t)} jaw="lower" />)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Controls & List */}
                <div className="w-80 bg-slate-50 flex flex-col border-l border-slate-300">
                    <div className="p-4 border-b border-slate-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input type="checkbox" className="rounded" />
                            Enable multi ICD-Tooth Selection
                        </label>
                        
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-600">Selected Teeth:</span>
                                <button 
                                    onClick={removeSelected}
                                    className="text-[10px] text-red-600 hover:underline flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> Clear All
                                </button>
                            </div>
                            <div className="bg-white border border-slate-300 rounded h-64 overflow-y-auto p-2 shadow-inner">
                                {selectedTeeth.length === 0 && <div className="text-center text-slate-400 text-xs mt-10 italic">Click teeth on chart to select</div>}
                                {selectedTeeth.sort().map(t => (
                                    <div key={t} className="flex justify-between items-center p-2 border-b border-slate-100 text-sm hover:bg-slate-50">
                                        <span className="font-bold text-slate-800">Tooth: {t}</span>
                                        <button onClick={() => toggleTooth(parseInt(t))} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 mt-auto border-t border-slate-200 bg-slate-100 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-slate-300 bg-white rounded text-slate-600 text-sm font-bold hover:bg-slate-50">Cancel</button>
                        <button onClick={handleUpdate} className="px-6 py-2 bg-[#2e6f85] text-white rounded text-sm font-bold hover:bg-[#24586a] shadow-sm flex items-center gap-2">
                            <Check className="w-4 h-4" /> Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
