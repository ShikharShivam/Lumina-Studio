import React, { useState, useRef, useEffect } from 'react';
import { AssetList } from './components/AssetList';
import { MusicPanel } from './components/MusicPanel';
import { Stage } from './components/Stage';
import { Asset, FilterSettings, Track, ProjectStatus } from './types';
import { DEFAULT_FILTERS } from './constants';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [isAutoEnhanceAudio, setIsAutoEnhanceAudio] = useState(false);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>(ProjectStatus.IDLE);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [veoPrompt, setVeoPrompt] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);

  // Initialize Service
  useEffect(() => {
    if (process.env.API_KEY) {
        geminiServiceRef.current = new GeminiService(process.env.API_KEY);
    } else {
        console.warn("API Key not found in environment variables. AI features may not work.");
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAssets: Asset[] = (Array.from(e.target.files) as File[]).map((file) => ({
        id: crypto.randomUUID(),
        file,
        type: file.type.startsWith('image') ? 'image' : 'video',
        url: URL.createObjectURL(file),
      }));
      setAssets((prev) => [...prev, ...newAssets]);
    }
  };

  const handleRemoveAsset = (id: string) => {
      setAssets(prev => prev.filter(a => a.id !== id));
      if(selectedAssetId === id) setSelectedAssetId(null);
  };

  const handlePlayPause = () => {
    if (projectStatus === ProjectStatus.PLAYING) {
      setProjectStatus(ProjectStatus.IDLE);
    } else {
      setProjectStatus(ProjectStatus.PLAYING);
    }
  };

  const handlePlaybackComplete = () => {
      setProjectStatus(ProjectStatus.IDLE);
  };

  const handleFilterChange = (key: keyof FilterSettings, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // AI Feature: Auto Name Project
  const generateAutoName = async () => {
      if (!geminiServiceRef.current) {
          alert("AI Service not initialized. Missing API Key.");
          return;
      }
      if (assets.length === 0) return;
      
      setIsAiProcessing(true);
      setAiMessage("Analyzing visuals...");
      
      try {
        const title = await geminiServiceRef.current.generateTitle(assets.map(a => a.file));
        setProjectName(title.replace(/"/g, ''));
      } catch (error) {
        console.error(error);
        alert("Failed to generate title.");
      }
      
      setIsAiProcessing(false);
      setAiMessage("");
  };

  // AI Feature: Smart Filters
  const applySmartFilters = async () => {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (!geminiServiceRef.current || !asset) {
          alert(geminiServiceRef.current ? "Please select an image asset first." : "AI Service not initialized.");
          return;
      }
      
      setIsAiProcessing(true);
      setAiMessage("Calculating optimal aesthetics...");
      
      try {
        const jsonStr = await geminiServiceRef.current.suggestFilters(asset.file);
        // Sanitize json string if markdown blocks exist
        const cleanJson = jsonStr.replace(/```json|```/g, '').trim();
        const suggestions = JSON.parse(cleanJson);
        setFilters(prev => ({
            ...prev,
            ...suggestions
        }));
      } catch (e) {
          console.error("Failed to parse AI suggestions", e);
      }
      
      setIsAiProcessing(false);
      setAiMessage("");
  };

  // AI Feature: Veo Generation (Animate Image)
  const generateVeoClip = async () => {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (!geminiServiceRef.current || !asset || asset.type !== 'image') {
          alert(geminiServiceRef.current ? "Select an image to animate." : "AI Service not initialized.");
          return;
      }
      
      setIsAiProcessing(true);
      setAiMessage("Dreaming up motion (this may take a minute)...");
      
      try {
          const videoUrl = await geminiServiceRef.current.animateImage(asset.file, "Cinematic slow motion pan, 4k detail");
          if (videoUrl) {
              const newAsset: Asset = {
                  id: crypto.randomUUID(),
                  file: new File([], "ai_gen.mp4", { type: 'video/mp4'}), // Placeholder file obj
                  type: 'video',
                  url: videoUrl
              };
              setAssets(prev => [...prev, newAsset]);
          }
      } catch (e) {
          alert("Video generation failed or timed out.");
      }
      
      setIsAiProcessing(false);
      setAiMessage("");
  };

  // AI Feature: Veo Generation (Text to Video)
  const handleGenerateVeoText = async () => {
      if (!geminiServiceRef.current) {
          alert("AI Service not initialized.");
          return;
      }
      if (!veoPrompt) return;
      
      setIsAiProcessing(true);
      setAiMessage("Directing your scene (this may take a minute)...");
      try {
           const videoUrl = await geminiServiceRef.current.generateVideoFromText(veoPrompt);
           if (videoUrl) {
                const newAsset: Asset = {
                    id: crypto.randomUUID(),
                    file: new File([], "ai_scene.mp4", { type: 'video/mp4'}),
                    type: 'video',
                    url: videoUrl
                };
                setAssets(prev => [...prev, newAsset]);
                setVeoPrompt("");
           }
      } catch(e) {
          alert("Generation failed.");
          console.error(e);
      }
      setIsAiProcessing(false);
      setAiMessage("");
  };

  const handleDownloadVideo = () => {
    if (!canvasRef.current) return;
    
    const stream = canvasRef.current.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
       if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}.webm`;
        a.click();
        
        // Mock Drive Upload
        if (confirm("Download started. Save copy to Google Drive?")) {
            setTimeout(() => alert("Saved to Drive (Simulated)"), 1000);
        }
    };

    mediaRecorder.start();
    setProjectStatus(ProjectStatus.RECORDING);
    
    // Record for 5 seconds as a demo
    setTimeout(() => {
        mediaRecorder.stop();
        setProjectStatus(ProjectStatus.IDLE);
    }, 5000);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                <i className="fa-solid fa-video text-white text-xs"></i>
            </div>
            {isAiProcessing && aiMessage === "Analyzing visuals..." ? (
                 <span className="text-fuchsia-400 animate-pulse text-xl font-bold">Generating Name...</span>
            ) : (
                <input 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b border-cyan-500 w-64"
                />
            )}
            <button 
                onClick={generateAutoName}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-cyan-400 border border-slate-700"
                title="AI Auto-Name"
            >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={handleDownloadVideo}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-[0_0_15px_rgba(8,145,178,0.4)]"
            >
                {projectStatus === ProjectStatus.RECORDING ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Rendering...</>
                ) : (
                    <><i className="fa-solid fa-download"></i> Export Video</>
                )}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Assets */}
        <aside className="w-72 flex-shrink-0 z-10">
          <AssetList 
            assets={assets} 
            onUpload={handleUpload} 
            onSelect={asset => setSelectedAssetId(asset.id)}
            selectedAssetId={selectedAssetId}
            onRemove={handleRemoveAsset}
          />
        </aside>

        {/* Center: Stage & Toolbar */}
        <main className="flex-1 flex flex-col relative bg-slate-950">
           {/* Preview Area */}
           <div className="flex-1 p-8 flex items-center justify-center relative">
               <div className="relative w-full max-w-4xl aspect-video shadow-2xl shadow-black rounded-lg border border-slate-800 bg-black">
                   <Stage 
                     canvasRef={canvasRef}
                     assets={assets}
                     filterSettings={filters}
                     isPlaying={projectStatus === ProjectStatus.PLAYING}
                     onPlayPause={handlePlayPause}
                     audioTrack={currentTrack}
                     audioEnhanced={isAutoEnhanceAudio}
                     onPlaybackComplete={handlePlaybackComplete}
                   />
                   
                   {/* AI Overlay Loader */}
                   {isAiProcessing && (
                       <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                           <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                           <p className="text-fuchsia-400 font-mono text-lg animate-pulse">{aiMessage}</p>
                       </div>
                   )}
               </div>
           </div>

           {/* Editor Toolbar */}
           <div className="h-64 bg-slate-900 border-t border-slate-800 flex">
                {/* Filters Panel */}
                <div className="w-1/3 p-4 border-r border-slate-800 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-300">Visual Effects</h3>
                        <button 
                            onClick={applySmartFilters}
                            disabled={!selectedAssetId}
                            className={`text-xs px-2 py-1 rounded border transition-all ${selectedAssetId ? 'border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10' : 'border-slate-700 text-slate-600 cursor-not-allowed'}`}
                        >
                            <i className="fa-solid fa-robot mr-1"></i> AI Suggest
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {(Object.keys(filters) as Array<keyof FilterSettings>).map(key => (
                            <div key={key}>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span className="capitalize">{key}</span>
                                    <span>{filters[key]}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min={key === 'blur' ? 0 : 0} 
                                    max={key === 'blur' ? 20 : 200} 
                                    value={filters[key]}
                                    onChange={(e) => handleFilterChange(key, Number(e.target.value))}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-800">
                         <h3 className="font-bold text-slate-300 mb-2">Veo Generation</h3>
                         
                         {/* Text to Video */}
                         <div className="mb-4">
                             <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Text to Video</label>
                             <div className="flex gap-2">
                                 <input 
                                     type="text" 
                                     value={veoPrompt}
                                     onChange={(e) => setVeoPrompt(e.target.value)}
                                     placeholder="Describe a scene..."
                                     className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-fuchsia-500 outline-none placeholder:text-slate-600"
                                 />
                                 <button 
                                     onClick={handleGenerateVeoText}
                                     disabled={!veoPrompt || isAiProcessing}
                                     className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-slate-700 text-white px-3 py-1 rounded text-xs transition-colors"
                                     title="Generate Video"
                                 >
                                     <i className="fa-solid fa-wand-magic"></i>
                                 </button>
                             </div>
                         </div>

                         {/* Image to Video */}
                         <div className="mt-2">
                             <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Image to Video</label>
                             <button
                                onClick={generateVeoClip}
                                disabled={!selectedAssetId || isAiProcessing} 
                                className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${selectedAssetId ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                             >
                                <i className="fa-solid fa-film"></i> Animate Selected
                             </button>
                         </div>
                         <p className="text-[10px] text-slate-500 mt-2 text-center">Powered by Veo. Generates 5s clip.</p>
                    </div>
                </div>

                {/* Music Panel */}
                <div className="flex-1 p-4">
                    <MusicPanel 
                        currentTrack={currentTrack}
                        onSelectTrack={setCurrentTrack}
                        isAutoEnhance={isAutoEnhanceAudio}
                        onToggleEnhance={() => setIsAutoEnhanceAudio(!isAutoEnhanceAudio)}
                    />
                </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;