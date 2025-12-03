import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';

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
 * API estendida para fotografias de relatórios
 */
export const reportPhotosAPI = {
  /**
   * Obter todas as fotos de um relatório
   * @param reportId - ID do relatório
   * @returns Lista de fotos com URLs de download
   */
  getPhotos: async (reportId: number): Promise<ReportPhotoData[]> => {
    try {
      console.log(`📸 Fetching photos for report ${reportId}...`);
      
      const response = await httpClient.get(
        `/reports/mobile/defect-inspection/${reportId}/photos`
      );
      
      const photos = response.data;
      console.log(`✅ Found ${photos.length} photos for report ${reportId}`);
      
      return photos;
    } catch (error) {
      console.error(`❌ Error fetching photos for report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * Obter URL completo para download de uma foto
   * @param hash - Hash da foto
   * @returns URL completo para download
   */
  getPhotoUrl: (hash: string): string => {
    // baseUrl já termina com /, então não adicionar /
    const baseUrlClean = API_CONFIG.baseUrl.endsWith('/') 
      ? API_CONFIG.baseUrl.slice(0, -1) 
      : API_CONFIG.baseUrl;
    return `${baseUrlClean}/api/reports/mobile/files/download/${hash}`;
  },

  /**
   * Download de uma foto específica (retorna blob)
   * @param hash - Hash da foto
   * @returns Blob da imagem
   */
  downloadPhoto: async (hash: string): Promise<Blob> => {
    try {
      console.log(`📥 Downloading photo with hash: ${hash}`);
      
      const response = await httpClient.get(
        `/api/reports/mobile/files/download/${hash}`,
        {
          responseType: 'blob',
        }
      );
      
      console.log(`✅ Photo downloaded: ${hash}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error downloading photo ${hash}:`, error);
      throw error;
    }
  },
};