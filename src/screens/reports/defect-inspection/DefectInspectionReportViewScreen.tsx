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
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import { reportPhotosAPI, type ReportPhotoData } from '@/services/api/reportPhotos.api';
import type { DefectInspectionReportResponse } from '@/reports/defectInspectionReport/defectInspectionReport.types';
import { PhotoGallery } from '@/components/PhotoGallery';
import Toast from 'react-native-toast-message';

export default function DefectInspectionReportViewScreen() {
  const router = useRouter();
  const { reportId, turbineName, projectName } = useLocalSearchParams<{
    reportId: string;
    turbineName: string;
    projectName: string;
  }>();

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

  const handleBack = () => {
    router.back();
  };

  // ✅ NOVA FUNÇÃO: Navegar para edição
  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
      params: {
        reportId: reportId.toString(),
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatório...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <IconButton
          icon="alert-circle-outline"
          size={64}
          iconColor={colors.error}
        />
        <Text variant="titleMedium" style={styles.errorTitle}>
          Relatório não encontrado
        </Text>
        <Text variant="bodyMedium" style={styles.errorText}>
          Não foi possível carregar os detalhes do relatório.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com Botão de Editar */}
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.white}
          onPress={handleBack}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Relatório #{report.reportId}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbineName} - {projectName}
          </Text>
        </View>
        {/* ✅ BOTÃO DE EDITAR */}
        <IconButton
          icon="pencil"
          size={24}
          iconColor={colors.white}
          onPress={handleEdit}
        />
      </Surface>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Informações Gerais */}
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Informações Gerais"
            left={(props) => (
              <IconButton
                {...props}
                icon="information-outline"
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
                  {report.numberPictures} {report.numberPictures === 1 ? 'Foto' : 'Fotos'}
                </Chip>
              </View>
              <View style={styles.statItem}>
                <Chip 
                  icon="turbine" 
                  mode="outlined"
                  style={styles.statChip}
                >
                  Turbina #{report.turbinaId}
                </Chip>
              </View>
              <View style={styles.statItem}>
                <Chip 
                  icon="folder" 
                  mode="outlined"
                  style={styles.statChip}
                >
                  Projeto #{report.projectoId}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Fotografias */}
        {isLoadingPhotos ? (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.loadingPhotosContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingPhotosText}>
                  A carregar fotografias...
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : photos.length > 0 ? (
          <Card style={styles.card} mode="elevated">
            <Card.Title
              title="Fotografias"
              subtitle={`${photos.length} ${photos.length === 1 ? 'fotografia' : 'fotografias'}`}
              left={(props) => (
                <IconButton
                  {...props}
                  icon="image-multiple-outline"
                  iconColor={colors.primary}
                />
              )}
            />
            <Card.Content>
              <PhotoGallery photos={photos} />
            </Card.Content>
          </Card>
        ) : report.numberPictures > 0 ? (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.noPhotosContainer}>
                <IconButton
                  icon="alert-circle-outline"
                  size={48}
                  iconColor={colors.warning}
                />
                <Text variant="bodyMedium" style={styles.noPhotosText}>
                  Erro ao carregar fotografias
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {/* Espaço no final */}
        <View style={styles.bottomSpacer} />
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
    marginTop: spacing.md,
    color: colors.error,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  infoValue: {
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  infoValueSmall: {
    color: colors.textSecondary,
    flex: 2,
    textAlign: 'right',
    fontSize: 11,
  },
  divider: {
    marginVertical: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    minWidth: '30%',
  },
  statChip: {
    marginBottom: spacing.xs,
  },
  loadingPhotosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingPhotosText: {
    marginLeft: spacing.md,
    color: colors.textSecondary,
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noPhotosText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});