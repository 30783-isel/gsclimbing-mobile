// app/(tabs)/tech/reports.tsx - LISTA DE RELATÓRIOS DO TÉCNICO

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  IconButton,
  Surface,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/theme';
import { defectInspectionReportAPI } from '@/services/api/defectInspectionReport.api';
import type { DefectInspectionReportResponse } from '@/types/defectInspectionReport.types';

export default function TechReportsScreen() {
  const router = useRouter();

  const [reports, setReports] = useState<DefectInspectionReportResponse[]>([]);
  const [filteredReports, setFilteredReports] = useState<DefectInspectionReportResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

  // Carregar relatórios ao montar componente
  useEffect(() => {
    loadAllReports();
  }, []);

  // Filtrar relatórios quando muda a query
  useEffect(() => {
    let filtered = reports;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.wtgNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.wtgType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.site?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchQuery]);

  /**
   * Carregar todos os relatórios (aqui podes filtrar por técnico se necessário)
   */
  const loadAllReports = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando relatórios...');

      // TODO: Implementar endpoint que retorna todos os relatórios do técnico
      // Por enquanto, vamos buscar de todas as turbinas (exemplo)
      // Na prática, o backend deveria ter um endpoint: /api/reports/mobile/defect-inspection/my-reports

      // Por enquanto deixo vazio - podes adicionar lógica específica
      const allReports: DefectInspectionReportResponse[] = [];
      
      setReports(allReports);
      console.log(`✅ ${allReports.length} relatórios carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllReports();
    setRefreshing(false);
  };

  /**
   * Voltar para projetos
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Ver detalhes do relatório
   */
  const handleReportPress = (reportId: number) => {
    router.push({
      pathname: '/(tabs)/tech/reports/view',
      params: { reportId: reportId.toString() },
    });
  };

  /**
   * Toggle menu
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
      'Tem a certeza que deseja eliminar este relatório?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await defectInspectionReportAPI.delete(reportId);
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
              loadAllReports();
            } catch (error) {
              console.error('❌ Erro ao eliminar:', error);
              Alert.alert('Erro', 'Não foi possível eliminar o relatório');
            }
          },
        },
      ]
    );
  };

  /**
   * Renderizar card do relatório
   */
  const renderReportCard = ({ item }: { item: DefectInspectionReportResponse }) => (
    <Card style={styles.reportCard}>
      <TouchableOpacity onPress={() => handleReportPress(item.reportId)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text variant="titleMedium" style={styles.reportTitle}>
                {item.wtgType || 'N/A'}
              </Text>
              <Text variant="bodySmall" style={styles.reportSubtitle}>
                WTG {item.wtgNumber} - {item.site}
              </Text>
              <Text variant="bodySmall" style={styles.reportDate}>
                {new Date(item.createDate).toLocaleDateString('pt-PT')}
              </Text>
            </View>

            {/* Menu de opções */}
            <Menu
              visible={menuVisible[item.reportId] || false}
              onDismiss={() => toggleMenu(item.reportId)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(item.reportId)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleReportPress(item.reportId);
                }}
                leadingIcon="eye"
                title="Ver"
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

          <View style={styles.chipsContainer}>
            <Chip icon="calendar" compact style={styles.chip}>
              <Text variant="bodySmall" style={styles.chipText}>
                {item.yearConstruction}
              </Text>
            </Chip>
            <Chip icon="image-multiple" compact style={styles.chip}>
              <Text variant="bodySmall" style={styles.chipText}>
                {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
              </Text>
            </Chip>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  /**
   * Renderizar estado vazio
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconButton icon="file-document-outline" size={64} iconColor={colors.lightGray} />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Sem relatórios
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Ainda não criaste nenhum relatório.
      </Text>
    </View>
  );

  /**
   * Renderizar header
   */
  const renderHeader = () => (
    <View>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.primary}
          onPress={handleBack}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Meus Relatórios
        </Text>
        <View style={{ width: 48 }} />
      </Surface>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Pesquisar relatórios..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {reports.length}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Total
          </Text>
        </View>

        <View style={styles.statBox}>
          <Text variant="headlineSmall" style={styles.statNumber}>
            {reports.reduce((acc, r) => acc + r.numberPictures, 0)}
          </Text>
          <Text variant="bodySmall" style={styles.statLabel}>
            Fotos
          </Text>
        </View>
      </View>
    </View>
  );

  // Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>A carregar relatórios...</Text>
      </View>
    );
  }

  const Container = Platform.OS === 'web' ? View : SafeAreaView;

  return (
    <Container style={styles.container} edges={Platform.OS === 'web' ? [] : ['top']}>
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.reportId.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    }),
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
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: colors.surface,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.white,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.white,
    marginTop: spacing.xs,
  },
  reportCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...(Platform.OS === 'web' && {
      elevation: 0,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  reportTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  reportSubtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reportDate: {
    color: colors.textLight,
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textLight,
    textAlign: 'center',
  },
});