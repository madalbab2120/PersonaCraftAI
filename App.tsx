import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Loader2, Download, RefreshCw, XCircle, Sparkles, Globe, Info, Copy, Facebook, MessageCircle, BookOpen, Film, Briefcase, Smile, Camera } from 'lucide-react';
import { fileToGenerativePart, analyzeImageAndGetSuggestions, generateCreativeImage, generateFacebookContent } from './services/gemini';
import { Suggestions, SelectedOptions, AppState, Quality, Language, SocialPost, FBPostType } from './types';
import OptionSelector from './components/OptionSelector';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [language, setLanguage] = useState<Language>('en');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    expression: null,
    clothing: null,
    scene: null,
    style: null,
    hijab: null,
    clothingColor: null,
    isViral: false,
    isManualMode: false,
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [quality, setQuality] = useState<Quality>(Quality.STANDARD);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // FB Content States
  const [fbPost, setFbPost] = useState<SocialPost | null>(null);
  const [isGeneratingFb, setIsGeneratingFb] = useState(false);
  const [selectedFbType, setSelectedFbType] = useState<FBPostType | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file) return;

    try {
      setAppState(AppState.ANALYZING);
      setError(null);
      const base64 = await fileToGenerativePart(file);
      setReferenceImage(base64);

      // Analyze image
      const data = await analyzeImageAndGetSuggestions(base64);
      setSuggestions(data);
      
      // Pre-select first options for better UX
      setSelectedOptions({
        expression: data.expressions[0],
        clothing: data.clothing[0],
        scene: data.scenes[0],
        style: data.styles[0],
        hijab: language === 'ms' ? 'Tiada' : 'None',
        clothingColor: null,
        isViral: false,
        isManualMode: false,
      });
      
      setAppState(AppState.OPTIONS);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try another photo.");
      setAppState(AppState.UPLOAD);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    } else {
      setError(language === 'en' ? "Please drop a valid image file." : "Sila masukkan fail imej yang sah.");
    }
  };

  const handleOptionChange = (category: keyof SelectedOptions, value: any) => {
    setSelectedOptions(prev => ({ ...prev, [category]: value }));
  };

  const handleGenerate = async () => {
    if (!referenceImage) return;

    // Check for API Key if High Quality is selected
    if (quality === Quality.HIGH && (window as any).aistudio) {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
      } catch (err) {
        console.warn("API Key selection check failed", err);
        // Continue and try generation anyway, or let the user know
      }
    }

    try {
      setAppState(AppState.GENERATING);
      setError(null);
      setFbPost(null); // Reset FB post
      setSelectedFbType(null);
      
      // Pass the entire options object to the service
      const resultUrl = await generateCreativeImage(referenceImage, selectedOptions, customPrompt, quality);
      setGeneratedImage(resultUrl);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Failed to generate image. The model might be busy or the request was blocked.";
      if (err.message && err.message.includes('API key')) {
        errorMessage = "Invalid API Key. High Quality mode requires a valid API key linked to a billing project.";
      }
      setError(errorMessage);
      setAppState(AppState.OPTIONS);
    }
  };

  const handleGenerateFbContent = async (type: FBPostType) => {
    try {
      setIsGeneratingFb(true);
      setSelectedFbType(type);
      setFbPost(null);
      const content = await generateFacebookContent(selectedOptions, customPrompt, language, type);
      setFbPost(content);
    } catch (err) {
      console.error(err);
      setError("Failed to generate FB content.");
    } finally {
      setIsGeneratingFb(false);
    }
  };

  const resetApp = () => {
    setAppState(AppState.UPLOAD);
    setReferenceImage(null);
    setSuggestions(null);
    setGeneratedImage(null);
    setCustomPrompt('');
    setFbPost(null);
    setSelectedFbType(null);
    setError(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ms' : 'en');
  };

  // Translations for Main App
  const t = {
    en: {
      startOver: "Start Over",
      title: "Transform Your Photos",
      subtitle: "Upload a reference photo and let AI suggest creative variations.",
      clickUpload: "Click to upload",
      dragDrop: "Drag & drop image here",
      or: "OR",
      uploadFile: "Upload File",
      useCamera: "Use Camera",
      analyzing: "Analyzing Image...",
      analyzingDesc: "Identifying subject features and generating creative suggestions.",
      generating: "Creating Masterpiece",
      generatingDesc: "We are reimagining your photo with style...",
      original: "Original Reference",
      originalAnalysis: "Image Analysis",
      result: "Generated Result",
      adjust: "Adjust Settings",
      newProject: "New Project",
      promptDetails: "Prompt Details",
      fbTitle: "FB Pro Content Idea (Bahasa Melayu)",
      copy: "Copy Text",
      copied: "Copied!",
    },
    ms: {
      startOver: "Mula Semula",
      title: "Ubah Foto Anda",
      subtitle: "Muat naik gambar rujukan dan biarkan AI mencadangkan variasi kreatif.",
      clickUpload: "Klik untuk muat naik",
      dragDrop: "Seret & lepas gambar di sini",
      or: "ATAU",
      uploadFile: "Muat Naik Fail",
      useCamera: "Guna Kamera",
      analyzing: "Menganalisis Imej...",
      analyzingDesc: "Mengenal pasti ciri subjek dan menjana cadangan kreatif.",
      generating: "Mencipta Karya Agung",
      generatingDesc: "Kami sedang membayangkan semula foto anda dengan gaya...",
      original: "Rujukan Asal",
      originalAnalysis: "Analisis Imej",
      result: "Hasil Dijana",
      adjust: "Ubah Tetapan",
      newProject: "Projek Baru",
      promptDetails: "Butiran Prompt",
      fbTitle: "Idea Konten FB Pro",
      copy: "Salin Teks",
      copied: "Disalin!",
    }
  }[language];

  const fbOptions = [
    {
      type: 'REACTION',
      icon: <MessageCircle className="w-5 h-5 text-yellow-400" />,
      title: "Big Text + Reaction Photo",
      desc: "Hook besar + ekspresi wajah untuk tarik perhatian cepat.",
      useCase: "Awareness, call-out, tip ringkas."
    },
    {
      type: 'TUTORIAL',
      icon: <BookOpen className="w-5 h-5 text-blue-400" />,
      title: "Mini Tutorial Card",
      desc: "Foto + 1 idea tutorial (3 step / 1 insight).",
      useCase: "Saveable content, naik reach stabil."
    },
    {
      type: 'STORY',
      icon: <Film className="w-5 h-5 text-purple-400" />,
      title: "Situational Story Photo",
      desc: "Gambar situasi + teks relatable (POV).",
      useCase: "Tingkatkan komen & engagement."
    },
    {
      type: 'CORPORATE',
      icon: <Briefcase className="w-5 h-5 text-slate-400" />,
      title: "Clean Corporate Statement",
      desc: "Foto profesional + statement minimal yang kuat.",
      useCase: "Branding, trust, sharing tinggi."
    },
    {
      type: 'MEME',
      icon: <Smile className="w-5 h-5 text-green-400" />,
      title: "Silent Meme Style",
      desc: "Ekspresi kelakar + punchline 1 ayat.",
      useCase: "Engagement laju, humor ringan."
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">PersonaCraft</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'en' ? 'Bahasa Melayu' : 'English'}
            </button>

            {appState !== AppState.UPLOAD && (
               <button onClick={resetApp} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                 {t.startOver}
               </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        
        {/* Error Notification */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Upload State */}
        {appState === AppState.UPLOAD && (
          <div className="max-w-xl mx-auto mt-12 text-center animate-in zoom-in-95 duration-500">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              {t.title}
            </h1>
            <p className="text-lg text-slate-400 mb-10">
              {t.subtitle}
            </p>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center gap-8 group relative overflow-hidden
                ${isDragging 
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_50px_rgba(59,130,246,0.2)]' 
                  : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-600'
                }`}
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>

              {/* Icon Area */}
              <div className="relative z-10">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl border border-slate-700">
                  {isDragging ? (
                    <Download className="w-10 h-10 text-blue-400 animate-bounce" />
                  ) : (
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  )}
                </div>
              </div>

              {/* Text Area */}
              <div className="text-center space-y-2 relative z-10">
                <p className="text-xl font-bold text-white">{isDragging ? "Drop it like it's hot!" : t.dragDrop}</p>
                <p className="text-slate-500 text-sm">JPG/PNG • Max 5MB</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 w-full max-w-xs opacity-50 relative z-10">
                <div className="h-px bg-slate-600 flex-1"></div>
                <span className="text-xs font-bold text-slate-400">{t.or}</span>
                <div className="h-px bg-slate-600 flex-1"></div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-slate-800 hover:bg-blue-600 text-white rounded-xl font-medium transition-all border border-slate-600 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1"
                >
                  <ImageIcon className="w-5 h-5" />
                  {t.uploadFile}
                </button>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-slate-800 hover:bg-purple-600 text-white rounded-xl font-medium transition-all border border-slate-600 hover:border-purple-500 hover:shadow-lg hover:-translate-y-1"
                >
                  <Camera className="w-5 h-5" />
                  {t.useCamera}
                </button>
              </div>
            </div>

            {/* Hidden Inputs */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              capture="user"
              className="hidden" 
            />
          </div>
        )}

        {/* Analyzing State */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">{t.analyzing}</h2>
            <p className="text-slate-400">{t.analyzingDesc}</p>
          </div>
        )}

        {/* Options State */}
        {appState === AppState.OPTIONS && suggestions && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar with Reference Image */}
            <div className="lg:w-1/3 flex flex-col gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 sticky top-24">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">{t.original}</h3>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black/50 mb-4">
                  <img src={`data:image/jpeg;base64,${referenceImage}`} alt="Reference" className="w-full h-full object-cover" />
                </div>
                
                {/* Original Description Display */}
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{t.originalAnalysis}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{suggestions.originalDescription}"
                  </p>
                </div>
              </div>
            </div>
            
            {/* Options Selector */}
            <div className="lg:w-2/3">
              <OptionSelector 
                suggestions={suggestions}
                selected={selectedOptions}
                onChange={handleOptionChange}
                quality={quality}
                setQuality={setQuality}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                onGenerate={handleGenerate}
                onBack={resetApp}
                language={language}
              />
            </div>
          </div>
        )}

        {/* Generating State */}
        {appState === AppState.GENERATING && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in text-center px-4">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{t.generating}</h2>
            <p className="text-slate-400 max-w-md">
              {t.generatingDesc} <br/>
              {!selectedOptions.isManualMode && <span className="text-blue-400">"{selectedOptions.style}"</span>}
            </p>
          </div>
        )}

        {/* Result State */}
        {appState === AppState.RESULT && generatedImage && (
          <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={() => setAppState(AppState.OPTIONS)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.adjust}
                </button>
                <button 
                  onClick={resetApp}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t.newProject}
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                {/* Left Col: Result Image */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> {t.result}
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-black aspect-square relative group">
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                    <a 
                      href={generatedImage} 
                      download="personacraft-result.png"
                      className="absolute bottom-4 right-4 bg-black/70 hover:bg-blue-600 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                  
                  {/* Prompt Details */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mt-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.promptDetails}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOptions.isManualMode ? (
                        <span className="text-sm text-slate-300 italic">{customPrompt}</span>
                      ) : (
                        <>
                          <span className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-blue-300">{selectedOptions.expression}</span>
                          <span className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-purple-300">{selectedOptions.clothing}</span>
                          <span className="text-xs px-2 py-1 bg-slate-800 rounded border border-slate-700 text-green-300">{selectedOptions.scene}</span>
                          {selectedOptions.isViral && <span className="text-xs px-2 py-1 bg-amber-900/30 rounded border border-amber-500/50 text-amber-500">Viral Mode</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Col: FB Pro Content Section */}
                <div className="flex flex-col h-full">
                   <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex-grow flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="p-2 bg-blue-600 rounded-lg">
                            <Facebook className="w-5 h-5 text-white" />
                         </div>
                         <div>
                           <h3 className="font-bold text-white text-lg">{t.fbTitle}</h3>
                           <p className="text-xs text-slate-400">Strategi Monetisasi & Engagement</p>
                         </div>
                      </div>

                      {!fbPost ? (
                        <div className="flex-grow flex flex-col">
                          <h4 className="text-sm font-semibold text-slate-300 mb-4">Pilih Jenis Konten:</h4>
                          <div className="grid gap-3">
                            {fbOptions.map((opt) => (
                              <button
                                key={opt.type}
                                onClick={() => handleGenerateFbContent(opt.type as FBPostType)}
                                disabled={isGeneratingFb}
                                className={`
                                  flex items-start gap-4 p-4 rounded-xl text-left border transition-all duration-200
                                  ${selectedFbType === opt.type 
                                    ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500' 
                                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-600'
                                  }
                                  ${isGeneratingFb && selectedFbType !== opt.type ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                              >
                                <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0 ${isGeneratingFb && selectedFbType === opt.type ? 'animate-pulse' : ''}`}>
                                  {isGeneratingFb && selectedFbType === opt.type ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : opt.icon}
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-200 text-sm">{opt.title}</h5>
                                  <p className="text-xs text-slate-400 mt-1 mb-2">{opt.desc}</p>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400/80 bg-blue-400/10 px-2 py-0.5 rounded">
                                    {opt.useCase}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-bottom-2 h-full">
                           <div className="flex justify-between items-center mb-2">
                             <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                               {fbOptions.find(o => o.type === selectedFbType)?.title}
                             </h4>
                             <button 
                               onClick={() => setFbPost(null)}
                               className="text-xs text-slate-400 hover:text-white underline"
                             >
                               Pilih Semula
                             </button>
                           </div>
                           
                           <div className="flex-grow bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 overflow-y-auto min-h-[300px] mb-4 space-y-4">
                              <h4 className="font-bold text-lg text-white">{fbPost.headline}</h4>
                              <p className="whitespace-pre-line leading-relaxed text-slate-300">{fbPost.content}</p>
                              <div className="text-blue-400 font-medium pt-2">
                                {fbPost.hashtags.join(" ")}
                              </div>
                           </div>
                           
                           <div className="flex gap-2 mt-auto">
                             <button 
                               onClick={() => {
                                 const fullText = `${fbPost.headline}\n\n${fbPost.content}\n\n${fbPost.hashtags.join(" ")}`;
                                 navigator.clipboard.writeText(fullText);
                                 // Could add a toast here
                               }}
                               className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                             >
                               <Copy className="w-4 h-4" /> {t.copy}
                             </button>
                             <button 
                               onClick={() => selectedFbType && handleGenerateFbContent(selectedFbType)}
                               disabled={isGeneratingFb}
                               className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                             >
                               {isGeneratingFb ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                             </button>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;