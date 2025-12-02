import React from 'react';
import { Asset } from '../types';

interface AssetListProps {
  assets: Asset[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (asset: Asset) => void;
  selectedAssetId: string | null;
  onRemove: (id: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({ assets, onUpload, onSelect, selectedAssetId, onRemove }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Assets</h2>
        <label className="flex items-center justify-center w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer transition-colors shadow-lg shadow-cyan-900/50">
          <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
          <span>Upload Media</span>
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
            onChange={onUpload} 
          />
        </label>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {assets.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <i className="fa-regular fa-images text-4xl mb-2"></i>
            <p>No assets uploaded.</p>
          </div>
        )}
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedAssetId === asset.id ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-transparent hover:border-slate-600'}`}
            onClick={() => onSelect(asset)}
          >
            {asset.type === 'image' ? (
              <img src={asset.url} alt="asset" className="w-full h-32 object-cover" />
            ) : (
              <video src={asset.url} className="w-full h-32 object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <i className="fa-solid fa-plus text-white text-2xl"></i>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(asset.id); }}
              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <i className="fa-solid fa-times"></i>
            </button>
            <div className="absolute bottom-1 left-2 text-xs text-white bg-black/50 px-1 rounded">
                {asset.type === 'image' ? <i className="fa-regular fa-image"></i> : <i className="fa-solid fa-video"></i>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
