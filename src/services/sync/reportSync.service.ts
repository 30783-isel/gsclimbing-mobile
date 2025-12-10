/**
 * Report Sync Service
 * Sincroniza relatórios offline com o servidor quando há conexão
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
    try {
      console.log('\n🔄 Sincronizando relatório:', report.tempId);
      await offlineReportsService.markSyncing(report.tempId);

      // ✅ CORRIGIDO: createdAtDevice agora está correto
      const payload = {
        tempId: report.tempId,
        turbineId: report.turbineId,
        reportType: report.reportType,
        language: report.language,
        reportData: JSON.stringify(report.data),
        photos: report.photos,
        createdAtDevice: report.createdAt,  // ✅ CORRIGIDO
        inspectedBy: report.createdAt,
      };

      console.log('📤 Enviando payload:', {
        tempId: payload.tempId,
        turbineId: payload.turbineId,
        reportType: payload.reportType,
        language: payload.language,
        photosCount: payload.photos.length,
        createdAtDevice: payload.createdAtDevice,
        inspectedBy: payload.inspectedBy,
      });

      const response = await httpClient.post(
        `${API_CONFIG.baseMobileReportsUrl}sync-offline`,
        payload
      );

      // ✅ LOG COMPLETO DA RESPOSTA
      console.log('📥 Resposta completa do backend:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        const errorMsg = response.data.message || 'Erro desconhecido';
        console.error('❌ Backend retornou erro:', errorMsg);
        
        // Se houver erros de validação, logar também
        if (response.data.errors && response.data.errors.length > 0) {
          console.error('❌ Erros de validação:', response.data.errors);
        }
        
        await offlineReportsService.markSyncError(report.tempId, errorMsg);
        return { success: false, tempId: report.tempId, error: errorMsg };
      }

      const reportUuid = response.data.uuid;
      console.log('✅ Relatório criado com UUID:', reportUuid);
      
      // Upload fotos DEPOIS
      if (report.photos && report.photos.length > 0) {
        console.log(`📸 A fazer upload de ${report.photos.length} fotos...`);
        for (const photo of report.photos) {
          try {
            await this._uploadPhoto(photo, reportUuid);
            console.log(`✅ Foto ${photo.filename} enviada`);
          } catch (photoError: any) {
            console.error(`❌ Erro ao enviar foto ${photo.filename}:`, photoError.message);
            // Continuar com as outras fotos mesmo se uma falhar
          }
        }
      }

      // Eliminar relatório offline após sucesso
      await offlineReportsService.delete(report.tempId);
      console.log(`✅ Relatório ${report.tempId} sincronizado e eliminado localmente\n`);
      
      return { success: true, tempId: report.tempId, reportId: response.data.reportId };
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido';
      console.error(`❌ Erro ao sincronizar ${report.tempId}:`, errorMsg);
      console.error('Stack trace:', error);
      await offlineReportsService.markSyncError(report.tempId, errorMsg);
      return { success: false, tempId: report.tempId, error: errorMsg };
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
   * Upload de foto individual com UUID
   */
  private async _uploadPhoto(photo: OfflinePhoto, reportUuid: string): Promise<number> {
    const formData = new FormData();

    formData.append('file', {
      uri: photo.uri,
      type: photo.mimeType,
      name: photo.filename,
    } as any);

    console.log(`📤 Enviando foto ${photo.filename} para relatório ${reportUuid}`);

    const uploadResponse = await httpClient.post(
      `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log(`✅ Foto ${photo.filename} enviada com sucesso. FileId:`, uploadResponse.data.fileId);
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