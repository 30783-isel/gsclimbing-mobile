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
        idProject: project.idProject || Date.now().toString(),
        name: project.name || '',
        country: project.country || '',
        location: project.location || '',
        numberTurbines: project.numberTurbines || '',
        site: project.site || '',
        number: project.number || '',
        type: project.type || '',
        users: project.users,
        turbines: project.turbines,
      };

      const updated = project.idProject
        ? projects.map(p => p.idProject === project.idProject ? newProject : p)
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
      const updated = projects.filter(p => p.idProject !== id);
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