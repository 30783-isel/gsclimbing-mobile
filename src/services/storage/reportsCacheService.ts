// src/services/storage/reportsCacheService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';

const CACHE_KEYS = {
  REPORTS: '@cache:reports',
  REPORT_PHOTOS: '@cache:report_photos',
  LAST_FETCH: '@cache:last_fetch_reports',
};

interface CachedReport {
  reportId: number;
  turbineId: number;
  data: any;
  photos: any[];
  cachedAt: string;
}

class ReportsCacheService {
  /**
   * Cache de um relatório específico
   */
  async cacheReport(reportId: number, turbineId: number): Promise<void> {
    try {
      console.log('💾 Caching report:', reportId);
      
      // Buscar dados do relatório
      const reportData = await defectInspectionReportAPI.getById(reportId);
      
      // Buscar fotos do relatório
      const photos = await defectInspectionReportAPI.getPhotos(reportId);
      
      // Criar entrada no cache
      const cachedReport: CachedReport = {
        reportId,
        turbineId,
        data: reportData,
        photos,
        cachedAt: new Date().toISOString(),
      };
      
      // Guardar no AsyncStorage
      const key = `${CACHE_KEYS.REPORTS}_${reportId}`;
      await AsyncStorage.setItem(key, JSON.stringify(cachedReport));
      
      console.log('✅ Report cached successfully:', reportId);
    } catch (error) {
      console.error('❌ Error caching report:', error);
      throw error;
    }
  }

  /**
   * Cache de todos os relatórios de uma turbina
   */
  async cacheReportsByTurbine(turbineId: number): Promise<void> {
    try {
      console.log('💾 Caching reports for turbine:', turbineId);
      
      // Buscar lista de relatórios
      const reports = await defectInspectionReportAPI.getByTurbineId(turbineId);
      
      console.log(`📊 Found ${reports.length} reports for turbine ${turbineId}`);
      
      // Cache cada relatório individualmente
      for (const report of reports) {
        if (report.reportId) {
          await this.cacheReport(report.reportId, turbineId);
        }
      }
      
      // Guardar lista de IDs dos relatórios da turbina
      const key = `${CACHE_KEYS.REPORTS}_turbine_${turbineId}`;
      await AsyncStorage.setItem(
        key,
        JSON.stringify(reports.map(r => r.reportId))
      );
      
      console.log('✅ All reports cached for turbine:', turbineId);
    } catch (error) {
      console.error('❌ Error caching turbine reports:', error);
      throw error;
    }
  }

  /**
   * Obter relatório do cache
   */
  async getReport(reportId: number, forceRefresh = false): Promise<CachedReport | null> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_${reportId}`;
      
      // Se forçar refresh e estiver online, buscar da API
      if (forceRefresh) {
        const reportData = await defectInspectionReportAPI.getById(reportId);
        const photos = await defectInspectionReportAPI.getPhotos(reportId);
        
        const cachedReport: CachedReport = {
          reportId,
          turbineId: reportData.turbinaId,
          data: reportData,
          photos,
          cachedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(key, JSON.stringify(cachedReport));
        return cachedReport;
      }
      
      // Tentar obter do cache
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        console.log('✅ Report found in cache:', reportId);
        return JSON.parse(cached);
      }
      
      console.log('⚠️ Report not in cache:', reportId);
      return null;
    } catch (error) {
      console.error('❌ Error getting cached report:', error);
      return null;
    }
  }

  /**
   * Obter lista de relatórios de uma turbina do cache
   */
  async getReportsByTurbine(turbineId: number, forceRefresh = false): Promise<number[]> {
    try {
      const key = `${CACHE_KEYS.REPORTS}_turbine_${turbineId}`;
      
      if (forceRefresh) {
        await this.cacheReportsByTurbine(turbineId);
      }
      
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error getting cached reports:', error);
      return [];
    }
  }

  /**
   * Verificar se relatório existe no cache
   */
  async hasReport(reportId: number): Promise<boolean> {
    const key = `${CACHE_KEYS.REPORTS}_${reportId}`;
    const cached = await AsyncStorage.getItem(key);
    return cached !== null;
  }

  /**
   * Limpar cache de relatórios
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const reportKeys = keys.filter(k => k.startsWith(CACHE_KEYS.REPORTS));
      await AsyncStorage.multiRemove(reportKeys);
      console.log('🧹 Reports cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Remover relatório específico do cache
   */
  async removeReport(reportId: number): Promise<void> {
    const key = `${CACHE_KEYS.REPORTS}_${reportId}`;
    await AsyncStorage.removeItem(key);
    console.log('🗑️ Report removed from cache:', reportId);
  }
}

export const reportsCacheService = new ReportsCacheService();