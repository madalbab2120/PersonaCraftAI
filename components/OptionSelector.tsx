
import React, { useState } from 'react';
import { Suggestions, SelectedOptions, Quality, Language } from '../types';
import { Sparkles, Shirt, MapPin, Palette, Zap, Plus, Smile, Flame, Edit3, LayoutTemplate } from 'lucide-react';

interface OptionSelectorProps {
  suggestions: Suggestions;
  selected: SelectedOptions;
  onChange: (category: keyof SelectedOptions, value: any) => void;
  quality: Quality;
  setQuality: (q: Quality) => void;
  customPrompt: string;
  setCustomPrompt: (s: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  language: Language;
}

const translations = {
  en: {
    customize: "Customize Your Image",
    modeGuided: "Guided Mode",
    modeManual: "Manual Prompt",
    choosePhoto: "Choose different photo",
    expression: "Expression",
    clothing: "Clothing",
    scene: "Scene",
    style: "Art Style",
    hijab: "Headscarf / Tudung (Optional)",
    color: "Clothing Color",
    other: "Custom...",
    enterCustom: "Enter custom value...",
    viralMode: "Viral & Fantastic Mode",
    viralDesc: "Make the image rare, extraordinary, and stunning",
    instructions: "Additional Instructions (Optional)",
    manualInstructions: "Describe exactly what you want to see. The AI will use your image as a reference.",
    placeholder: "e.g., holding a red coffee cup, futuristic lighting...",
    manualPlaceholder: "e.g., A cyberpunk warrior standing in neon rain, wearing glowing armor, cinematic lighting, 8k resolution...",
    standard: "Standard (Fast)",
    high: "High Quality",
    generate: "Generate Image ✨",
    hijabOptions: ["None", "Bawal", "Shawl", "Sarung", "Turban", "Instant"],
    colorOptions: ["Black", "White", "Red", "Blue", "Gold", "Pastel", "Neon"],
  },
  ms: {
    customize: "Ubah Suai Imej Anda",
    modeGuided: "Mod Bantuan",
    modeManual: "Mod Manual (Bebas)",
    choosePhoto: "Pilih gambar lain",
    expression: "Ekspresi Muka",
    clothing: "Pakaian",
    scene: "Latar Belakang",
    style: "Gaya Seni",
    hijab: "Gaya Tudung (Pilihan)",
    color: "Warna Pakaian",
    other: "Lain-lain...",
    enterCustom: "Masukkan pilihan anda...",
    viralMode: "Mod Viral & Luar Biasa",
    viralDesc: "Jadikan imej rare, fantastik dan menakjubkan",
    instructions: "Arahan Tambahan (Pilihan)",
    manualInstructions: "Huraikan dengan tepat apa yang anda mahu. AI akan menggunakan gambar anda sebagai rujukan.",
    placeholder: "cth: memegang cawan merah, pencahayaan futuristik...",
    manualPlaceholder: "cth: Seorang pahlawan siber berdiri dalam hujan neon, memakai baju besi bercahaya, pencahayaan sinematik...",
    standard: "Standard (Pantas)",
    high: "Kualiti Tinggi",
    generate: "Jana Imej ✨",
    hijabOptions: ["Tiada", "Bawal", "Shawl", "Sarung", "Turban", "Instant"],
    colorOptions: ["Hitam", "Putih", "Merah", "Biru", "Emas", "Pastel", "Neon"],
  }
};

const OptionSelector: React.FC<OptionSelectorProps> = ({
  suggestions,
  selected,
  onChange,
  quality,
  setQuality,
  customPrompt,
  setCustomPrompt,
  onGenerate,
  onBack,
  language
}) => {
  const t = translations[language];
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [activeCustom, setActiveCustom] = useState<Record<string, boolean>>({});

  // Helper to handle custom input changes
  const handleCustomInputChange = (category: keyof SelectedOptions, value: string) => {
    setCustomInputs(prev => ({ ...prev, [category]: value }));
    onChange(category, value);
  };

  const handlePresetClick = (category: keyof SelectedOptions, value: string) => {
    setActiveCustom(prev => ({ ...prev, [category]: false }));
    onChange(category, value);
  };

  const handleCustomClick = (category: keyof SelectedOptions) => {
    setActiveCustom(prev => ({ ...prev, [category]: true }));
    const val = customInputs[category] !== undefined ? customInputs[category] : '';
    onChange(category, val);
  };

  const handleModeChange = (isManual: boolean) => {
    onChange('isManualMode', isManual);
  };

  const renderSection = (
    title: string, 
    icon: React.ReactNode, 
    category: keyof SelectedOptions, 
    options: string[]
  ) => {
    const isCustomMode = activeCustom[category] || (selected[category] && !options.includes(selected[category] as string));
    
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-slate-200 font-semibold">
          {icon}
          <h3>{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handlePresetClick(category, opt)}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-all duration-200 text-left truncate
                ${selected[category] === opt && !activeCustom[category]
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }
              `}
            >
              {opt}
            </button>
          ))}
          {/* Custom Option Button */}
          <button
            onClick={() => handleCustomClick(category)}
            className={`
              px-3 py-2 text-sm rounded-lg border transition-all duration-200 text-left flex items-center gap-2
              ${isCustomMode
                ? 'bg-blue-600 border-blue-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }
            `}
          >
            <Plus className="w-3 h-3" />
            {t.other}
          </button>
        </div>
        
        {/* Custom Input Field */}
        {isCustomMode && (
          <input
            type="text"
            value={customInputs[category] || selected[category] || ''} 
            onChange={(e) => handleCustomInputChange(category, e.target.value)}
            placeholder={t.enterCustom}
            className="w-full bg-slate-900 border border-blue-500/50 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none animate-in fade-in slide-in-from-top-2"
            autoFocus
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{t.customize}</h2>
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-white">
          ← {t.choosePhoto}
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex p-1 bg-slate-900 rounded-xl mb-6 border border-slate-800">
        <button
          onClick={() => handleModeChange(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            !selected.isManualMode 
              ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          {t.modeGuided}
        </button>
        <button
          onClick={() => handleModeChange(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
            selected.isManualMode 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          {t.modeManual}
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        
        {!selected.isManualMode ? (
          /* Guided Mode Content */
          <>
            {renderSection(t.expression, <Smile className="w-4 h-4 text-yellow-400" />, 'expression', suggestions.expressions)}
            {renderSection(t.hijab, <span className="text-pink-400 font-bold text-xs">🧕</span>, 'hijab', t.hijabOptions)}
            {renderSection(t.clothing, <Shirt className="w-4 h-4 text-purple-400" />, 'clothing', suggestions.clothing)}
            {renderSection(t.color, <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-500 to-blue-500"></div>, 'clothingColor', t.colorOptions)}
            {renderSection(t.scene, <MapPin className="w-4 h-4 text-green-400" />, 'scene', suggestions.scenes)}
            {renderSection(t.style, <Palette className="w-4 h-4 text-pink-400" />, 'style', suggestions.styles)}

            {/* Viral Mode Toggle */}
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-600/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">{t.viralMode}</h3>
                    <p className="text-xs text-slate-400">{t.viralDesc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selected.isViral} 
                    onChange={(e) => onChange('isViral', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-200 font-semibold mb-2">{t.instructions}</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={2}
              />
            </div>
          </>
        ) : (
          /* Manual Mode Content */
          <div className="mb-6 animate-in fade-in">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-blue-500/20 rounded-lg">
                 <Edit3 className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">{t.modeManual}</h3>
                 <p className="text-sm text-slate-400">{t.manualInstructions}</p>
               </div>
             </div>
             <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t.manualPlaceholder}
                className="w-full h-48 bg-slate-800 border border-slate-600 rounded-xl p-4 text-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
              />
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-700">
          <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setQuality(Quality.STANDARD)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                quality === Quality.STANDARD ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.standard}
            </button>
            <button
              onClick={() => setQuality(Quality.HIGH)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                quality === Quality.HIGH ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              {t.high}
            </button>
          </div>

          <button
            onClick={onGenerate}
            disabled={!selected.isManualMode && (!selected.style || !selected.expression)}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {t.generate}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionSelector;
