/**
 * Types para Performance Report Repair Elevator
 */

export interface PerformanceRepairElevatorData {
  // Página 1: Dados Fundamentais
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  inspectors: string; // Inspectors/Workers
  projectoId: number;
  turbinaId: number;
  
  // Página 2: Statement of Work
  workCompleted: 'yes' | 'no' | '';
  windturbineOperable: 'yes' | 'no' | 'limited' | '';
  
  // Página 3: Performance Report
  performanceReport: string; // Campo de texto livre
  
  // Página 4: Fotos
  photos: PhotoData[];
  
  // Página 5: Additional Fields
  additionalFields: AdditionalField[];
}

export interface PhotoData {
  id: string;
  uri: string;
  base64?: string;
  description: string;
  pageNumber: number;
  position: number;
  timestamp: number;
  isUploaded: boolean;
  fileId?: string;
}

export interface AdditionalField {
  label: string;
  value: string;
}

export interface PerformanceRepairElevatorDTO {
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  inspectors: string;
  workCompleted: string;
  windturbineOperable: string;
  performanceReport: string;
  projectoId: number;
  turbinaId: number;
  userId?: string;
  photoFileIds: string[];
  additionalField1?: { label: string; value: string };
  additionalField2?: { label: string; value: string };
  additionalField3?: { label: string; value: string };
}

export interface PerformanceRepairElevatorResponse {
  reportId: number;
  uuid: string;
  createDate: string;
  site: string;
  wtgNumber: string;
  message: string;
  success: boolean;
}