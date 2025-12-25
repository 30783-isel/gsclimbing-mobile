/**
 * Types para Defect Inspection Report
 */

export interface DefectInspectionReportData {
  // Informações gerais (Página 1)
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  projectoId: number;
  turbinaId: number;
  
  // Fotos (Páginas 2-3)
  photos: PhotoData[];
  
  // Campos adicionais (Página 4)
  additionalFields: AdditionalField[];
}

export interface PhotoData {
  id: string;
  uri: string;
  pageNumber: number;
  position: number;
  timestamp: number;
  isUploaded: boolean;
  fileId?: string;
  description: string;
  fileId?: string; // ID retornado pelo backend após upload
  replacedFileId?: string;
}

export interface AdditionalField {
  label: string;
  value: string;
}

export interface DefectInspectionReportFormData {
  // Step 1: General Info
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  
  // Step 2-3: Photos (8 total)
  photos: PhotoData[];
  
  // Step 4: Additional Fields (7 max)
  additionalFields: AdditionalField[];
  
  // Metadata
  projectoId?: number;
  turbinaId?: number;
  currentStep: number;
  totalSteps: number;
}

export interface DefectInspectionReportDTO {
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  projectoId: number;
  turbinaId: number;
  userId?: string;
  photoFileIds: string[]; // IDs das fotos já carregadas
  additionalField1?: { label: string; value: string };
  additionalField2?: { label: string; value: string };
  additionalField3?: { label: string; value: string };
  additionalField4?: { label: string; value: string };
  additionalField5?: { label: string; value: string };
  additionalField6?: { label: string; value: string };
  additionalField7?: { label: string; value: string };
}

export interface DefectInspectionReportResponse {
  reportId: number;
  uuid: string;
  createDate: string;
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  projectoId: number;
  turbinaId: number;
  numberPictures: number;
  message: string;
  success: boolean;
}

export interface PhotoUploadProgress {
  photoId: string;
  progress: number;
  isUploading: boolean;
  error?: string;
}
