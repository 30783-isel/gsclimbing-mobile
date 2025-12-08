// src/hooks/useOfflineProjects.hook.ts
import { useState, useEffect } from 'react';
import { Project } from '@/types/project.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@projects_offline';

export const useOfflineProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setProjects(JSON.parse(data));
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (project: Partial<Project>) => {
    try {
      const newProject: Project = {
        id: project.id || Date.now().toString(),
        name: project.name || '',
        client: project.client || '',
        status: project.status || 'active',
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = project.id
        ? projects.map(p => p.id === project.id ? newProject : p)
        : [...projects, newProject];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setProjects(updated);
    } catch (error) {
      console.error('Erro ao guardar projeto:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const updated = projects.filter(p => p.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setProjects(updated);
    } catch (error) {
      console.error('Erro ao eliminar projeto:', error);
      throw error;
    }
  };

  return {
    projects,
    loading,
    saveProject,
    deleteProject,
    refresh: loadProjects,
  };
};