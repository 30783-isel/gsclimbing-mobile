/**
 * Report Sync Service - USANDO ENDPOINT CORRETO
 * O endpoint /sync-offline não funciona direito, vamos usar /defect-inspection
 */

import NetInfo from '@react-native-community/netinfo';
import { offlineReportsService, OfflineReport, OfflinePhoto } from '@/services/storage/offlineReports.service';
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

export type LogCallback = (type: 'info' | 'success' | 'error' | 'warning', message: string) => void;

// ========== SERVICE ==========

class ReportSyncService {
  private isSyncing = false;
  private syncListeners: Array<(summary: SyncSummary) => void> = [];
  private logCallbacks: LogCallback[] = [];

  addLogCallback(callback: LogCallback): () => void {
    this.logCallbacks.push(callback);
    return () => {
      const index = this.logCallbacks.indexOf(callback);
      if (index > -1) {
        this.logCallbacks.splice(index, 1);
      }
    };
  }

  private log(type: 'info' | 'success' | 'error' | 'warning', message: string) {
    switch (type) {
      case 'success':
        console.log(`✅ ${message}`);
        break;
      case 'error':
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        console.warn(`⚠️ ${message}`);
        break;
      default:
        console.log(`ℹ️ ${message}`);
    }

    this.logCallbacks.forEach(callback => {
      try {
        callback(type, message);
      } catch (error) {
        console.error('Erro no log callback:', error);
      }
    });
  }

  initialize() {
    this.log('info', '🚀 ReportSyncService inicializado');
    
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

  async syncAll(): Promise<SyncSummary> {
    this.log('info', '🔄 syncAll() chamado');
    
    const networkState = await NetInfo.fetch();
    this.log('info', `📡 Estado rede: ${networkState.isConnected ? 'ONLINE' : 'OFFLINE'}`);
    
    if (!networkState.isConnected) {
      this.log('warning', '📵 Sem conexão - sync cancelado');
      return { total: 0, succeeded: 0, failed: 0, results: [] };
    }

    if (this.isSyncing) {
      this.log('warning', '⏳ Já está a sincronizar');
      return { total: 0, succeeded: 0, failed: 0, results: [] };
    }

    this.isSyncing = true;
    this.log('info', '▶️ Sincronização INICIADA');

    try {
      const pendingReports = await offlineReportsService.getPendingSync();
      this.log('info', `📋 ${pendingReports.length} relatórios pendentes`);

      if (pendingReports.length === 0) {
        this.isSyncing = false;
        return { total: 0, succeeded: 0, failed: 0, results: [] };
      }

      const results: SyncResult[] = [];

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

      const summary: SyncSummary = {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };

      this.log('success', `🎉 Sync completo: ${summary.succeeded}/${summary.total} sucesso`);

      this._notifyListeners(summary);
      await offlineReportsService.setLastSync();

      this.isSyncing = false;
      return summary;

    } catch (error: any) {
      this.log('error', `💥 Erro sync: ${error.message}`);
      this.isSyncing = false;
      throw error;
    }
  }

  /**
   * ✅ NOVA IMPLEMENTAÇÃO: Usar endpoint correto /defect-inspection
   */
  async syncOne(report: OfflineReport): Promise<SyncResult> {
    try {
      await offlineReportsService.markSyncing(report.tempId);

      // Parse do reportData
      const reportData = report.data;
      
      this.log('info', `📋 Site: ${reportData.site}`);
      this.log('info', `📋 WTG: ${reportData.wtgNumber}`);
      this.log('info', `📋 Fotos: ${report.photos?.length || 0}`);

      // ✅ PASSO 1: Criar relatório usando endpoint correto
      const createPayload = {
        site: reportData.site,
        wtgNumber: reportData.wtgNumber,
        wtgType: reportData.wtgType,
        yearConstruction: reportData.yearConstruction,
        projectoId: report.projectId,
        turbinaId: report.turbineId,
        userId: 'mobile-user',
        photoFileIds: [], // Vazio por enquanto
      };

      this.log('info', `📤 Criando relatório via /defect-inspection...`);

      const createResponse = await httpClient.post(
        `${API_CONFIG.baseMobileReportsUrl}defect-inspection`,
        createPayload
      );

      this.log('info', `📥 Status: ${createResponse.status}`);
      this.log('info', `📥 Response: ${JSON.stringify(createResponse.data)}`);

      if (!createResponse.data.success) {
        const errorMsg = createResponse.data.message || 'Erro ao criar relatório';
        this.log('error', `Backend erro: ${errorMsg}`);
        await offlineReportsService.markSyncError(report.tempId, errorMsg);
        return { success: false, tempId: report.tempId, error: errorMsg };
      }

      const reportUuid = createResponse.data.uuid;
      const reportId = createResponse.data.reportId;
      
      if (!reportUuid) {
        this.log('error', '❌ Backend não retornou UUID!');
        throw new Error('UUID não retornado pelo backend');
      }

      this.log('success', `📋 Relatório criado: UUID=${reportUuid.substring(0, 8)}, ID=${reportId}`);
      
      // ✅ PASSO 2: Upload de fotos
      if (report.photos && report.photos.length > 0) {
        this.log('info', `📸 Uploading ${report.photos.length} fotos...`);
        
        let uploadedCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < report.photos.length; i++) {
          const photo = report.photos[i];
          
          if (!photo.uri || photo.uri.trim() === '') {
            this.log('warning', `⚠️ Foto ${i + 1}: URI vazio`);
            failedCount++;
            continue;
          }
          
          try {
            await this._uploadPhoto(photo, reportUuid);
            uploadedCount++;
            this.log('success', `✓ Foto ${i + 1}/${report.photos.length}`);
            
          } catch (photoError: any) {
            failedCount++;
            this.log('error', `✗ Foto ${i + 1}: ${photoError.message}`);
          }
        }
        
        this.log('info', `📸 Fotos: ${uploadedCount} sucesso, ${failedCount} falhas`);
        
        if (uploadedCount === 0 && failedCount > 0) {
          this.log('warning', '⚠️ NENHUMA foto foi enviada!');
        }
      } else {
        this.log('info', '📸 Sem fotos para enviar');
      }

      await offlineReportsService.delete(report.tempId);
      
      return { success: true, tempId: report.tempId, reportId };
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido';
      this.log('error', `Sync erro: ${errorMsg}`);
      await offlineReportsService.markSyncError(report.tempId, errorMsg);
      return { success: false, tempId: report.tempId, error: errorMsg };
    }
  }

  async retryFailed(): Promise<SyncSummary> {
    const reports = await offlineReportsService.getAll();
    const failedReports = reports.filter(r => r.status === 'sync_error');

    this.log('info', `🔄 Retry: ${failedReports.length} relatórios`);

    for (const report of failedReports) {
      await offlineReportsService.markForSync(report.tempId);
    }

    return this.syncAll();
  }

  private async _uploadPhoto(photo: OfflinePhoto, reportUuid: string): Promise<number> {
    const formData = new FormData();

    const fileObject = {
      uri: photo.uri,
      type: photo.mimeType || 'image/jpeg',
      name: photo.filename,
      fieldName: 'photoOne',
      description: photo.filename,
    };
    formData.append('file', fileObject as any);

    const uploadResponse = await httpClient.post(
      `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return uploadResponse.data.fileId;
  }

  addSyncListener(listener: (summary: SyncSummary) => void): () => void {
    this.syncListeners.push(listener);

    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private _notifyListeners(summary: SyncSummary): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(summary);
      } catch (error) {
        console.error('❌ Erro em sync listener:', error);
      }
    });
  }

  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância única
export const reportSyncService = new ReportSyncService();