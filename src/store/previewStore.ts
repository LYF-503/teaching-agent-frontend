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
  modifyInput: string;
  lastTopic: string;
  lastRequirements: string;
  lastGenerateType: 'lesson-plan' | 'ppt' | 'game' | null;
  lastGameType: 'quiz' | 'memory' | 'matching' | null;
  setGenerating: (value: boolean) => void;
  setProgress: (progress: number, status: string) => void;
  setPreview: (ppt: string | null, word: string | null, game: string | null) => void;
  clearPreview: () => void;
  setRightPanelCollapsed: (value: boolean) => void;
  setModifyInput: (input: string) => void;
  setLastGenerateParams: (topic: string, requirements: string, generateType: 'lesson-plan' | 'ppt' | 'game', gameType: 'quiz' | 'memory' | 'matching' | null) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  hasContent: false,
  pptUrl: null,
  wordUrl: null,
  gameUrl: null,
  generating: false,
  generateProgress: 0,
  generateStatus: '',
  rightPanelCollapsed: true,
  modifyInput: '',
  lastTopic: '',
  lastRequirements: '',
  lastGenerateType: null,
  lastGameType: null,
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
  setModifyInput: (input) => set({ modifyInput: input }),
  setLastGenerateParams: (topic, requirements, generateType, gameType) => set({ 
    lastTopic: topic, 
    lastRequirements: requirements, 
    lastGenerateType: generateType, 
    lastGameType: gameType 
  }),
}));