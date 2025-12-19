/**
 * Performance Report Sync Service
 * Sincronização de Performance Repair Elevator Reports criados offline
 */

import NetInfo from '@react-native-community/netinfo';
import {
  offlinePerformanceReportsService,
  OfflinePerformanceReport,
} from '@/services/storage/offlinePerformanceReports.service';
import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';

// ========== TIPOS ==========

export interface PerformanceSyncResult {
  success: boolean;
  tempId: string;
  reportId?: number;
  error?: string;
}

export interface PerformanceSyncSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: PerformanceSyncResult[];
}

export type PerformanceLogCallback = (
  type: 'info' | 'success' | 'error' | 'warning',
  message: string
) => void;

// ========== SERVICE ==========

class PerformanceReportSyncService {
  private isSyncing = false;
  private syncListeners: Array<(summary: PerformanceSyncSummary) => void> = [];
  private logCallbacks: PerformanceLogCallback[] = [];

  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  addLogCallback(callback: PerformanceLogCallback): () => void {
    this.logCallbacks.push(callback);
    return () => {
      const index = this.logCallbacks.indexOf(callback);
      if (index > -1) {
        this.logCallbacks.splice(index, 1);
      }
    };
  }

  addSyncListener(callback: (summary: PerformanceSyncSummary) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private _notifyListeners(summary: PerformanceSyncSummary) {
    this.syncListeners.forEach(callback => {
      try {
        callback(summary);
      } catch (error) {
        console.error('Erro no sync listener:', error);
      }
    });
  }

  private log(type: 'info' | 'success' | 'error' | 'warning', message: string) {
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }[type];

    console.log(`${prefix} [Performance] ${message}`);

    this.logCallbacks.forEach(callback => {
      try {
        callback(type, message);
      } catch (error) {
        console.error('Erro no log callback:', error);
      }
    });
  }

  initialize() {
    this.log('info', '🚀 PerformanceReportSyncService inicializado');

    NetInfo.addEventListener(state => {
      const status = state.isConnected ? 'ONLINE' : 'OFFLINE';
      this.log('info', `📡 NetInfo: ${status}`);

      if (state.isConnected && !this.isSyncing) {
        this.log('info', '🌐 Conexão detectada → Iniciar sync automático');
        this.syncAll().catch(err => {
          this.log('error', `Sync automático falhou: ${err.message}`);
        });
      }
    });
  }

  async syncAll(): Promise<PerformanceSyncSummary> {
    this.log('info', '🔄 syncAll() chamado');

    const networkState = await NetInfo.fetch();
    this.log('info', `📡 Estado rede: ${networkState.isConnected ? 'ONLINE' : 'OFFLINE'}`);

    if (!networkState.isConnected) {
      this.log('warning', '📵 Sem conexão - cancelando sync');
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    if (this.isSyncing) {
      this.log('warning', '⏳ Sync já em andamento');
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    try {
      this.isSyncing = true;
      this.log('info', '🔄 Iniciando sincronização...');

      const pendingReports = await offlinePerformanceReportsService.getPendingSync();
      this.log('info', `📋 ${pendingReports.length} reports pendentes`);

      if (pendingReports.length === 0) {
        this.log('info', '✅ Nenhum report para sincronizar');
        this.isSyncing = false;
        return {
          total: 0,
          succeeded: 0,
          failed: 0,
          results: [],
        };
      }

      const results: PerformanceSyncResult[] = [];

      for (let i = 0; i < pendingReports.length; i++) {
        const report = pendingReports[i];
        const shortId = report.tempId ? report.tempId.substring(0, 8) : 'N/A';
        this.log('info', `📝 [${i + 1}/${pendingReports.length}] Processando ${shortId}...`);

        const result = await this.syncOne(report);
        results.push(result);

        if (result.success) {
          this.log('success', `✓ ${shortId} sincronizado`);
        } else {
          this.log('error', `✗ ${shortId}: ${result.error}`);
        }

        await this._delay(500);
      }

      const summary: PerformanceSyncSummary = {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };

      this.log('success', `🎉 Sync completo: ${summary.succeeded}/${summary.total} sucesso`);

      this._notifyListeners(summary);
      await offlinePerformanceReportsService.setLastSync();

      this.isSyncing = false;
      return summary;
    } catch (error: any) {
      this.log('error', `💥 Erro sync: ${error.message}`);
      this.isSyncing = false;
      throw error;
    }
  }

  /**
   * Sincronizar um relatório Performance
   */
  async syncOne(report: OfflinePerformanceReport): Promise<PerformanceSyncResult> {
    try {
      await offlinePerformanceReportsService.markSyncing(report.tempId);

      const reportData = report.data;

      this.log('info', `📋 Site: ${reportData.site}`);
      this.log('info', `📋 WTG: ${reportData.wtgNumber}`);
      this.log('info', `📋 Fotos: ${report.photos?.length || 0}`);

      // ✅ PASSO 1: Criar relatório via API
      const createPayload = {
        site: reportData.site,
        wtgNumber: reportData.wtgNumber,
        wtgType: reportData.wtgType,
        yearConstruction: reportData.yearConstruction,
        projectoId: report.projectId,
        turbinaId: report.turbineId,
        inpectorsWorkers: reportData.inpectorsWorkers || '',
        workCompleted: reportData.workCompleted || '',
        turbineOperable: reportData.turbineOperable || '',
        performanceReport: reportData.performanceReport || '',
        photoFileIds: [], // Vazio inicialmente
      };

      // Adicionar campos adicionais se existirem
      if (reportData.additionalFields) {
        Object.entries(reportData.additionalFields).forEach(([key, field]) => {
          const fieldNum = key.replace('additionalField', '');
          (createPayload as any)[`additionalField${fieldNum}Label`] = field.label;
          (createPayload as any)[`additionalField${fieldNum}Text`] = field.value;
        });
      }

      this.log('info', `📤 Criando relatório via /performance-repair-elevator...`);

      const createResponse = await httpClient.post(
        `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator`,
        createPayload
      );

      this.log('info', `📥 Status: ${createResponse.status}`);
      this.log('info', `📥 Response: ${JSON.stringify(createResponse.data)}`);

      if (!createResponse.data.success) {
        const errorMsg = createResponse.data.message || 'Erro ao criar relatório';
        this.log('error', `Backend erro: ${errorMsg}`);
        await offlinePerformanceReportsService.markSyncError(report.tempId, errorMsg);
        return { success: false, tempId: report.tempId, error: errorMsg };
      }

      const reportUuid = createResponse.data.uuid;
      const reportId = createResponse.data.reportId;

      if (!reportUuid) {
        this.log('error', '❌ Backend não retornou UUID!');
        await offlinePerformanceReportsService.markSyncError(report.tempId, 'UUID ausente');
        return { success: false, tempId: report.tempId, error: 'UUID ausente' };
      }

      this.log('success', `✅ Relatório criado: ID=${reportId}, UUID=${reportUuid}`);

      // ✅ PASSO 2: Upload de fotos (se houver)
      const uploadedPhotoIds: number[] = [];

      if (report.photos && report.photos.length > 0) {
        this.log('info', `📸 Uploading ${report.photos.length} fotos...`);

        for (let i = 0; i < report.photos.length; i++) {
          const photo = report.photos[i];
          if (!photo.uri || photo.uri.trim() === '') {
            continue;
          }

          try {
            this.log('info', `📤 Upload foto ${i + 1}/${report.photos.length}...`);

            const formData = new FormData();
            formData.append('file', {
              uri: photo.uri,
              type: photo.mimeType || 'image/jpeg',
              name: photo.filename || `photo_${i + 1}.jpg`,
            } as any);

            const uploadResponse = await httpClient.post(
              `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportUuid}/upload-photo`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );

            if (uploadResponse.data.fileId) {
              uploadedPhotoIds.push(uploadResponse.data.fileId);
              this.log('success', `✅ Foto ${i + 1} uploaded: ID=${uploadResponse.data.fileId}`);
            }
          } catch (photoError: any) {
            this.log('error', `❌ Erro upload foto ${i + 1}: ${photoError.message}`);
          }
        }
      }

      // ✅ PASSO 3: Update com IDs das fotos (se houver)
      if (uploadedPhotoIds.length > 0) {
        this.log('info', `🔄 Updating report com ${uploadedPhotoIds.length} foto IDs...`);

        try {
          await httpClient.put(
            `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}`,
            {
              ...createPayload,
              photoFileIds: uploadedPhotoIds,
            }
          );
          this.log('success', '✅ Relatório atualizado com fotos');
        } catch (updateError: any) {
          this.log('warning', `⚠️ Erro ao atualizar fotos: ${updateError.message}`);
        }
      }

      // ✅ SUCESSO: Remover relatório offline
      await offlinePerformanceReportsService.delete(report.tempId);
      this.log('success', `🎉 Sync completo para ${report.tempId}`);

      return {
        success: true,
        tempId: report.tempId,
        reportId,
      };
    } catch (error: any) {
      this.log('error', `❌ Erro ao sincronizar: ${error.message}`);
      await offlinePerformanceReportsService.markSyncError(report.tempId, error.message);

      return {
        success: false,
        tempId: report.tempId,
        error: error.message,
      };
    }
  }

  /**
   * Retentar relatórios com erro
   */
  async retryFailed(): Promise<PerformanceSyncSummary> {
    this.log('info', '🔄 Retrying failed reports...');

    const failedReports = await offlinePerformanceReportsService.getPendingSync();
    const errorReports = failedReports.filter(r => r.status === 'sync_error');

    if (errorReports.length === 0) {
      this.log('info', '✅ Nenhum report com erro');
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    // Marcar todos como pending_sync novamente
    for (const report of errorReports) {
      await offlinePerformanceReportsService.markForSync(report.tempId);
    }

    return await this.syncAll();
  }

  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância única (singleton)
export const performanceReportSyncService = new PerformanceReportSyncService();