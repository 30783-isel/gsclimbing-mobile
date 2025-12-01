import type { Turbine } from './turbine.types';

/**
 * Tipos de relatórios
 */
export enum ReportType {
  DEFECT_INSPECTION = 0,
  EXAMINATION_TRANSFORMER = 1,
  MEASUREMENTS_MV_SWITCHGEAR = 2,
  MEASUREMENTS_6KV = 3,
  MEASUREMENTS_690V400V = 4,
  ONBOARD_CRANE = 5,
  PERFORMANCE_REPAIR_ELEVATOR = 6,
  STATUTORY_INSPECTION = 7,
}

/**
 * Nomes dos tipos de relatórios
 */
export const REPORT_TYPE_NAMES: Record<ReportType, string> = {
  [ReportType.DEFECT_INSPECTION]: 'Defect Inspection Report',
  [ReportType.EXAMINATION_TRANSFORMER]: 'Examination Transformer',
  [ReportType.MEASUREMENTS_MV_SWITCHGEAR]: 'Measurements MW Switchgear',
  [ReportType.MEASUREMENTS_6KV]: 'Measurements 6KV',
  [ReportType.MEASUREMENTS_690V400V]: 'Measurements 690V/400V',
  [ReportType.ONBOARD_CRANE]: 'Onboard Crane Inspection Report',
  [ReportType.PERFORMANCE_REPAIR_ELEVATOR]: 'Performance Report Repair Elevator',
  [ReportType.STATUTORY_INSPECTION]: 'Statutory Inspection Report',
};

/**
 * Interface do relatório
 */
export interface Report {
  reportId: number;
  uuid: string;
  userId: string;
  createDate: string;
  modifiedDate: string;
  locked: string;
  permission2Edit: string;
  site: string;
  wtgNumber: string;
  projectoId: number;
  turbinaId: number;
  typeReport: ReportType;
  turbine?: Turbine;
  
  // Campos offline
  isOffline?: boolean;
  isSynced?: boolean;
  lastSyncDate?: string;
}

/**
 * Dados para criar relatório
 */
export interface CreateReportDTO {
  userId: string;
  site: string;
  wtgNumber: string;
  projectoId: number;
  turbinaId: number;
  typeReport: ReportType;
}

/**
 * Photo do relatório
 */
export interface ReportPhoto {
  id: string;
  reportId: string;
  uri: string;
  base64?: string;
  filename: string;
  type: string;
  size: number;
  timestamp: number;
  uploadDate?: string;
  isUploaded: boolean;
  isOffline?: boolean;
}

/**
 * Estado de upload
 */
export interface UploadProgress {
  photoId: string;
  progress: number;
  isUploading: boolean;
  error?: string;
}