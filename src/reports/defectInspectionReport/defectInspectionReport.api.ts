import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  DefectInspectionReportDTO,
  DefectInspectionReportResponse,
} from '@/reports/defectInspectionReport/defectInspectionReport.types';

/**
 * API para Defect Inspection Report
 */
export const defectInspectionReportAPI = {
  /**
   * Criar novo relatório
   */
  create: async (
    data: DefectInspectionReportDTO
  ): Promise<DefectInspectionReportResponse> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection`,
      data
    );
    return response.data;
  },

  /**
   * Obter relatório por ID
   */
  getById: async (reportId: number): Promise<DefectInspectionReportResponse> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}`
    );
    return response.data;
  },

    /**
   * Eliminar relatório e respetivas imagens
   */
  delete: async (reportId: string): Promise<void> => {
    await httpClient.delete(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}`
    );
  },
  
  /**
   * Obter lista de relatórios de uma turbina
   */
  getByTurbineId: async (
    turbineId: number
  ): Promise<DefectInspectionReportResponse[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/turbine/${turbineId}`
    );
    return response.data;
  },

  /**
   * Atualizar relatório
   */
  update: async (
    reportId: number,
    data: DefectInspectionReportDTO
  ): Promise<DefectInspectionReportResponse> => {
    const response = await httpClient.put(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}`,
      data
    );
    return response.data;
  },

  /**
   * Upload de foto (VERSÃO CORRIGIDA)
   * Usa UUID do relatório e FormData correto
   */
  uploadPhoto: async (
    reportUuid: string,
    photoUri: string,
    description: string
  ): Promise<{ fileId: string; success: boolean }> => {
    try {
      console.log('📸 Preparando upload de foto...');
      console.log('   Report UUID:', reportUuid);
      console.log('   Photo URI:', photoUri.substring(0, 100) + '...');
      
      const formData = new FormData();
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      
      // Converter para Blob
      if (photoUri.startsWith('data:')) {
        // Data URL (Web) - converter para Blob
        const response = await fetch(photoUri);
        const blob = await response.blob();
        console.log('   Blob criado:', blob.type, blob.size, 'bytes');
        // Usar Blob diretamente com cast para any
        (formData as any).append('file', blob, filename);
      } else if (photoUri.startsWith('http')) {
        // URL remota
        const response = await fetch(photoUri);
        const blob = await response.blob();
        console.log('   Blob criado:', blob.type, blob.size, 'bytes');
        (formData as any).append('file', blob, filename);
      } else {
        // React Native formato
        const file = {
          uri: photoUri,
          type: 'image/jpeg',
          name: filename,
        } as any;
        formData.append('file', file);
      }
      
      formData.append('description', description || '');

      console.log('📤 Enviando foto para:', `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`);

      const response = await httpClient.post(
        `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ Upload bem-sucedido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no upload de foto:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      throw error;
    }
  },
};