/**
 * Report Sync Service - VERSÃO COM DEBUG DE FOTOS
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
        await this._delay(500);
      }

      const summary: SyncSummary = {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };

      console.log(`✅ Sincronização concluída: ${summary.succeeded}/${summary.total} sucesso`);

      this._notifyListeners(summary);
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
      console.log('\n🔄 ========================================');
      console.log('🔄 Sincronizando relatório:', report.tempId);
      console.log('🔄 ========================================');
      
      await offlineReportsService.markSyncing(report.tempId);

      const payload = {
        tempId: report.tempId,
        turbineId: report.turbineId,
        reportType: report.reportType,
        language: report.language,
        reportData: JSON.stringify(report.data),
        photos: report.photos,
        createdAtDevice: report.createdAt,
        inspectedBy: report.createdAt,
      };

      console.log('📤 Enviando payload:', {
        tempId: payload.tempId,
        turbineId: payload.turbineId,
        reportType: payload.reportType,
        language: payload.language,
        photosCount: payload.photos.length,
        createdAtDevice: payload.createdAtDevice,
      });

      const response = await httpClient.post(
        `${API_CONFIG.baseMobileReportsUrl}sync-offline`,
        payload
      );

      console.log('📥 Resposta do backend:', JSON.stringify(response.data, null, 2));

      if (!response.data.success) {
        const errorMsg = response.data.message || 'Erro desconhecido';
        console.error('❌ Backend retornou erro:', errorMsg);
        
        if (response.data.errors && response.data.errors.length > 0) {
          console.error('❌ Erros de validação:', response.data.errors);
        }
        
        await offlineReportsService.markSyncError(report.tempId, errorMsg);
        return { success: false, tempId: report.tempId, error: errorMsg };
      }

      const reportUuid = response.data.uuid;
      console.log('✅ Relatório criado com UUID:', reportUuid);
      
      // ========================================
      // UPLOAD DE FOTOS
      // ========================================
      if (report.photos && report.photos.length > 0) {
        console.log(`\n📸 ========================================`);
        console.log(`📸 Iniciando upload de ${report.photos.length} fotos...`);
        console.log(`📸 ========================================\n`);
        
        let uploadedCount = 0;
        let failedCount = 0;
        
        for (let i = 0; i < report.photos.length; i++) {
          const photo = report.photos[i];
          
          try {
            console.log(`\n📷 Foto ${i + 1}/${report.photos.length}:`);
            console.log(`   - Filename: ${photo.filename}`);
            console.log(`   - URI: ${photo.uri}`);
            console.log(`   - MimeType: ${photo.mimeType}`);
            console.log(`   - TempId: ${photo.tempId}`);
            
            // Verificar se o URI existe e é válido
            if (!photo.uri || photo.uri.trim() === '') {
              console.warn(`⚠️ Foto ${i + 1} tem URI vazio, a saltar...`);
              failedCount++;
              continue;
            }
            
            const fileId = await this._uploadPhoto(photo, reportUuid);
            uploadedCount++;
            console.log(`✅ Foto ${i + 1} enviada com sucesso! FileId: ${fileId}`);
            
          } catch (photoError: any) {
            failedCount++;
            console.error(`❌ Erro ao enviar foto ${i + 1}:`, photoError.message);
            console.error(`   - Stack:`, photoError.stack);
            
            // Verificar se é erro de rede ou servidor
            if (photoError.response) {
              console.error(`   - Status HTTP: ${photoError.response.status}`);
              console.error(`   - Resposta:`, JSON.stringify(photoError.response.data, null, 2));
            }
            
            // NÃO parar o processo, continuar com as outras fotos
          }
        }
        
        console.log(`\n📸 ========================================`);
        console.log(`📸 Resultado do upload de fotos:`);
        console.log(`   ✅ Sucesso: ${uploadedCount}`);
        console.log(`   ❌ Falhas: ${failedCount}`);
        console.log(`   📊 Total: ${report.photos.length}`);
        console.log(`📸 ========================================\n`);
        
        // Mesmo que algumas fotos falharam, considerar sucesso se o relatório foi criado
        if (uploadedCount === 0 && failedCount > 0) {
          console.warn('⚠️ AVISO: Nenhuma foto foi enviada com sucesso!');
        }
      } else {
        console.log('📸 Sem fotos para enviar');
      }

      // Eliminar relatório offline após sucesso
      await offlineReportsService.delete(report.tempId);
      console.log(`✅ Relatório ${report.tempId} sincronizado e eliminado localmente\n`);
      
      return { success: true, tempId: report.tempId, reportId: response.data.reportId };
      
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido';
      console.error(`❌ Erro ao sincronizar ${report.tempId}:`, errorMsg);
      console.error('Stack trace:', error.stack);
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

    for (const report of failedReports) {
      await offlineReportsService.markForSync(report.tempId);
    }

    return this.syncAll();
  }

  /**
   * Upload de foto individual com UUID
   */
  private async _uploadPhoto(photo: OfflinePhoto, reportUuid: string): Promise<number> {
    try {
      console.log(`\n   📤 Preparando upload...`);
      console.log(`   - Endpoint: ${API_CONFIG.baseFilesUrl}upload/${reportUuid}`);
      
      const formData = new FormData();

      // CRÍTICO: Verificar formato do objeto de ficheiro
      const fileObject = {
        uri: photo.uri,
        type: photo.mimeType || 'image/jpeg',
        name: photo.filename,
      };
      
      console.log(`   - File object:`, JSON.stringify(fileObject, null, 2));
      
      formData.append('file', fileObject as any);

      console.log(`   - FormData preparado, a enviar...`);

      const uploadResponse = await httpClient.post(
        `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 segundos timeout
        }
      );

      console.log(`   - Resposta recebida:`, uploadResponse.status);
      console.log(`   - FileId:`, uploadResponse.data.fileId);

      return uploadResponse.data.fileId;
      
    } catch (error: any) {
      console.error(`   ❌ Erro no upload da foto:`);
      console.error(`   - Message: ${error.message}`);
      
      if (error.response) {
        console.error(`   - Status: ${error.response.status}`);
        console.error(`   - Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error(`   - Request foi feito mas sem resposta`);
        console.error(`   - Request:`, error.request);
      } else {
        console.error(`   - Erro ao configurar request:`, error.message);
      }
      
      throw error;
    }
  }

  /**
   * Adicionar listener de sincronização
   */
  addSyncListener(listener: (summary: SyncSummary) => void): () => void {
    this.syncListeners.push(listener);

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