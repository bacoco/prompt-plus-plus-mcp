import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Strategy, Collection, RefinementResult } from '../services/api';

interface AppState {
  // Strategies
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  strategiesLoading: boolean;
  strategiesError: string | null;
  
  // Collections
  collections: Collection[];
  selectedCollection: Collection | null;
  
  // Refinement
  currentPrompt: string;
  refinementHistory: RefinementResult[];
  isRefining: boolean;
  
  // UI State
  sidebarOpen: boolean;
  activeView: 'refiner' | 'dashboard' | 'explorer' | 'testing' | 'creator' | 'collections' | 'performance';
  
  // Actions
  setStrategies: (strategies: Strategy[]) => void;
  setSelectedStrategy: (strategy: Strategy | null) => void;
  setStrategiesLoading: (loading: boolean) => void;
  setStrategiesError: (error: string | null) => void;
  
  setCollections: (collections: Collection[]) => void;
  setSelectedCollection: (collection: Collection | null) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  
  setCurrentPrompt: (prompt: string) => void;
  addRefinementResult: (result: RefinementResult) => void;
  clearRefinementHistory: () => void;
  setIsRefining: (refining: boolean) => void;
  
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveView: (view: AppState['activeView']) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        strategies: [],
        selectedStrategy: null,
        strategiesLoading: false,
        strategiesError: null,
        
        collections: [],
        selectedCollection: null,
        
        currentPrompt: '',
        refinementHistory: [],
        isRefining: false,
        
        sidebarOpen: true,
        activeView: 'refiner',
        
        // Actions
        setStrategies: (strategies) => set({ strategies }),
        setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),
        setStrategiesLoading: (loading) => set({ strategiesLoading: loading }),
        setStrategiesError: (error) => set({ strategiesError: error }),
        
        setCollections: (collections) => set({ collections }),
        setSelectedCollection: (collection) => set({ selectedCollection: collection }),
        addCollection: (collection) => set((state) => ({ 
          collections: [...state.collections, collection] 
        })),
        updateCollection: (id, updates) => set((state) => ({
          collections: state.collections.map(c => 
            c.id === id ? { ...c, ...updates } : c
          )
        })),
        removeCollection: (id) => set((state) => ({
          collections: state.collections.filter(c => c.id !== id)
        })),
        
        setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
        addRefinementResult: (result) => set((state) => ({
          refinementHistory: [...state.refinementHistory, result]
        })),
        clearRefinementHistory: () => set({ refinementHistory: [] }),
        setIsRefining: (refining) => set({ isRefining: refining }),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setActiveView: (view) => set({ activeView: view }),
      }),
      {
        name: 'prompt-plus-ui-storage',
        partialize: (state) => ({
          collections: state.collections,
          refinementHistory: state.refinementHistory.slice(-10), // Keep last 10
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
);