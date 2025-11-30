import httpClient from '../httpClient';
import { API_CONFIG } from '@/constants/api';
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectFilters } from '@/types/project.types';
import type { Turbine } from '@/types/turbine.types';

export const projectsAPI = {
  /**
   * Obter todos os projetos
   */
  getAll: async (): Promise<Project[]> => {
    const response = await httpClient.get(`${API_CONFIG.baseProjectsUrl}all`);
    return response.data;
  },

  /**
   * Obter projetos de um utilizador
   */
  getByUserId: async (userId: string): Promise<Project[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}projects-by-user/${userId}`
    );
    return response.data;
  },

  /**
   * Obter projeto por ID
   */
  getById: async (id: number): Promise<Project> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}project-by-id/${id}`
    );
    return response.data;
  },

  /**
   * Criar novo projeto
   */
  create: async (project: CreateProjectDTO): Promise<Project> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseProjectsUrl}create`,
      project
    );
    return response.data;
  },

  /**
   * Atualizar projeto
   */
  update: async (id: string, project: UpdateProjectDTO): Promise<Project> => {
    const response = await httpClient.put(
      `${API_CONFIG.baseProjectsUrl}update/${id}`,
      project
    );
    return response.data;
  },

  /**
   * Eliminar projeto
   */
  delete: async (name: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.baseProjectsUrl}delete/${name}`);
  },

  /**
   * Pesquisar/Filtrar projetos
   */
  filter: async (filters: ProjectFilters): Promise<Project[]> => {
    const response = await httpClient.post(
      `${API_CONFIG.baseProjectsUrl}search`,
      filters
    );
    return response.data;
  },

  /**
   * Obter turbinas de um projeto
   */
  getTurbines: async (projectId: string): Promise<Turbine[]> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}turbines/${projectId}`
    );
    return response.data;
  },

  /**
   * Obter turbina por ID
   */
  getTurbineById: async (id: string): Promise<Turbine> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}turbine-by-id/${id}`
    );
    return response.data;
  },

  /**
   * Adicionar turbina a um projeto
   */
  addTurbine: async (projectName: string): Promise<Turbine> => {
    const response = await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}add-turbine/${projectName}`
    );
    return response.data;
  },

  /**
   * Atualizar turbina
   */
  updateTurbine: async (turbineData: FormData): Promise<Turbine> => {
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
  updateTurbineName: async (turbineData: FormData): Promise<Turbine> => {
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
  deleteTurbine: async (id: string): Promise<void> => {
    await httpClient.delete(`${API_CONFIG.baseProjectsUrl}delete-turbine/${id}`);
  },

  /**
   * Atualizar utilizadores do projeto
   */
  updateUsersProject: async (idProject: string, users: string): Promise<void> => {
    const usersParam = !users || users.length === 0 ? '000' : users;
    await httpClient.get(
      `${API_CONFIG.baseProjectsUrl}update-users-project/${idProject}/${usersParam}`
    );
  },
};