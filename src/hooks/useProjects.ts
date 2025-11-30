import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { projectsAPI } from '@/services/api/projects.api';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';
import type { CreateProjectDTO, UpdateProjectDTO, ProjectFilters } from '@/types/project.types';

export const useProjects = () => {
  const { user, role } = useAuthStore();
  const {
    projects,
    selectedProject,
    turbines,
    isLoading,
    error,
    setProjects,
    setSelectedProject,
    setTurbines,
    addProject,
    updateProject,
    removeProject,
    setLoading,
    setError,
    clearError,
  } = useProjectStore();

  const [refreshing, setRefreshing] = useState(false);

  /**
   * Carregar todos os projetos
   */
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      let data;
      if (role === 'ADMIN') {
        data = await projectsAPI.getAll();
      } else if (user?.idUser) {
        data = await projectsAPI.getByUserId(user.idUser);
      } else {
        throw new Error('User not found');
      }

      setProjects(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar projetos';
      setError(message);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  }, [role, user, setProjects, setLoading, setError, clearError]);

  /**
   * Refresh (pull-to-refresh)
   */
  const refreshProjects = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  /**
   * Carregar projeto por ID
   */
  const loadProjectById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const data = await projectsAPI.getById(id);
      setSelectedProject(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar projeto';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSelectedProject, setLoading]);

  /**
   * Criar novo projeto
   */
  const createProject = useCallback(async (projectData: CreateProjectDTO) => {
    try {
      setLoading(true);
      const newProject = await projectsAPI.create(projectData);
      addProject(newProject);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Projeto criado com sucesso',
      });
      
      return newProject;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar projeto';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addProject, setLoading]);

  /**
   * Atualizar projeto
   */
  const editProject = useCallback(async (id: string, updates: UpdateProjectDTO) => {
    try {
      setLoading(true);
      const updated = await projectsAPI.update(id, updates);
      updateProject(id, updated);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Projeto atualizado com sucesso',
      });
      
      return updated;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao atualizar projeto';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateProject, setLoading]);

  /**
   * Eliminar projeto
   */
  const deleteProject = useCallback(async (name: string, id: string) => {
    try {
      setLoading(true);
      await projectsAPI.delete(name);
      removeProject(id);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Projeto eliminado com sucesso',
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao eliminar projeto';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeProject, setLoading]);

  /**
   * Filtrar projetos
   */
  const filterProjects = useCallback(async (filters: ProjectFilters) => {
    try {
      setLoading(true);
      const data = await projectsAPI.filter(filters);
      setProjects(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao filtrar projetos';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading]);

  /**
   * Carregar turbinas de um projeto
   */
  const loadTurbines = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const data = await projectsAPI.getTurbines(projectId);
      setTurbines(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar turbinas';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTurbines, setLoading]);

  return {
    // State
    projects,
    selectedProject,
    turbines,
    isLoading,
    error,
    refreshing,

    // Actions
    loadProjects,
    refreshProjects,
    loadProjectById,
    createProject,
    editProject,
    deleteProject,
    filterProjects,
    loadTurbines,
    setSelectedProject,
  };
};