import { useCallback } from 'react';
import { useReportStore } from '@/store/reportStore';
import { reportsAPI } from '@/services/api/reports.api';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system';
import type { CreateReportDTO, ReportPhoto } from '@/types/report.types';

/**
 * Hook customizado para gestão de relatórios
 * Centraliza toda a lógica de criação, upload e gestão de relatórios
 */
export const useReports = () => {
  const {
    reports,
    selectedReport,
    isLoading,
    setReports,
    setSelectedReport,
    addReport,
    updateReport,
    removeReport,
    setLoading,
  } = useReportStore();

  /**
   * Criar novo relatório
   * @param reportData - Dados do relatório a criar
   * @returns Relatório criado
   */
  const createReport = useCallback(
    async (reportData: CreateReportDTO) => {
      try {
        setLoading(true);
        
        console.log('📝 Criando relatório...', reportData);
        const newReport = await reportsAPI.create(reportData);
        
        addReport(newReport);

        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: 'Relatório criado com sucesso',
          position: 'top',
        });

        console.log('✅ Relatório criado:', newReport.reportId);
        return newReport;
      } catch (err: any) {
        console.error('❌ Erro ao criar relatório:', err);
        const message = err.response?.data?.message || 'Erro ao criar relatório';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addReport, setLoading]
  );

  /**
   * Upload de uma única foto
   * @param reportId - ID do relatório
   * @param photo - Dados da foto
   * @returns True se sucesso
   */
  const uploadPhoto = useCallback(async (reportId: string, photo: ReportPhoto) => {
    try {
      console.log(`📸 Fazendo upload da foto ${photo.filename}...`);

      // Criar FormData
      const formData = new FormData();
      
      // Anexar ficheiro
      // @ts-ignore - React Native FormData aceita este formato
      formData.append('file', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.filename,
      });

      // Upload
      await reportsAPI.uploadPhoto(reportId, formData);

      console.log(`✅ Foto ${photo.filename} carregada com sucesso`);
      return true;
    } catch (err: any) {
      console.error(`❌ Erro ao fazer upload da foto ${photo.filename}:`, err);
      const message = err.response?.data?.message || 'Erro ao fazer upload da foto';
      
      Toast.show({
        type: 'error',
        text1: 'Erro no upload',
        text2: `${photo.filename}: ${message}`,
        position: 'top',
      });
      
      throw err;
    }
  }, []);

  /**
   * Upload de múltiplas fotos
   * Faz upload sequencial de todas as fotos
   * @param reportId - ID do relatório
   * @param photos - Array de fotos
   * @returns Array com resultados de cada upload
   */
  const uploadPhotos = useCallback(
    async (reportId: string, photos: ReportPhoto[]) => {
      console.log(`📸 Iniciando upload de ${photos.length} fotos...`);
      
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        try {
          // Mostrar progresso
          Toast.show({
            type: 'info',
            text1: 'Upload',
            text2: `Foto ${i + 1} de ${photos.length}...`,
            position: 'top',
            visibilityTime: 1000,
          });

          await uploadPhoto(reportId, photo);
          
          results.push({ 
            photo, 
            success: true 
          });
          successCount++;
          
        } catch (error) {
          results.push({ 
            photo, 
            success: false, 
            error 
          });
          failCount++;
        }
      }

      // Mostrar resultado final
      if (failCount === 0) {
        Toast.show({
          type: 'success',
          text1: 'Upload completo',
          text2: `${successCount} fotos carregadas com sucesso`,
          position: 'top',
        });
      } else if (successCount === 0) {
        Toast.show({
          type: 'error',
          text1: 'Upload falhou',
          text2: `Não foi possível carregar nenhuma foto`,
          position: 'top',
        });
      } else {
        Toast.show({
          type: 'warning',
          text1: 'Upload parcial',
          text2: `${successCount} fotos OK, ${failCount} falharam`,
          position: 'top',
        });
      }

      console.log(`📊 Upload concluído: ${successCount} sucesso, ${failCount} falhas`);
      return results;
    },
    [uploadPhoto]
  );

  /**
   * Carregar relatórios de uma turbina
   * @param turbineId - ID da turbina
   * @returns Lista de relatórios
   */
  const loadReportsByTurbine = useCallback(
    async (turbineId: string) => {
      try {
        setLoading(true);
        console.log(`📋 Carregando relatórios da turbina ${turbineId}...`);
        
        const data = await reportsAPI.getByTurbineId(turbineId);
        setReports(data);
        
        console.log(`✅ ${data.length} relatórios carregados`);
        return data;
      } catch (err: any) {
        console.error('❌ Erro ao carregar relatórios:', err);
        const message = err.response?.data?.message || 'Erro ao carregar relatórios';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setReports, setLoading]
  );

  /**
   * Carregar relatórios de um projeto
   * @param projectId - ID do projeto
   * @returns Lista de relatórios
   */
  const loadReportsByProject = useCallback(
    async (projectId: string) => {
      try {
        setLoading(true);
        console.log(`📋 Carregando relatórios do projeto ${projectId}...`);
        
        const data = await reportsAPI.getByProjectId(projectId);
        setReports(data);
        
        console.log(`✅ ${data.length} relatórios carregados`);
        return data;
      } catch (err: any) {
        console.error('❌ Erro ao carregar relatórios:', err);
        const message = err.response?.data?.message || 'Erro ao carregar relatórios';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setReports, setLoading]
  );

  /**
   * Carregar relatório por ID
   * @param id - ID do relatório
   * @returns Dados do relatório
   */
  const loadReportById = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        console.log(`📄 Carregando relatório ${id}...`);
        
        const data = await reportsAPI.getById(id);
        setSelectedReport(data);
        
        console.log(`✅ Relatório carregado`);
        return data;
      } catch (err: any) {
        console.error('❌ Erro ao carregar relatório:', err);
        const message = err.response?.data?.message || 'Erro ao carregar relatório';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setSelectedReport, setLoading]
  );

  /**
   * Eliminar relatório
   * @param id - ID do relatório
   */
  const deleteReport = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        console.log(`🗑️ Eliminando relatório ${id}...`);
        
        await reportsAPI.delete(id);
        removeReport(id);

        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: 'Relatório eliminado',
          position: 'top',
        });

        console.log(`✅ Relatório eliminado`);
      } catch (err: any) {
        console.error('❌ Erro ao eliminar relatório:', err);
        const message = err.response?.data?.message || 'Erro ao eliminar relatório';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeReport, setLoading]
  );

  /**
   * Toggle lock/unlock de relatório
   * @param reportId - ID do relatório
   */
  const toggleReportLock = useCallback(
    async (reportId: string) => {
      try {
        setLoading(true);
        console.log(`🔒 Toggle lock do relatório ${reportId}...`);
        
        const updated = await reportsAPI.toggleLock(reportId);
        updateReport(reportId, updated);

        const lockStatus = updated.locked === 'true' ? 'bloqueado' : 'desbloqueado';
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: `Relatório ${lockStatus}`,
          position: 'top',
        });

        console.log(`✅ Relatório ${lockStatus}`);
        return updated;
      } catch (err: any) {
        console.error('❌ Erro ao alterar lock:', err);
        const message = err.response?.data?.message || 'Erro ao alterar lock';
        
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message,
          position: 'top',
        });
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateReport, setLoading]
  );

  return {
    // State
    reports,
    selectedReport,
    isLoading,

    // Actions
    createReport,
    uploadPhoto,
    uploadPhotos,
    loadReportsByTurbine,
    loadReportsByProject,
    loadReportById,
    deleteReport,
    toggleReportLock,
  };
};