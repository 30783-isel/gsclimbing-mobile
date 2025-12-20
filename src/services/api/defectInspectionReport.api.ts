import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  DefectInspectionReportDTO,
  DefectInspectionReportResponse,
} from '@/types/defectInspectionReport.types';

/**
 * Interface para dados de uma foto do servidor
 */
export interface ReportPhotoData {
  fileId: number;
  hash: string;
  name: string;
  description: string | null;
  mimeType: string;
  size: number;
  createDate: string;
  downloadUrl: string;
}

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
   * Eliminar relatório e respetivas imagens
   */
  delete: async (reportId: number): Promise<void> => {
    await httpClient.delete(
      `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}`
    );
  },

  /**
   * ✅ NOVO: Obter fotos de um relatório
   * @param reportId - ID do relatório
   * @returns Lista de fotos com URLs para download
   */
  getPhotos: async (reportId: number): Promise<ReportPhotoData[]> => {
    try {
      console.log('🔍 DEBUG API: getPhotos called with reportId:', reportId);
      const endpoint = `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}/photos`;
      console.log('🔍 DEBUG API: Full endpoint:', endpoint);
      
      const response = await httpClient.get(endpoint);
      
      console.log('✅ DEBUG API: Response status:', response.status);
      console.log('✅ DEBUG API: Response data type:', typeof response.data);
      console.log('✅ DEBUG API: Response data:', JSON.stringify(response.data, null, 2));
      
      const photos = response.data;
      console.log(`✅ DEBUG API: Found ${photos.length} photos for report ${reportId}`);
      
      if (photos.length > 0) {
        console.log('📸 DEBUG API: First photo details:', {
          fileId: photos[0].fileId,
          hash: photos[0].hash,
          downloadUrl: photos[0].downloadUrl,
          name: photos[0].name,
          mimeType: photos[0].mimeType
        });
      }
      
      return photos;
    } catch (error: any) {
      console.error(`❌ DEBUG API: Error fetching photos for report ${reportId}`);
      console.error('❌ DEBUG API: Error message:', error.message);
      console.error('❌ DEBUG API: Error response:', error.response?.data);
      console.error('❌ DEBUG API: Error status:', error.response?.status);
      // Retornar array vazio em caso de erro
      return [];
    }
  },

  /**
   * Upload de foto (usa endpoint existente)
   */
  uploadPhoto: async (
    reportUuid: string,
    photoUri: string,
    description: string
  ): Promise<{ fileId: string; success: boolean }> => {
    const formData = new FormData();
    
    // Extrair nome do arquivo da URI
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    
    formData.append('description', description);

    const response = await httpClient.post(
      `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
};