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
  try {
    console.log('📝 Creating Defect Inspection Report...');
    console.log('📋 Original data:', JSON.stringify(data, null, 2));

    // ✅ CONVERTER para o formato que o backend espera
    const payload = {
      turbineId: data.turbinaId, // ← Corrigido: só turbinaId
      reportType: 0, // Defect Inspection = 0
      language: 'EN',
      reportData: JSON.stringify({
        site: data.site,
        wtgNumber: data.wtgNumber,
        wtgType: data.wtgType,
        yearConstruction: data.yearConstruction,
        dateInspection: new Date().toISOString().split('T')[0],
        inspectedBy: '',
        observations: '',
        // Campos adicionais
        additionalField1Label: data.additionalField1?.label || '',
        additionalField1Text: data.additionalField1?.value || '',
        additionalField2Label: data.additionalField2?.label || '',
        additionalField2Text: data.additionalField2?.value || '',
        additionalField3Label: data.additionalField3?.label || '',
        additionalField3Text: data.additionalField3?.value || '',
        additionalField4Label: data.additionalField4?.label || '',
        additionalField4Text: data.additionalField4?.value || '',
        additionalField5Label: data.additionalField5?.label || '',
        additionalField5Text: data.additionalField5?.value || '',
        additionalField6Label: data.additionalField6?.label || '',
        additionalField6Text: data.additionalField6?.value || '',
        additionalField7Label: data.additionalField7?.label || '',
        additionalField7Text: data.additionalField7?.value || '',
      }),
      photoFileIds: data.photoFileIds || [],
    };

    console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

    const response = await httpClient.post(
      `${API_CONFIG.baseMobileReportsUrl}defect-inspection`,
      payload
    );

    console.log('✅ Report created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating report:', error.response?.data || error.message);
    throw error;
  }
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