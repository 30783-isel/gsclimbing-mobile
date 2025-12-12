// src/types/history.types.ts

/**
 * Tipos de ações no histórico
 */
export enum HistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SUBMIT = 'SUBMIT',
  LOCK = 'LOCK',
  REQUEST_UNLOCK = 'REQUEST_UNLOCK',
  UNLOCK = 'UNLOCK',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DELETE = 'DELETE',
}

/**
 * Entrada de histórico
 */
export interface HistoryEntry {
  id: number;
  changedBy: string;
  changedAt: string; // ISO 8601 datetime
  action: HistoryAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
}

/**
 * Configuração visual para cada tipo de ação
 */
export interface ActionConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Mapa de configurações de ações
 */
export const ACTION_CONFIGS: Record<HistoryAction, ActionConfig> = {
  [HistoryAction.CREATE]: {
    label: 'Relatório criado',
    icon: 'plus-circle',
    color: '#4CAF50',
  },
  [HistoryAction.UPDATE]: {
    label: 'Relatório editado',
    icon: 'pencil',
    color: '#2196F3',
  },
  [HistoryAction.SUBMIT]: {
    label: 'Relatório submetido',
    icon: 'send',
    color: '#FF9800',
  },
  [HistoryAction.LOCK]: {
    label: 'Relatório bloqueado',
    icon: 'lock',
    color: '#F44336',
  },
  [HistoryAction.REQUEST_UNLOCK]: {
    label: 'Pedido de desbloqueio',
    icon: 'lock-open-variant',
    color: '#9C27B0',
  },
  [HistoryAction.UNLOCK]: {
    label: 'Relatório desbloqueado',
    icon: 'lock-open',
    color: '#00BCD4',
  },
  [HistoryAction.APPROVE]: {
    label: 'Relatório aprovado',
    icon: 'check-circle',
    color: '#4CAF50',
  },
  [HistoryAction.REJECT]: {
    label: 'Relatório rejeitado',
    icon: 'close-circle',
    color: '#F44336',
  },
  [HistoryAction.DELETE]: {
    label: 'Relatório eliminado',
    icon: 'delete',
    color: '#9E9E9E',
  },
};

/**
 * Tradução de nomes de campos técnicos
 */
export const FIELD_TRANSLATIONS: Record<string, string> = {
  site: 'Site/Lugar',
  wtgNumber: 'Número WTG',
  wtgType: 'Tipo WTG',
  yearConstruction: 'Ano de Construção',
  dateInspection: 'Data de Inspeção',
  inspectedBy: 'Inspecionado por',
  observations: 'Observações',
  photo_added: 'Foto adicionada',
  photo_removed: 'Foto removida',
  additionalField1Label: 'Campo Adicional 1 - Nome',
  additionalField1Text: 'Campo Adicional 1 - Valor',
  additionalField2Label: 'Campo Adicional 2 - Nome',
  additionalField2Text: 'Campo Adicional 2 - Valor',
  additionalField3Label: 'Campo Adicional 3 - Nome',
  additionalField3Text: 'Campo Adicional 3 - Valor',
  additionalField4Label: 'Campo Adicional 4 - Nome',
  additionalField4Text: 'Campo Adicional 4 - Valor',
  additionalField5Label: 'Campo Adicional 5 - Nome',
  additionalField5Text: 'Campo Adicional 5 - Valor',
  additionalField6Label: 'Campo Adicional 6 - Nome',
  additionalField6Text: 'Campo Adicional 6 - Valor',
  additionalField7Label: 'Campo Adicional 7 - Nome',
  additionalField7Text: 'Campo Adicional 7 - Valor',
};

/**
 * Traduz nome técnico de campo para nome legível
 */
export function translateFieldName(fieldName: string): string {
  return FIELD_TRANSLATIONS[fieldName] || fieldName;
}

/**
 * Obtém configuração visual para uma ação
 */
export function getActionConfig(action: HistoryAction): ActionConfig {
  return ACTION_CONFIGS[action] || {
    label: action,
    icon: 'help-circle',
    color: '#9E9E9E',
  };
}
