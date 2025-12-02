import React, { useState } from 'react';
import { Track } from '../types';
import { MOCK_MUSIC_LIBRARY } from '../constants';

interface MusicPanelProps {
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  isAutoEnhance: boolean;
  onToggleEnhance: () => void;
}

export const MusicPanel: React.FC<MusicPanelProps> = ({ currentTrack, onSelectTrack, isAutoEnhance, onToggleEnhance }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newTrack: Track = {
        id: `upload-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      };
      onSelectTrack(newTrack);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white"><i className="fa-solid fa-music mr-2 text-fuchsia-400"></i>Audio Track</h3>
        <button 
            onClick={onToggleEnhance}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${isAutoEnhance ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_10px_rgba(232,121,249,0.5)]' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
        >
            <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> AI Enhance
        </button>
      </div>

      <div className="flex space-x-2 mb-4 border-b border-slate-700">
        <button 
          className={`pb-2 text-sm font-medium ${activeTab === 'library' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('library')}
        >
          Free Library
        </button>
        <button 
          className={`pb-2 text-sm font-medium ${activeTab === 'upload' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'library' ? (
          <div className="space-y-2">
            {MOCK_MUSIC_LIBRARY.map((track) => (
              <div 
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${currentTrack?.id === track.id ? 'bg-slate-700 border border-fuchsia-500/50' : 'bg-slate-700/50 hover:bg-slate-700'}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${currentTrack?.id === track.id ? 'bg-fuchsia-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                    <i className={`fa-solid ${currentTrack?.id === track.id ? 'fa-volume-high' : 'fa-music'}`}></i>
                  </div>
                  <span className="text-sm font-medium text-slate-200">{track.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-500 hover:bg-slate-700/30 transition-all">
            <label className="cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-400 mb-2"></i>
                <span className="text-sm text-slate-400">Click to upload MP3</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>
      
      {currentTrack && (
        <div className="mt-4 pt-4 border-t border-slate-700">
           <div className="text-xs text-slate-400 mb-1">Now Playing:</div>
           <div className="text-sm text-cyan-400 font-medium truncate">{currentTrack.name}</div>
        </div>
      )}
    </div>
  );
};
