export interface Asset {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface Track {
  id: string;
  name: string;
  url: string;
  duration?: number;
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sepia: number;
}

export enum ProjectStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  RECORDING = 'RECORDING',
  GENERATING_AI = 'GENERATING_AI',
}

export interface AIState {
  isThinking: boolean;
  suggestion: string | null;
}
