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
  const [fabOpen, setFabOpen] = useState(false);

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
   * Carregar todos os relatórios
   */
  const loadAllReports = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Carregando relatórios...');

      // TODO: Implementar endpoint que retorna todos os relatórios do técnico
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
   * Navegar para seleção de projeto/turbina antes de criar
   */
  const handleCreateReport = () => {
    // Navegar de volta para projetos para selecionar turbina
    router.push('/(tabs)/tech');
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
              await loadAllReports();
              Alert.alert('Sucesso', 'Relatório eliminado com sucesso');
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
   * Renderizar card de relatório
   */
  const renderReportCard = ({ item }: { item: DefectInspectionReportResponse }) => (
    <Card style={styles.reportCard}>
      <TouchableOpacity onPress={() => handleReportPress(item.reportId)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Text variant="titleMedium" style={styles.turbineText}>
                {item.wtgNumber || 'N/A'}
              </Text>
              <Text variant="bodySmall" style={styles.typeText}>
                {item.wtgType || 'Tipo não definido'}
              </Text>
            </View>

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
                title="Ver Detalhes"
                leadingIcon="eye"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item.reportId);
                  handleDeleteReport(item.reportId);
                }}
                title="Eliminar"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <IconButton icon="map-marker" size={16} style={styles.detailIcon} />
              <Text variant="bodySmall">{item.site || 'Local não definido'}</Text>
            </View>

            <View style={styles.detailRow}>
              <IconButton icon="calendar" size={16} style={styles.detailIcon} />
              <Text variant="bodySmall">
                {item.createDate
                  ? new Date(item.createDate).toLocaleDateString('pt-PT')
                  : 'Data não definida'}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Chip icon="camera" compact>
              {item.numberPictures} {item.numberPictures === 1 ? 'foto' : 'fotos'}
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
        Ainda não criaste nenhum relatório.{'\n'}
        Clica no botão + para criar um novo.
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
    <Container style={styles.container} edges={Platform.OS === 'web' ? undefined : ['bottom']}>
      <FlatList
        data={filteredReports}
        renderItem={renderReportCard}
        keyExtractor={(item) => item.reportId.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredReports.length === 0 ? styles.emptyListContent : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        actions={[
          {
            icon: 'wind-turbine',
            label: 'Criar Relatório',
            onPress: handleCreateReport,
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={styles.fab}
      />
    </Container>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
    elevation: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    elevation: 1,
  },
  statNumber: {
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  reportCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
  },
  turbineText: {
    fontWeight: '600',
    color: colors.text,
  },
  typeText: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    margin: 0,
    marginRight: -spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  fab: {
    backgroundColor: colors.primary,
  },
});
