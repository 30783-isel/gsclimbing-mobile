import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  DefectInspectionReportDTO,
  DefectInspectionReportResponse,
} from '@/types/defectInspectionReport.types';

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

export const defectInspectionReportAPI = {
  /**
   * Criar novo relatório
   */
  create: async (
    data: DefectInspectionReportDTO
  ): Promise<DefectInspectionReportResponse> => {
    // ✅ ANTES: ${API_CONFIG.baseUrl}reports/mobile/defect-inspection
    // ✅ DEPOIS: ${API_CONFIG.baseMobileReportsUrl}defect-inspection
    const response = await httpClient.post(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection`,
      data
    );
    return response.data;
  },

  /**
   * Obter relatório por ID
   */
  getById: async (reportId: number): Promise<DefectInspectionReportResponse> => {
    // ✅ MUDANÇA AQUI
    const response = await httpClient.get(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection/${reportId}`
    );
    return response.data;
  },

  /**
   * Obter lista de relatórios de uma turbina
   */
  getByTurbineId: async (
    turbineId: number
  ): Promise<DefectInspectionReportResponse[]> => {
    // ✅ MUDANÇA AQUI
    const response = await httpClient.get(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection/turbine/${turbineId}`
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
    // ✅ MUDANÇA AQUI
    const response = await httpClient.put(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection/${reportId}`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar relatório
   */
  delete: async (reportId: number): Promise<void> => {
    // ✅ MUDANÇA AQUI
    await httpClient.delete(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection/${reportId}`
    );
  },

  /**
   * Obter fotos de um relatório
   */
  getPhotos: async (reportId: number): Promise<ReportPhotoData[]> => {
    try {
      console.log('🔍 DEBUG API: getPhotos called with reportId:', reportId);
      
      // ✅ MUDANÇA PRINCIPAL AQUI
      const endpoint = `${API_CONFIG.baseMobileReportsUrl}defect-inspection/${reportId}/photos`;
      console.log('🔍 DEBUG API: Full endpoint:', endpoint);
      
      const response = await httpClient.get(endpoint);
      
      console.log('✅ DEBUG API: Response status:', response.status);
      console.log('✅ DEBUG API: Response data:', JSON.stringify(response.data, null, 2));
      
      const photos = response.data;
      console.log(`✅ DEBUG API: Found ${photos.length} photos for report ${reportId}`);
      
      return photos;
    } catch (error: any) {
      console.error(`❌ DEBUG API: Error fetching photos for report ${reportId}`);
      console.error('❌ DEBUG API: Error:', error.message);
      // Retornar array vazio em caso de erro
      return [];
    }
  },

  /**
   * Upload de foto
   */
  uploadPhoto: async (
    reportUuid: string,
    photoUri: string,
    description: string
  ): Promise<{ fileId: string; success: boolean }> => {
    const formData = new FormData();
    
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    formData.append('fieldName', 'photoOne');
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