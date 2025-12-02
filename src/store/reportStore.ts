import { create } from 'zustand';
import type { Report } from '@/types/report.types';

/**
 * Interface do estado de relatórios
 */
interface ReportState {
  // State
  reports: Report[];
  selectedReport: Report | null;
  isLoading: boolean;

  // Actions
  setReports: (reports: Report[]) => void;
  setSelectedReport: (report: Report | null) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  removeReport: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

/**
 * Store Zustand de Relatórios
 * Gestão de estado global dos relatórios de inspeção
 */
export const useReportStore = create<ReportState>((set) => ({
  // Estado inicial
  reports: [],
  selectedReport: null,
  isLoading: false,

  /**
   * Definir lista completa de relatórios
   */
  setReports: (reports) => set({ reports }),

  /**
   * Definir relatório selecionado
   */
  setSelectedReport: (selectedReport) => set({ selectedReport }),

  /**
   * Adicionar novo relatório à lista
   * Adiciona no início (mais recente primeiro)
   */
  addReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
    })),

  /**
   * Atualizar relatório existente
   * Atualiza tanto na lista como no selecionado se for o mesmo
   */
  updateReport: (id, updatedReport) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.reportId.toString() === id ? { ...r, ...updatedReport } : r
      ),
      selectedReport:
        state.selectedReport?.reportId.toString() === id
          ? { ...state.selectedReport, ...updatedReport }
          : state.selectedReport,
    })),

  /**
   * Remover relatório da lista
   * Remove também do selecionado se for o mesmo
   */
  removeReport: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.reportId.toString() !== id),
      selectedReport:
        state.selectedReport?.reportId.toString() === id
          ? null
          : state.selectedReport,
    })),

  /**
   * Definir estado de loading
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Reset completo do estado
   * Útil ao fazer logout
   */
  reset: () =>
    set({
      reports: [],
      selectedReport: null,
      isLoading: false,
    }),
}));