// src/store/previewStore.ts
import { create } from 'zustand';

interface PreviewState {
  hasContent: boolean;
  pptUrl: string | null;
  wordUrl: string | null;
  gameUrl: string | null;
  generating: boolean;
  generateProgress: number;
  generateStatus: string;
  rightPanelCollapsed: boolean;
  setGenerating: (value: boolean) => void;
  setProgress: (progress: number, status: string) => void;
  setPreview: (ppt: string | null, word: string | null, game: string | null) => void;
  clearPreview: () => void;
  setRightPanelCollapsed: (value: boolean) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  hasContent: false,
  pptUrl: null,
  wordUrl: null,
  gameUrl: null,
  generating: false,
  generateProgress: 0,
  generateStatus: '',
  rightPanelCollapsed: false,
  setGenerating: (value) => set({ generating: value }),
  setProgress: (progress, status) => set({ generateProgress: progress, generateStatus: status }),
  setPreview: (ppt, word, game) => set({ 
    hasContent: true, 
    pptUrl: ppt, 
    wordUrl: word, 
    gameUrl: game,
    generating: false,
  }),
  clearPreview: () => set({ 
    hasContent: false, 
    pptUrl: null, 
    wordUrl: null, 
    gameUrl: null,
    generating: false,
    generateProgress: 0,
    generateStatus: '',
  }),
  setRightPanelCollapsed: (value) => set({ rightPanelCollapsed: value }),
}));