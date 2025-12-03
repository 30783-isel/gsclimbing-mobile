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
   * Upload de foto (usa endpoint existente)
   */
  uploadPhoto: async (
    reportId: string,
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
      `${API_CONFIG.baseFilesUrl}upload/${reportId}`,
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