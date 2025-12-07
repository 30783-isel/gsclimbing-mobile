// src/types/turbine.types.ts

import type { Project } from './project.types';
import type { Report } from './report.types';

/**
 * Interface da turbina
 */
export interface Turbine {
  idTurbine: number;  // ID numérico usado no backend
  id: string;         // ID string para compatibilidade
  name: string;
  model?: string;     // Modelo da turbina
  power?: string;     // Potência da turbina
  site?: string;
  number?: string;
  type?: string;
  year?: string;
  
  // Flags de relatórios disponíveis
  defectsInspectionReport: boolean;
  examinationTransformer: boolean;
  measurements6KV: boolean;
  measurements690V400V: boolean;
  measurementsMwSwitchgear: boolean;
  onboardCraneInspectionReport: boolean;
  performanceReportRepairElevator: boolean;
  statutoryInspectionReport: boolean;
  
  // Relações
  project?: Project;
  listReports?: Report[];
}

/**
 * Dados para criar turbina
 */
export interface CreateTurbineDTO {
  name: string;
  projectId: string;
  model?: string;
  power?: string;
  site?: string;
  number?: string;
  type?: string;
  year?: string;
}

/**
 * Dados para atualizar turbina
 */
export interface UpdateTurbineDTO {
  name?: string;
  model?: string;
  power?: string;
  site?: string;
  number?: string;
  type?: string;
  year?: string;
  defectsInspectionReport?: boolean;
  examinationTransformer?: boolean;
  measurements6KV?: boolean;
  measurements690V400V?: boolean;
  measurementsMwSwitchgear?: boolean;
  onboardCraneInspectionReport?: boolean;
  performanceReportRepairElevator?: boolean;
  statutoryInspectionReport?: boolean;
}

/**
 * Filtros de pesquisa de turbinas
 */
export interface TurbineFilters {
  name?: string;
  model?: string;
  site?: string;
  number?: string;
  type?: string;
  projectId?: string;
}
