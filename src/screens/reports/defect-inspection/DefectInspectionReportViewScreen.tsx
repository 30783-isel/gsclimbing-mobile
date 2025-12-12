/**
 * DefectInspectionReportViewScreen
 * ✅ COM HISTÓRICO INTEGRADO
 * 
 * Features:
 * - Visualização completa do relatório
 * - Botão de histórico no header ✨
 * - Card de histórico rápido ✨
 * - Galeria de fotos
 * - Estatísticas
 * - Navegação para edição
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Chip,
  Surface,
  Divider,
  Button,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { reportPhotosAPI, type ReportPhotoData } from '@/services/api/reportPhotos.api';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';
import { PhotoGallery } from '@/components/PhotoGallery';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';

export default function DefectInspectionReportViewScreen() {
  const router = useRouter();
  const { reportId, turbineName, projectName } = useLocalSearchParams<{
    reportId: string;
    turbineName?: string;
    projectName?: string;
  }>();
  const { role: userRole } = useAuthStore();

  const [report, setReport] = useState<DefectInspectionReportResponse | null>(null);
  const [photos, setPhotos] = useState<ReportPhotoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      console.log('📄 Carregando relatório:', reportId);

      const data = await defectInspectionReportAPI.getById(Number(reportId));
      setReport(data);
      
      console.log('✅ Relatório carregado');

      // Carregar fotos se existirem
      if (data.numberPictures > 0) {
        loadPhotos(Number(reportId));
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar relatório:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.response?.data?.message || 'Erro ao carregar relatório',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotos = async (reportId: number) => {
    try {
      setIsLoadingPhotos(true);
      console.log('📸 Carregando fotografias do relatório:', reportId);

      const photoData = await reportPhotosAPI.getPhotos(reportId);
      setPhotos(photoData);

      console.log(`✅ ${photoData.length} fotografias carregadas`);
    } catch (error: any) {
      console.error('❌ Erro ao carregar fotografias:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Erro ao carregar fotografias',
      });
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header} elevation={2}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.white}
            onPress={() => router.back()}
          />
          <View style={styles.headerCenter}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Relatório #{reportId}
            </Text>
          </View>
          <View style={{ width: 48 }} />
        </Surface>

        {/* Loading */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>A carregar relatório...</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={colors.white}
            onPress={() => router.back()}
          />
          <View style={styles.headerCenter}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Erro
            </Text>
          </View>
          <View style={{ width: 48 }} />
        </Surface>

        <View style={styles.errorContainer}>
          <IconButton icon="alert-circle" size={64} iconColor={colors.error} />
          <Text variant="titleMedium" style={styles.errorTitle}>
            Relatório não encontrado
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
            Voltar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.white}
          onPress={() => router.back()}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Relatório #{reportId}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {report.site} - {report.wtgNumber}
          </Text>
        </View>
        
        {/* ✅ NOVO: Botão de Histórico */}
        <IconButton
          icon="history"
          size={24}
          iconColor={colors.white}
          onPress={() => {
            router.push({
              pathname: `/(tabs)/${userRole.toLowerCase()}/reports/defect-inspection/${reportId}/history` as any,
              params: {
                reportId: reportId.toString(),
                reportTitle: `#${reportId} - ${report.wtgNumber}`,
              },
            });
          }}
        />
      </Surface>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {/* Informações Gerais */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Informações Gerais"
            left={(props) => (
              <IconButton
                {...props}
                icon="information"
                iconColor={colors.primary}
              />
            )}
          />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                Site:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {report.site}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                WTG Number:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {report.wtgNumber}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                WTG Type:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {report.wtgType}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                Ano de Construção:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {report.yearConstruction}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                UUID:
              </Text>
              <Text variant="bodySmall" style={styles.infoValueSmall}>
                {report.uuid}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>
                Data de Criação:
              </Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {formatDate(report.createDate)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* ✅ NOVO: Card de Histórico Rápido */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Histórico de Alterações"
            left={(props) => (
              <IconButton
                {...props}
                icon="history"
                iconColor={colors.primary}
              />
            )}
            right={(props) => (
              <IconButton
                {...props}
                icon="arrow-right"
                onPress={() => {
                  router.push({
                    pathname: `/(tabs)/${userRole.toLowerCase()}/reports/defect-inspection/${reportId}/history` as any,
                    params: {
                      reportId: reportId.toString(),
                      reportTitle: `#${reportId} - ${report.wtgNumber}`,
                    },
                  });
                }}
              />
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.historyText}>
              Ver todas as alterações efetuadas neste relatório
            </Text>
            <Button
              mode="outlined"
              icon="history"
              onPress={() => {
                router.push({
                  pathname: `/(tabs)/${userRole.toLowerCase()}/reports/defect-inspection/${reportId}/history` as any,
                  params: {
                    reportId: reportId.toString(),
                    reportTitle: `#${reportId} - ${report.wtgNumber}`,
                  },
                });
              }}
              style={styles.historyButton}
            >
              Ver Histórico Completo
            </Button>
          </Card.Content>
        </Card>

        {/* Estatísticas */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Estatísticas"
            left={(props) => (
              <IconButton
                {...props}
                icon="chart-bar"
                iconColor={colors.primary}
              />
            )}
          />
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Chip 
                  icon="image-multiple" 
                  mode="outlined"
                  style={styles.statChip}
                >
                  {report.numberPictures} {report.numberPictures === 1 ? 'foto' : 'fotos'}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Fotografias */}
        {photos.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Title
              title="Fotografias"
              left={(props) => (
                <IconButton
                  {...props}
                  icon="camera"
                  iconColor={colors.primary}
                />
              )}
            />
            <Card.Content>
              {isLoadingPhotos ? (
                <View style={styles.photosLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.photosLoadingText}>
                    A carregar fotografias...
                  </Text>
                </View>
              ) : (
                <PhotoGallery photos={photos} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Botão de Editar */}
        <View style={styles.actionButtonsContainer}>
          <Button
            mode="contained"
            icon="pencil"
            onPress={() => {
              router.push({
                pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
                params: {
                  reportId: reportId.toString(),
                },
              });
            }}
            style={styles.editButton}
          >
            Editar Relatório
          </Button>
        </View>

        {/* Espaçamento no final */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  infoValueSmall: {
    color: colors.text,
    flex: 2,
    textAlign: 'right',
    fontSize: 11,
  },
  divider: {
    marginVertical: spacing.md,
  },
  historyText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  historyButton: {
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  statChip: {
    backgroundColor: colors.surface,
  },
  photosLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  photosLoadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  actionButtonsContainer: {
    margin: spacing.md,
  },
  editButton: {
    marginTop: spacing.md,
  },
});