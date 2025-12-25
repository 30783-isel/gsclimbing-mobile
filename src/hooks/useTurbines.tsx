import { useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { projectsAPI } from '@/services/api/projects.api';
import Toast from 'react-native-toast-message';

export const useTurbines = () => {
  const {
    turbines,
    selectedTurbine,
    isLoading,
    setTurbines,
    setSelectedTurbine,
    addTurbine,
    updateTurbine,
    removeTurbine,
    setLoading,
  } = useProjectStore();

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

  /**
   * Carregar turbina por ID
   */
  const loadTurbineById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await projectsAPI.getTurbineById(id);
      setSelectedTurbine(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar turbina';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSelectedTurbine, setLoading]);

  /**
   * Adicionar nova turbina
   */
  const createTurbine = useCallback(async (projectName: string) => {
    try {
      setLoading(true);
      const newTurbine = await projectsAPI.addTurbine(projectName);
      addTurbine(newTurbine);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Turbina criada com sucesso',
      });
      
      return newTurbine;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar turbina';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addTurbine, setLoading]);

  /**
   * Atualizar turbina
   */
  const editTurbine = useCallback(async (turbineData: FormData) => {
    try {
      setLoading(true);
      const updated = await projectsAPI.updateTurbine(turbineData);
      
      // Extrair ID do FormData se possível
      const id = updated.id;
      if (id) {
        updateTurbine(id, updated);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Turbina atualizada com sucesso',
      });
      
      return updated;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao atualizar turbina';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateTurbine, setLoading]);

  /**
   * Eliminar turbina
   */
  const deleteTurbine = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await projectsAPI.deleteTurbine(id);
      removeTurbine(id);
      
      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Turbina eliminada com sucesso',
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao eliminar turbina';
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeTurbine, setLoading]);

  return {
    // State
    turbines,
    selectedTurbine,
    isLoading,

    // Actions
    loadTurbines,
    loadTurbineById,
    createTurbine,
    editTurbine,
    deleteTurbine,
    setSelectedTurbine,
  };
};