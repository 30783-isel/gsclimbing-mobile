import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Text,
  IconButton,
  Card,
  Chip,
  Surface,
  Menu,
  Divider,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

export default function DefectInspectionReportsListScreen() {
  const { turbineId, turbineName, projectName } = useLocalSearchParams<{
    turbineId: string;
    turbineName: string;
    projectName: string;
  }>();
  const router = useRouter();

  // State
  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

  /**
   * Carregar relatórios ao montar componente
   */
  useEffect(() => {
    loadReports();
  }, [turbineId]);

  /**
   * Carregar relatórios da turbina
   */
  const loadReports = async () => {
    if (!turbineId) return;

    try {
      setIsLoading(true);
      console.log(`📋 Carregando relatórios da turbina ${turbineId}...`);

      const data = await defectInspectionReportAPI.getByTurbineId(
        parseInt(turbineId)
      );
      setReports(data);

      console.log(`✅ ${data.length} relatórios carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navegar para detalhes do relatório
   */
  const handleReportPress = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/admin/reports/defect-inspection/edit' as any,
      params: {
        reportId: reportId.toString(),
        turbineName: turbineName || 'Turbina',
        projectName: projectName || 'Projeto',
      },
    });
  };

  /**
   * Voltar atrás
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Toggle menu de opções
   */
  const toggleMenu = (reportId: number) => {
    setMenuVisible((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  /**
   * Eliminar relatório
   */
  const handleDeleteReport = async (reportId: number) => {
    Alert.alert(
      'Eliminar Relatório',
      'Tem a certeza que deseja eliminar este relatório? Esta ação não pode ser revertida.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Eliminando relatório ${reportId}...`);
              
              await defectInspectionReportAPI.delete(reportId);
              
              // Remover da lista local
              setReports((prev) => prev.filter((r) => r.reportId !== reportId));
              
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
              console.log('✅ Relatório eliminado');
            } catch (error) {
              console.error('❌ Erro ao eliminar relatório:', error);
              Alert.alert('Erro', 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };

  /**
   * Formatar data
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Renderizar item da lista
   */
  const renderReportItem = (item: DefectInspectionReportResponse) => (
    <Card key={item.reportId} style={styles.card} mode="elevated">
      <TouchableOpacity
        onPress={() => handleReportPress(item.reportId)}
        activeOpacity={0.7}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.reportTitle}>
                {item.site} - {item.wtgNumber}
              </Text>
              <Text variant="bodySmall" style={styles.reportDate}>
                {formatDate(item.createDate)}
              </Text>
            </View>
            
            {/* Menu de opções */}
            <Menu
              visible={menuVisible[item.reportId] || false}
              onDismiss={() => toggleMenu(item.reportId)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={24}
                  iconColor={colors.text}
                  onPress={() => toggleMenu(item.reportId)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleReportPress(item.reportId);
                }}
                leadingIcon="pencil"
                title="Editar"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleDeleteReport(item.reportId);
                }}
                leadingIcon="delete"
                title="Eliminar"
                titleStyle={{ color: colors.error }}
              />
            </Menu>
          </View>

          <View style={styles.chipContainer}>
            <Chip icon="turbine" compact style={styles.chip}>
              {item.wtgType}
            </Chip>
            <Chip icon="calendar" compact style={styles.chip}>
              {item.yearConstruction}
            </Chip>
            <Chip icon="image-multiple" compact style={styles.chip}>
              {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
            </Chip>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatórios...</Text>
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
          onPress={handleBack}
        />
        <View style={styles.headerCenter}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Defect Inspection Reports
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {turbineName} - {projectName}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Lista de relatórios */}
      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconButton
            icon="file-document-outline"
            size={64}
            iconColor={colors.lightGray}
          />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            Sem relatórios
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Ainda não existem relatórios Defect Inspection para esta turbina.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {reports.map((report) => renderReportItem(report))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  reportTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs / 2,
  },
  reportDate: {
    color: colors.textSecondary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    marginRight: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});