/**
 * Offline Performance Repair Elevator Reports Storage Service
 * Gere armazenamento local de relatórios Performance criados offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

// ========== TIPOS ==========

export interface OfflinePerformanceReport {
    tempId: string;
    projectId: number;
    turbineId: number;
    reportType: number;
    data: {
        site: string;
        wtgNumber: string;
        wtgType: string;
        yearConstruction: string;
        // ✅ ADICIONAR ESTES CAMPOS:
        inpectorsWorkers?: string;        // ← FALTAVA
        workCompleted?: 'Yes' | 'No';     // ← FALTAVA
        turbineOperable?: 'Yes' | 'No';   // ← FALTAVA (nota: turbineOperable, não windturbineOperable)
        performanceReport?: string;        // ← FALTAVA
        additionalFields?: Record<string, { label: string; value: string }>; // ← FALTAVA
    };
    photos: OfflinePerformancePhoto[];
    status: 'editing' | 'pending_sync' | 'syncing' | 'sync_error';
    createdAt: string;
    lastModified: string;
    syncAttempts: number;
    syncError?: string;
}

export interface OfflinePerformancePhoto {
  tempId: string;
  uri: string;
  base64Data?: string;
  filename: string;
  mimeType: string;
  size?: number;
  description?: string;
}

// ========== CONSTANTES ==========

const STORAGE_KEYS = {
  OFFLINE_PERFORMANCE_REPORTS: '@gsclimbing:offline_performance_reports',
  LAST_SYNC: '@gsclimbing:performance_last_sync',
};

// ========== SERVICE ==========

class OfflinePerformanceReportsService {
  /**
   * Criar novo relatório Performance offline
   */
  async create(
    report: Omit<OfflinePerformanceReport, 'tempId' | 'status' | 'createdAt' | 'lastModified' | 'syncAttempts'>
  ): Promise<OfflinePerformanceReport> {
    const tempId = uuid.v4();
    const now = new Date().toISOString();

    const newReport: OfflinePerformanceReport = {
      ...report,
      tempId,
      status: 'editing',
      createdAt: now,
      lastModified: now,
      syncAttempts: 0,
    };

    const reports = await this.getAll();
    reports.push(newReport);
    await this._saveAll(reports);

    console.log('📝 Performance report offline criado:', tempId);
    return newReport;
  }

  /**
   * Atualizar relatório offline existente
   */
  async update(
    tempId: string,
    updates: Partial<OfflinePerformanceReport>
  ): Promise<OfflinePerformanceReport | null> {
    const reports = await this.getAll();
    const index = reports.findIndex(r => r.tempId === tempId);

    if (index === -1) {
      console.warn('⚠️ Performance report não encontrado:', tempId);
      return null;
    }

    const updated: OfflinePerformanceReport = {
      ...reports[index],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    reports[index] = updated;
    await this._saveAll(reports);

    console.log('✏️ Performance report offline atualizado:', tempId);
    return updated;
  }

  /**
   * Obter relatório por ID temporário
   */
  async getById(tempId: string): Promise<OfflinePerformanceReport | null> {
    const reports = await this.getAll();
    return reports.find(r => r.tempId === tempId) || null;
  }

  /**
   * Obter todos os relatórios offline
   */
  async getAll(): Promise<OfflinePerformanceReport[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERFORMANCE_REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar performance reports offline:', error);
      return [];
    }
  }

  /**
   * Obter relatórios por turbina
   */
  async getByTurbine(turbineId: number): Promise<OfflinePerformanceReport[]> {
    const all = await this.getAll();
    return all.filter(r => r.turbineId === turbineId);
  }

  /**
   * Obter relatórios pendentes de sincronização
   */
  async getPendingSync(): Promise<OfflinePerformanceReport[]> {
    const all = await this.getAll();
    return all.filter(r => r.status === 'pending_sync' || r.status === 'sync_error');
  }

  /**
   * Obter relatórios em edição
   */
  async getEditing(): Promise<OfflinePerformanceReport[]> {
    const all = await this.getAll();
    return all.filter(r => r.status === 'editing');
  }

  /**
   * Marcar relatório para sincronização
   */
  async markForSync(tempId: string): Promise<boolean> {
    const report = await this.getById(tempId);
    if (!report) {
      console.warn('⚠️ Report não encontrado:', tempId);
      return false;
    }

    await this.update(tempId, { status: 'pending_sync' });
    console.log('📤 Performance report marcado para sync:', tempId);
    return true;
  }

  /**
   * Marcar relatório como sincronizando
   */
  async markSyncing(tempId: string): Promise<void> {
    await this.update(tempId, { status: 'syncing' });
  }

  /**
   * Marcar relatório com erro de sincronização
   */
  async markSyncError(tempId: string, error: string): Promise<void> {
    const report = await this.getById(tempId);
    if (!report) return;

    await this.update(tempId, {
      status: 'sync_error',
      syncError: error,
      syncAttempts: (report.syncAttempts || 0) + 1,
    });
  }

  /**
   * Remover relatório após sincronização bem-sucedida
   */
  async delete(tempId: string): Promise<boolean> {
    const reports = await this.getAll();
    const filtered = reports.filter(r => r.tempId !== tempId);

    if (filtered.length === reports.length) {
      console.warn('⚠️ Report não encontrado para deletar:', tempId);
      return false;
    }

    await this._saveAll(filtered);
    console.log('🗑️ Performance report offline removido:', tempId);
    return true;
  }

  /**
   * Limpar relatórios sincronizados
   */
  async cleanSynced(): Promise<number> {
    const reports = await this.getAll();
    const unsyncedReports = reports.filter(
      r => r.status !== 'editing' && r.status !== 'pending_sync' && r.status !== 'sync_error'
    );

    const removedCount = reports.length - unsyncedReports.length;
    await this._saveAll(unsyncedReports);

    console.log(`🧹 ${removedCount} performance reports sincronizados removidos`);
    return removedCount;
  }

  /**
   * Obter contadores
   */
  async getCounts(): Promise<{
    total: number;
    editing: number;
    pendingSync: number;
    syncError: number;
  }> {
    const reports = await this.getAll();

    return {
      total: reports.length,
      editing: reports.filter(r => r.status === 'editing').length,
      pendingSync: reports.filter(r => r.status === 'pending_sync').length,
      syncError: reports.filter(r => r.status === 'sync_error').length,
    };
  }

  /**
   * Guardar timestamp da última sincronização
   */
  async setLastSync(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Obter timestamp da última sincronização
   */
  async getLastSync(): Promise<Date | null> {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Método privado para guardar todos os relatórios
   */
  private async _saveAll(reports: OfflinePerformanceReport[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_PERFORMANCE_REPORTS,
        JSON.stringify(reports)
      );
    } catch (error) {
      console.error('❌ Erro ao guardar performance reports offline:', error);
      throw error;
    }
  }

  /**
   * Limpar TUDO (usar com cuidado!)
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.OFFLINE_PERFORMANCE_REPORTS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
    console.log('🧹 Todos os performance reports offline limpos');
  }
}

// Exportar instância única (singleton)
export const offlinePerformanceReportsService = new OfflinePerformanceReportsService();