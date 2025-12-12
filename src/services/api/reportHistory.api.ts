// src/services/api/reportHistory.api.ts

import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type { HistoryEntry } from '@/types/history.types';

/**
 * API para Histórico de Relatórios
 */
export const reportHistoryAPI = {
  /**
   * Obter histórico completo de um relatório
   * @param reportId - ID do relatório
   * @returns Lista de entradas de histórico
   */
  getHistory: async (reportId: number): Promise<HistoryEntry[]> => {
    try {
      console.log(`📜 Fetching history for report ${reportId}...`);
      
      const response = await httpClient.get(
        `${API_CONFIG.baseMobileReportsUrl}defect-inspection/${reportId}/history`
      );

      console.log(`✅ Found ${response.data.length} history entries`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching history for report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * Contar número de alterações de um relatório
   * (pode ser útil para mostrar badge na lista)
   */
  countChanges: async (reportId: number): Promise<number> => {
    try {
      const history = await reportHistoryAPI.getHistory(reportId);
      // Contar apenas UPDATEs (ignorar CREATE, SUBMIT, etc)
      return history.filter(h => h.action === 'UPDATE').length;
    } catch (error) {
      console.error(`Error counting changes for report ${reportId}:`, error);
      return 0;
    }
  },
};
