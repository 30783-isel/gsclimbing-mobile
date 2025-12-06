/**
 * Report Sync Service
 * Sincroniza relatórios offline com o servidor quando há conexão
 */

import NetInfo from '@react-native-community/netinfo';
import { offlineReportsService, OfflineReport } from '@/services/storage/offlineReports.service';
import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';

// ========== TIPOS ==========

export interface SyncResult {
  success: boolean;
  tempId: string;
  reportId?: number;
  error?: string;
}

export interface SyncSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: SyncResult[];
}

// ========== SERVICE ==========

class ReportSyncService {
  private isSyncing = false;
  private syncListeners: Array<(summary: SyncSummary) => void> = [];

  /**
   * Inicializar listeners de conexão automática
   */
  initialize() {
    // Ouvir mudanças de conexão
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        console.log('🌐 Conexão detectada, iniciando sincronização automática...');
        this.syncAll();
      }
    });

    console.log('✅ ReportSyncService inicializado');
  }

  /**
   * Sincronizar todos os relatórios pendentes
   */
  async syncAll(): Promise<SyncSummary> {
    // Verificar conexão
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('📵 Sem conexão, sincronização cancelada');
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    if (this.isSyncing) {
      console.log('⏳ Já está a sincronizar...');
      return {
        total: 0,
        succeeded: 0,
        failed: 0,
        results: [],
      };
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronização...');

    try {
      const pendingReports = await offlineReportsService.getPendingSync();
      console.log(`📋 ${pendingReports.length} relatórios pendentes`);

      if (pendingReports.length === 0) {
        this.isSyncing = false;
        return {
          total: 0,
          succeeded: 0,
          failed: 0,
          results: [],
        };
      }

      const results: SyncResult[] = [];

      for (const report of pendingReports) {
        const result = await this.syncOne(report);
        results.push(result);

        // Pequeno delay entre pedidos
        await this._delay(500);
      }

      const summary: SyncSummary = {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };

      console.log(`✅ Sincronização concluída: ${summary.succeeded}/${summary.total} sucesso`);

      // Notificar listeners
      this._notifyListeners(summary);

      // Atualizar timestamp
      await offlineReportsService.setLastSync();

      this.isSyncing = false;
      return summary;

    } catch (error: any) {
      console.error('❌ Erro durante sincronização:', error);
      this.isSyncing = false;
      throw error;
    }
  }

  /**
   * Sincronizar um relatório específico
   */
  async syncOne(report: OfflineReport): Promise<SyncResult> {
    console.log(`🔄 Sincronizando relatório: ${report.tempId}`);

    try {
      // Marcar como sincronizando
      await offlineReportsService.markSyncing(report.tempId);

      // 1. Upload das fotos primeiro
      const photoIds: number[] = [];
      for (const photo of report.photos) {
        try {
          const photoId = await this._uploadPhoto(photo);
          photoIds.push(photoId);
        } catch (error: any) {
          console.error(`❌ Erro ao fazer upload da foto ${photo.filename}:`, error);
          // Continuar mesmo se uma foto falhar?
          // Ou falhar tudo?
          throw new Error(`Falha no upload da foto: ${error.message}`);
        }
      }

      // 2. Criar/submeter relatório
      const payload = {
        tempId: report.tempId,
        turbineId: report.turbineId,
        reportType: report.reportType,
        language: report.language,
        reportData: JSON.stringify(report.data),
        photoIds,
        createdAtDevice: report.createdAt,
      };

      const response = await httpClient.post(
        `${API_CONFIG.baseMobileReportsUrl}sync-offline`,
        payload
      );

      if (response.data.success) {
        const reportId = response.data.reportId;
        console.log(`✅ Relatório sincronizado: ${report.tempId} → ${reportId}`);

        // Eliminar do armazenamento local
        await offlineReportsService.delete(report.tempId);

        return {
          success: true,
          tempId: report.tempId,
          reportId,
        };
      } else {
        // Marcar erro
        const errorMsg = response.data.message || 'Erro desconhecido';
        await offlineReportsService.markSyncError(report.tempId, errorMsg);

        return {
          success: false,
          tempId: report.tempId,
          error: errorMsg,
        };
      }

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Erro de rede';
      console.error(`❌ Erro ao sincronizar ${report.tempId}:`, errorMsg);

      // Marcar erro
      await offlineReportsService.markSyncError(report.tempId, errorMsg);

      return {
        success: false,
        tempId: report.tempId,
        error: errorMsg,
      };
    }
  }

  /**
   * Tentar novamente relatórios com erro
   */
  async retryFailed(): Promise<SyncSummary> {
    const reports = await offlineReportsService.getAll();
    const failedReports = reports.filter(r => r.status === 'sync_error');

    console.log(`🔄 Tentando novamente ${failedReports.length} relatórios com erro`);

    // Marcar como pending novamente
    for (const report of failedReports) {
      await offlineReportsService.markForSync(report.tempId);
    }

    // Sincronizar
    return this.syncAll();
  }

  /**
   * Upload de foto individual
   */
  private async _uploadPhoto(photo: OfflinePhoto): Promise<number> {
    const formData = new FormData();

    // Converter URI local para blob/file
    const response = await fetch(photo.uri);
    const blob = await response.blob();

    formData.append('file', {
      uri: photo.uri,
      type: photo.mimeType,
      name: photo.filename,
    } as any);

    const uploadResponse = await httpClient.post(
      `${API_CONFIG.baseFilesUrl}upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return uploadResponse.data.fileId;
  }

  /**
   * Adicionar listener de sincronização
   */
  addSyncListener(listener: (summary: SyncSummary) => void): () => void {
    this.syncListeners.push(listener);

    // Retornar função para remover listener
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notificar listeners
   */
  private _notifyListeners(summary: SyncSummary): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(summary);
      } catch (error) {
        console.error('❌ Erro em sync listener:', error);
      }
    });
  }

  /**
   * Verificar se está a sincronizar
   */
  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Delay helper
   */
  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância única
export const reportSyncService = new ReportSyncService();
