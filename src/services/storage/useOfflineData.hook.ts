// src/hooks/useOfflineData.hook.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { dataCacheService } from '@/services/storage/dataCache.service';
import { useAuth } from '@/hooks/useAuth';

export function useOfflineProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Monitorar conexão
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user?.idUser) return;
    
    setLoading(true);
    try {
      // Tentar carregar - usa cache se offline
      const data = await dataCacheService.getProjects(user.idUser, isOnline);
      setProjects(data);
    } catch (error) {
      console.error('❌ Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!user?.idUser) return;
    await dataCacheService.cacheProjects(user.idUser);
    await loadProjects();
  };

  return {
    projects,
    isOnline,
    loading,
    refresh,
  };
}

export function useOfflineTurbines(projectId: number) {
  const [turbines, setTurbines] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (projectId) {
      loadTurbines();
    }
  }, [projectId]);

  const loadTurbines = async () => {
    setLoading(true);
    try {
      const data = await dataCacheService.getTurbines(projectId, isOnline);
      setTurbines(data);
    } catch (error) {
      console.error('❌ Erro ao carregar turbinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await dataCacheService.cacheTurbines(projectId);
    await loadTurbines();
  };

  return {
    turbines,
    isOnline,
    loading,
    refresh,
  };
}