import httpClient from '../httpClient';
import { API_CONFIG } from '@/constants/api';
import type { Report, CreateReportDTO } from '@/types/report.types';

/**
 * API de Relatórios
 * Endpoints para gestão de relatórios de inspeção
 */
export const reportsAPI = {
  /**
   * Criar novo relatório
   * @param reportData - Dados do relatório
   * @returns Relatório criado com ID
   */
  create: async (reportData: CreateReportDTO): Promise<Report> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseReportsUrl}create`,
      reportData
    );
    return response.data;
  },

  /**
   * Obter relatório por ID
   * @param id - ID do relatório
   * @returns Dados do relatório
   */
  getById: async (id: string): Promise<Report> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseReportsUrl}${id}`
    );
    return response.data;
  },

  /**
   * Obter todos os relatórios de uma turbina
   * @param turbineId - ID da turbina
   * @returns Lista de relatórios
   */
  getByTurbineId: async (turbineId: string): Promise<Report[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseReportsUrl}turbine/${turbineId}`
    );
    return response.data;
  },

  /**
   * Obter relatórios por projeto
   * @param projectId - ID do projeto
   * @returns Lista de relatórios
   */
  getByProjectId: async (projectId: string): Promise<Report[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseReportsUrl}project/${projectId}`
    );
    return response.data;
  },

  /**
   * Atualizar relatório
   * @param id - ID do relatório
   * @param reportData - Dados a atualizar
   * @returns Relatório atualizado
   */
  update: async (id: string, reportData: Partial<Report>): Promise<Report> => {
    const response = await httpClient.put(
      `${API_CONFIG.baseReportsUrl}${id}`,
      reportData
    );
    return response.data;
  },

  /**
   * Eliminar relatório
   * @param id - ID do relatório
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.baseReportsUrl}${id}`);
  },

  /**
   * Upload de foto para relatório
   * @param reportId - ID do relatório
   * @param photo - FormData com a foto
   * @returns Dados da foto enviada
   */
  uploadPhoto: async (reportId: string, photo: FormData): Promise<any> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseFilesUrl}upload/${reportId}`,
      photo,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Obter lista de fotos de um relatório
   * @param reportId - ID do relatório
   * @returns Lista de URLs das fotos
   */
  getPhotos: async (reportId: string): Promise<string[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseFilesUrl}${reportId}`
    );
    return response.data;
  },

  /**
   * Eliminar foto de um relatório
   * @param reportId - ID do relatório
   * @param filename - Nome do ficheiro
   */
  deletePhoto: async (reportId: string, filename: string): Promise<void> => {
    await httpClient.delete(
      `${API_CONFIG.baseFilesUrl}${reportId}/${filename}`
    );
  },

  /**
   * Toggle lock/unlock de relatório
   * @param reportId - ID do relatório
   * @returns Relatório atualizado
   */
  toggleLock: async (reportId: string): Promise<Report> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseReportsUrl}toggle-lock/${reportId}`
    );
    return response.data;
  },

  /**
   * Pedir permissão para editar relatório
   * @param reportId - ID do relatório
   */
  requestEditPermission: async (reportId: string): Promise<void> => {
    await httpClient.post(
      `${API_CONFIG.baseReportsUrl}request-permission/${reportId}`
    );
  },

  /**
   * Download de relatório completo (PDF/Arquivo)
   * @param reportId - ID do relatório
   * @returns Blob do ficheiro
   */
  download: async (reportId: string): Promise<Blob> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseReportsUrl}download/${reportId}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};