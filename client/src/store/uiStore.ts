import { create } from 'zustand';

interface UiState {
  theme: 'light' | 'dark';
  isSidePanelOpen: boolean;
  searchQuery: string;
  generationFilter: number | null;
  isAddPersonOpen: boolean;
  isAddRelationshipOpen: boolean;

  toggleTheme: () => void;
  setSidePanelOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setGenerationFilter: (gen: number | null) => void;
  setAddPersonOpen: (open: boolean) => void;
  setAddRelationshipOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  isSidePanelOpen: false,
  searchQuery: '',
  generationFilter: null,
  isAddPersonOpen: false,
  isAddRelationshipOpen: false,

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  setSidePanelOpen: (open) => set({ isSidePanelOpen: open }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setGenerationFilter: (generationFilter) => set({ generationFilter }),
  setAddPersonOpen: (isAddPersonOpen) => set({ isAddPersonOpen }),
  setAddRelationshipOpen: (isAddRelationshipOpen) => set({ isAddRelationshipOpen }),
}));
