import type { User } from './user.types';
import type { Turbine } from './turbine.types';

/**
 * Interface do projeto
 */
export interface Project {
  idProject: string;
  name: string;
  country: string;
  location: string;
  numberTurbines: string;
  site: string;
  number: string;
  type: string;
  users?: User[];
  turbines?: Turbine[];
}

/**
 * Dados para criar projeto
 */
export interface CreateProjectDTO {
  name: string;
  country: string;
  location: string;
  numberTurbines: string;
  site: string;
  number: string;
  type: string;
}

/**
 * Dados para atualizar projeto
 */
export interface UpdateProjectDTO {
  name?: string;
  country?: string;
  location?: string;
  numberTurbines?: string;
  site?: string;
  number?: string;
  type?: string;
}

/**
 * Filtros de pesquisa de projetos
 */
export interface ProjectFilters {
  name?: string;
  country?: string;
  location?: string;
  site?: string;
}