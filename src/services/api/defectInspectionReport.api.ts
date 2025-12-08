import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  DefectInspectionReportDTO,
  DefectInspectionReportResponse,
} from '@/reports/defectInspectionReport/defectInspectionReport.types';

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
      console.log(`📸 Fetching photos for report ${reportId}...`);
      
      const response = await httpClient.get(
        `${API_CONFIG.baseUrl}reports/mobile/defect-inspection/${reportId}/photos`
      );
      
      const photos = response.data;
      console.log(`✅ Found ${photos.length} photos for report ${reportId}`);
      
      return photos;
    } catch (error) {
      console.error(`❌ Error fetching photos for report ${reportId}:`, error);
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