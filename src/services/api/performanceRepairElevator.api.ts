// src/services/api/performanceRepairElevator.api.ts

import httpClient from '@/services/httpClient';
import { API_CONFIG } from '@/constants/api';
import type {
  PerformanceRepairElevatorData,
  PerformanceRepairElevatorDTO,
  PerformanceRepairElevatorResponse,
  PhotoData,
} from '@/types/performanceRepairElevator.types';

export const performanceRepairElevatorAPI = {
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
      reportType: 6, // Performance Report Repair Elevator
      reportData: JSON.stringify(dto),
      photoFileIds: dto.photoFileIds,
    };

    const response = await httpClient.post(
      `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator`,
      payload
    );

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
      photoFileIds: dto.photoFileIds,
    };

    const response = await httpClient.put(
      `${API_CONFIG.baseMobileReportsUrl}performance-repair-elevator/${reportId}`,
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
    const response = await httpClient.get(
      `${API_CONFIG.baseReportsUrl}/${reportId}/photos`
    );
    return response.data;
  },

  /**
   * Upload de foto
   */
  uploadPhoto: async (photo: PhotoData): Promise<{ fileId: number }> => {
    const formData = new FormData();
    
    formData.append('file', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: `photo_${Date.now()}.jpg`,
    } as any);

    if (photo.description) {
      formData.append('description', photo.description);
    }

    const response = await httpClient.post(
      `${API_CONFIG.baseReportsUrl}/upload-photo`,
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
};