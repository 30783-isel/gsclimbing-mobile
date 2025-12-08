// src/hooks/useOfflineReports.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { reportsCacheService } from '@/services/storage/reportsCacheService';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';

export function useOfflineReports(turbineId: number) {
  const [reports, setReports] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      
      if (online) {
        console.log('🌐 Online detectado - a sincronizar relatórios...');
        loadReports(true); // Force refresh quando ficar online
      }
    });

    return unsubscribe;
  }, []);

  // Carregar relatórios ao montar
  useEffect(() => {
    if (turbineId) {
      loadReports();
    }
  }, [turbineId]);

  const loadReports = async (forceRefresh = false) => {
    if (!turbineId) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isOnline || forceRefresh) {
        console.log('🌐 A carregar relatórios da API...');
        
        // Tentar carregar da API
        const apiReports = await defectInspectionReportAPI.getByTurbineId(turbineId);
        
        // Fazer cache dos relatórios
        await reportsCacheService.cacheReportsByTurbine(turbineId);
        
        setReports(apiReports);
        console.log(`✅ ${apiReports.length} relatórios carregados da API`);
      } else {
        console.log('📵 Offline - a carregar do cache...');
        
        // Carregar IDs dos relatórios do cache
        const reportIds = await reportsCacheService.getReportsByTurbine(turbineId);
        
        // Carregar dados de cada relatório
        const cachedReports = [];
        for (const reportId of reportIds) {
          const cached = await reportsCacheService.getReport(reportId);
          if (cached) {
            cachedReports.push(cached.data);
          }
        }
        
        setReports(cachedReports);
        console.log(`✅ ${cachedReports.length} relatórios carregados do cache`);
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar relatórios:', err);
      
      // Em caso de erro, tentar cache
      if (!isOnline) {
        try {
          const reportIds = await reportsCacheService.getReportsByTurbine(turbineId);
          const cachedReports = [];
          
          for (const reportId of reportIds) {
            const cached = await reportsCacheService.getReport(reportId);
            if (cached) {
              cachedReports.push(cached.data);
            }
          }
          
          setReports(cachedReports);
          console.log(`✅ ${cachedReports.length} relatórios carregados do cache (fallback)`);
        } catch (cacheErr) {
          setError('Não foi possível carregar os relatórios');
        }
      } else {
        setError(err.message || 'Erro ao carregar relatórios');
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadReports(true);
  };

  return {
    reports,
    isOnline,
    loading,
    error,
    refresh,
  };
}

export function useOfflineReport(reportId: number) {
  const [report, setReport] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitorar conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  // Carregar relatório
  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, isOnline]);

  const loadReport = async () => {
    if (!reportId) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        console.log('🌐 A carregar relatório da API:', reportId);
        
        // Carregar da API
        const reportData = await defectInspectionReportAPI.getById(reportId);
        const reportPhotos = await defectInspectionReportAPI.getPhotos(reportId);
        
        // Fazer cache
        await reportsCacheService.cacheReport(reportId, reportData.turbinaId);
        
        setReport(reportData);
        setPhotos(reportPhotos);
        console.log('✅ Relatório carregado da API');
      } else {
        console.log('📵 Offline - a carregar do cache:', reportId);
        
        // Carregar do cache
        const cached = await reportsCacheService.getReport(reportId);
        
        if (cached) {
          setReport(cached.data);
          setPhotos(cached.photos);
          console.log('✅ Relatório carregado do cache');
        } else {
          throw new Error('Relatório não disponível offline');
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar relatório:', err);
      
      // Tentar cache como fallback
      if (!isOnline) {
        const cached = await reportsCacheService.getReport(reportId);
        if (cached) {
          setReport(cached.data);
          setPhotos(cached.photos);
          return;
        }
      }
      
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadReport();
  };

  return {
    report,
    photos,
    isOnline,
    loading,
    error,
    refresh,
  };
}