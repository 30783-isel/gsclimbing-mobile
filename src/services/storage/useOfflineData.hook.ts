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

export function useOfflineReports(turbineId: number) {
  const [reports, setReports] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (turbineId) {
      loadReports();
    }
  }, [turbineId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // NOTA: Este hook agora apenas lê do cache
      // O componente que usa este hook deve fazer o cache usando a API específica
      const data = await dataCacheService.getReportsFromCache(turbineId);
      setReports(data);
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    // O refresh agora deve ser feito pelo componente usando a API específica
    // Este método apenas recarrega do cache
    await loadReports();
  };

  return {
    reports,
    isOnline,
    loading,
    refresh,
  };
}

export function useOfflineReport(reportId: number) {
  const [report, setReport] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    setLoading(true);
    setLoadedFromCache(false);
    
    try {
      // NOTA: Este hook agora apenas lê do cache
      // O componente que usa este hook deve fazer o cache usando a API específica
      const data = await dataCacheService.getReportFromCache(reportId);
      
      if (data) {
        setReport(data);
        setLoadedFromCache(true);
      } else if (!isOnline) {
        throw new Error('Relatório não disponível offline. Abra-o online primeiro.');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    // O refresh agora deve ser feito pelo componente usando a API específica
    // Este método apenas recarrega do cache
    await loadReport();
  };

  return {
    report,
    isOnline,
    loading,
    loadedFromCache,
    refresh,
  };
}