// src/services/api/turbine.api.ts

import httpClient from '../httpClient';
import { API_CONFIG } from '@/constants/api';
import type { Turbine, CreateTurbineDTO, UpdateTurbineDTO, TurbineFilters } from '@/types/turbine.types';

/**
 * API de Turbinas
 * Endpoints para gestão de turbinas
 */
export const turbineAPI = {
  /**
   * Obter todas as turbinas
   */
  getAll: async (): Promise<Turbine[]> => {
    const response = await httpClient.get(`${API_CONFIG.baseProjectsUrl}turbines/all`);
    return response.data;
  },

  /**
   * Obter turbina por ID
   */
  getById: async (id: number): Promise<Turbine> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}turbine-by-id/${id}`
    );
    return response.data;
  },

  /**
   * Obter turbinas de um projeto
   */
  getByProject: async (projectId: number): Promise<Turbine[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}turbines/${projectId}`
    );
    return response.data;
  },

  /**
   * Criar nova turbina (adicionar a um projeto)
   */
  create: async (projectName: string): Promise<Turbine> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}add-turbine/${projectName}`
    );
    return response.data;
  },

  /**
   * Atualizar turbina (dados completos)
   */
  update: async (turbineData: FormData): Promise<Turbine> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseProjectsUrl}update-turbine`,
      turbineData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Atualizar nome da turbina
   */
  updateName: async (turbineData: FormData): Promise<Turbine> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseProjectsUrl}update-turbine-name`,
      turbineData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Eliminar turbina
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.baseProjectsUrl}delete-turbine/${id}`);
  },

  /**
   * Pesquisar/Filtrar turbinas
   */
  filter: async (filters: TurbineFilters): Promise<Turbine[]> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseProjectsUrl}turbines/search`,
      filters
    );
    return response.data;
  },

  /**
   * Atualizar flags de relatórios disponíveis
   */
  updateReportFlags: async (turbineId: string, flags: Partial<Turbine>): Promise<Turbine> => {
    const formData = new FormData();
    formData.append('turbineId', turbineId);
    
    // Adicionar flags ao FormData
    if (flags.defectsInspectionReport !== undefined) {
      formData.append('defectsInspectionReport', flags.defectsInspectionReport.toString());
    }
    if (flags.examinationTransformer !== undefined) {
      formData.append('examinationTransformer', flags.examinationTransformer.toString());
    }
    if (flags.measurements6KV !== undefined) {
      formData.append('measurements6KV', flags.measurements6KV.toString());
    }
    if (flags.measurements690V400V !== undefined) {
      formData.append('measurements690V400V', flags.measurements690V400V.toString());
    }
    if (flags.measurementsMwSwitchgear !== undefined) {
      formData.append('measurementsMwSwitchgear', flags.measurementsMwSwitchgear.toString());
    }
    if (flags.onboardCraneInspectionReport !== undefined) {
      formData.append('onboardCraneInspectionReport', flags.onboardCraneInspectionReport.toString());
    }
    if (flags.performanceReportRepairElevator !== undefined) {
      formData.append('performanceReportRepairElevator', flags.performanceReportRepairElevator.toString());
    }
    if (flags.statutoryInspectionReport !== undefined) {
      formData.append('statutoryInspectionReport', flags.statutoryInspectionReport.toString());
    }

    return turbineAPI.update(formData);
  },
};

export default turbineAPI;
