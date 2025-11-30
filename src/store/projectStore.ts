import { create } from 'zustand';
import type { Project } from '@/types/project.types';
import type { Turbine } from '@/types/turbine.types';

interface ProjectState {
  // State
  projects: Project[];
  selectedProject: Project | null;
  turbines: Turbine[];
  selectedTurbine: Turbine | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Projects
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  // Actions - Turbines
  setTurbines: (turbines: Turbine[]) => void;
  setSelectedTurbine: (turbine: Turbine | null) => void;
  addTurbine: (turbine: Turbine) => void;
  updateTurbine: (id: string, updates: Partial<Turbine>) => void;
  removeTurbine: (id: string) => void;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  selectedProject: null,
  turbines: [],
  selectedTurbine: null,
  isLoading: false,
  error: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  // Projects
  setProjects: (projects) => set({ projects, error: null }),
  
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
      error: null,
    })),
  
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.idProject === id ? { ...p, ...updates } : p
      ),
      selectedProject:
        state.selectedProject?.idProject === id
          ? { ...state.selectedProject, ...updates }
          : state.selectedProject,
      error: null,
    })),
  
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.idProject !== id),
      selectedProject:
        state.selectedProject?.idProject === id ? null : state.selectedProject,
      error: null,
    })),

  // Turbines
  setTurbines: (turbines) => set({ turbines, error: null }),
  
  setSelectedTurbine: (selectedTurbine) => set({ selectedTurbine }),
  
  addTurbine: (turbine) =>
    set((state) => ({
      turbines: [...state.turbines, turbine],
      error: null,
    })),
  
  updateTurbine: (id, updates) =>
    set((state) => ({
      turbines: state.turbines.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
      selectedTurbine:
        state.selectedTurbine?.id === id
          ? { ...state.selectedTurbine, ...updates }
          : state.selectedTurbine,
      error: null,
    })),
  
  removeTurbine: (id) =>
    set((state) => ({
      turbines: state.turbines.filter((t) => t.id !== id),
      selectedTurbine:
        state.selectedTurbine?.id === id ? null : state.selectedTurbine,
      error: null,
    })),

  // UI
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));