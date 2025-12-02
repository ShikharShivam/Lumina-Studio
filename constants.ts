import { FilterSettings, Track } from './types';

export const DEFAULT_FILTERS: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  sepia: 0,
};

export const MOCK_MUSIC_LIBRARY: Track[] = [
  { id: '1', name: 'Ambient Chill', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { id: '2', name: 'Upbeat Pop', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: '3', name: 'Cinematic Epic', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8c8a73467.mp3' },
];

export const VEO_MODEL = 'veo-3.1-fast-generate-preview';
export const GEMINI_MODEL = 'gemini-2.5-flash';
