// src/services/api/performanceRepairElevator.api.ts

import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  PerformanceRepairElevatorData,
  PerformanceRepairElevatorDTO,
  PerformanceRepairElevatorResponse,
  PhotoData,
} from '@/types/performanceRepairElevator.types';
import { Report } from '@/types';
import type { HistoryEntry } from '@/types/history.types';

export const performanceRepairElevatorAPI = {
  /**
   * Criar novo relatório
   */
/**
 * Criar novo relatório
 */
create: async (data: PerformanceRepairElevatorData): Promise<PerformanceRepairElevatorResponse> => {
  const dto: PerformanceRepairElevatorDTO = {
    site: data.site,
    wtgNumber: data.wtgNumber,
    wtgType: data.wtgType,
    yearConstruction: data.yearConstruction,
    inspectors: data.inspectors,
    workCompleted: data.workCompleted,
    windturbineOperable: data.windturbineOperable,
    performanceReport: data.performanceReport,
    projectoId: data.projectoId,
    turbinaId: data.turbinaId,
    photoFileIds: data.photos
      .filter(p => p.fileId && p.isUploaded)
      .map(p => p.fileId!),
  };

  // Adicionar campos adicionais
  data.additionalFields.forEach((field, index) => {
    if (index < 3) {
      (dto as any)[`additionalField${index + 1}`] = {
        label: field.label,
        value: field.value,
      };
    }
  });

  const payload = {
    turbineId: data.turbinaId,
    projectoId: data.projectoId,
    reportType: 6,
    reportData: JSON.stringify(dto),
    photoIds: dto.photoFileIds, 
  };

  // ✅ ADICIONAR ESTES LOGS
  const url = `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator`;
  console.log('🔍 DEBUG CREATE:');
  console.log('  API_CONFIG.baseMobileReportsUrl:', API_CONFIG.baseMobileReportsUrl);
  console.log('  Full URL:', url);
  console.log('  URL length:', url.length);
  console.log('  Has //:', url.includes('//'));
  console.log('  Count of /:', (url.match(/\//g) || []).length);

  const response = await httpClient.post(url, payload);

  return response.data;
},

  /**
   * Atualizar relatório existente
   */
  update: async (
    reportId: number,
    data: PerformanceRepairElevatorData
  ): Promise<PerformanceRepairElevatorResponse> => {
    const dto: PerformanceRepairElevatorDTO = {
      site: data.site,
      wtgNumber: data.wtgNumber,
      wtgType: data.wtgType,
      yearConstruction: data.yearConstruction,
      inspectors: data.inspectors,
      workCompleted: data.workCompleted,
      windturbineOperable: data.windturbineOperable,
      performanceReport: data.performanceReport,
      projectoId: data.projectoId,
      turbinaId: data.turbinaId,
      photoFileIds: data.photos
        .filter(p => p.fileId && p.isUploaded)
        .map(p => p.fileId!),
    };

    data.additionalFields.forEach((field, index) => {
      if (index < 3) {
        (dto as any)[`additionalField${index + 1}`] = {
          label: field.label,
          value: field.value,
        };
      }
    });

    const payload = {
      turbineId: data.turbinaId,
      projectoId: data.projectoId,
      reportType: 6,
      reportData: JSON.stringify(dto),
      photoIds: dto.photoFileIds, 
    };

    const endpoint = `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}`;
    const response = await httpClient.put(
      endpoint,
      payload
    );

    return response.data;
  },

  /**
   * Obter relatório por ID
   */
  getById: async (reportId: number): Promise<any> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}`
    );
    return response.data;
  },

  /**
   * Obter fotos do relatório
   */
    getPhotos: async (reportId: number): Promise<any[]> => {
        const endpoint = `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}/photos`;
        console.log('🔍 DEBUG GET PHOTOS:' + endpoint);
        const response = await httpClient.get(endpoint);
        return response.data;
    },

  /**
   * Upload de foto
   */
/**
 * Upload de foto
 */
uploadPhoto: async (photo: PhotoData, reportUuid: string): Promise<{ fileId: number }> => {
  const formData = new FormData();
  
  formData.append('file', {
    uri: photo.uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);

  if (photo.description) {
    formData.append('description', photo.description);
  }

  // ✅ Endpoint correto com UUID do relatório
  const endpoint = `${API_CONFIG.baseFilesUrl}upload/${reportUuid}`;
  console.log('🔍 DEBUG UPDATE PHOTOS:' + endpoint);
  const response = await httpClient.post(
    endpoint,  // ✅ Usa baseFilesUrl + upload/{uuid}
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
},

  /**
   * Eliminar relatório
   */
  delete: async (reportId: number): Promise<void> => {
    await httpClient.delete(
      `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}`
    );
  },
  /**
 * Obter todos os relatórios de uma turbina
 */
getByTurbine: async (turbineId: number): Promise<Report[]> => {
  const endpoint = `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/turbine/${turbineId}`;
  const response = await httpClient.get(
    endpoint
  );
  return response.data;
},

/**
 * Obter histórico de alterações de um Performance Report
 * @param reportId - ID do relatório
 * @returns Lista de entradas de histórico
 */
getHistory: async (reportId: number): Promise<HistoryEntry[]> => {
  try {
    console.log(`📜 Fetching history for performance report ${reportId}...`);
    
    const response = await httpClient.get(
      `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}/history`
    );

    console.log(`✅ Found ${response.data.length} history entries`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error fetching history for report ${reportId}:`, error);
    throw error;
  }
},

};