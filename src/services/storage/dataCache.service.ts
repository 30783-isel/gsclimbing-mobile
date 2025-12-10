// src/services/storage/dataCache.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { projectsAPI } from '../api/projects.api';
import { turbineAPI } from '../api/turbine.api';

const CACHE_KEYS = {
  PROJECTS: '@cache:projects',
  TURBINES: '@cache:turbines',
  REPORTS: '@cache:reports',
  LAST_FETCH: '@cache:last_fetch',
};

class DataCacheService {
  /**
   * Carregar e guardar projetos em cache
   */
  async cacheProjects(userId: string): Promise<void> {
    try {
      const projects = await projectsAPI.getByUserId(userId);
      await AsyncStorage.setItem(CACHE_KEYS.PROJECTS, JSON.stringify(projects));
      await this.setLastFetch('projects');
      console.log('✅ Projetos em cache:', projects.length);
    } catch (error) {
      console.error('❌ Erro ao fazer cache de projetos:', error);
    }
  }

  /**
   * Obter projetos (cache ou API)
   */
  async getProjects(userId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Se forçar refresh ou estiver online, tentar API
      if (forceRefresh) {
        await this.cacheProjects(userId);
      }
      
      // Retornar do cache
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PROJECTS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Erro ao obter projetos:', error);
      return [];
    }
  }

  /**
   * Cache de turbinas de um projeto
   */
  async cacheTurbines(projectId: number): Promise<void> {
    try {
      const turbines = await turbineAPI.getByProject(projectId);
      const key = `${CACHE_KEYS.TURBINES}_${projectId}`;
      await AsyncStorage.setItem(key, JSON.stringify(turbines));
      console.log('✅ Turbinas em cache:', turbines.length);
    } catch (error) {
      console.error('❌ Erro ao fazer cache de turbinas:', error);
    }
  }

  /**
   * Obter turbinas (cache ou API)
   */
  async getTurbines(projectId: number, forceRefresh = false): Promise<any[]> {
    try {
      const key = `${CACHE_KEYS.TURBINES}_${projectId}`;
      
      if (forceRefresh) {
        await this.cacheTurbines(projectId);
      }
      
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Erro ao obter turbinas:', error);
      return [];
    }
  }

  /**
   * Cache de relatórios genérico (para ser usado por tipos específicos de relatório)
   * Guarda dados já processados no cache
   */
  async cacheReportsData(turbineId: number, reports: any[]): Promise<void> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_${turbineId}`;
      await AsyncStorage.setItem(key, JSON.stringify(reports));
      await this.setLastFetch(`reports_${turbineId}`);
      console.log('✅ Relatórios em cache:', reports.length);
    } catch (error) {
      console.error('❌ Erro ao fazer cache de relatórios:', error);
    }
  }

  /**
   * Obter relatórios do cache
   */
  async getReportsFromCache(turbineId: number): Promise<any[]> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_${turbineId}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Erro ao obter relatórios:', error);
      return [];
    }
  }

  /**
   * Cache de um relatório específico (para detalhes)
   */
  async cacheReportData(reportId: number, report: any): Promise<void> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_detail_${reportId}`;
      await AsyncStorage.setItem(key, JSON.stringify(report));
      console.log('✅ Relatório em cache:', reportId);
    } catch (error) {
      console.error('❌ Erro ao fazer cache de relatório:', error);
    }
  }

  /**
   * Obter relatório específico do cache
   */
  async getReportFromCache(reportId: number): Promise<any | null> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_detail_${reportId}`;
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('❌ Erro ao obter relatório:', error);
      return null;
    }
  }

  /**
   * Limpar cache (útil no logout)
   */
  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('@cache:'));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('🧹 Cache limpo');
  }

  private async setLastFetch(type: string): Promise<void> {
    const key = `${CACHE_KEYS.LAST_FETCH}_${type}`;
    await AsyncStorage.setItem(key, new Date().toISOString());
  }
}

export const dataCacheService = new DataCacheService();