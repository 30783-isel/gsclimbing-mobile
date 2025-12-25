// src/components/reports/performance-repair-elevator/PerformanceRepairElevatorListItem.tsx

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, Menu, Divider } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { Report } from '@/types/report.types';

interface PerformanceRepairElevatorListItemProps {
  report: Report;
  onPress: () => void;
  onDelete: () => void;
  onHistory: () => void;
}

const PerformanceRepairElevatorListItem: React.FC<PerformanceRepairElevatorListItemProps> = ({
  report,
  onPress,
  onDelete,
  onHistory,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        {/* Header com título e menu */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text variant="titleMedium" style={styles.reportTitle}>
              Relatório #{report.reportId}
            </Text>
          </View>

          {/* Menu de três pontinhos */}
          <Menu
            visible={menuVisible}
            onDismiss={toggleMenu}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={toggleMenu}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                toggleMenu();
                onPress();
              }}
              leadingIcon="pencil"
              title="Editar"
            />

            <Menu.Item
              onPress={() => {
                toggleMenu();
                onHistory();
              }}
              leadingIcon="history"
              title="Ver Histórico"
            />

            <Divider />

            <Menu.Item
              onPress={() => {
                toggleMenu();
                onDelete();
              }}
              leadingIcon="delete"
              title="Eliminar"
              titleStyle={{ color: colors.error }}
            />
          </Menu>
        </View>

        {/* Data de criação */}
        <Text variant="bodySmall" style={styles.reportDate}>
          {new Date(report.createDate).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Chips com informações */}
        <View style={styles.chipContainer}>
          <Chip icon="map-marker" compact style={styles.chip}>
            {report.site || 'Sem site'}
          </Chip>
          <Chip icon="wind-turbine" compact style={styles.chip}>
            {report.wtgNumber || 'N/A'}
          </Chip>
          <Chip icon="cog" compact style={styles.chip}>
            {report.wtgNumber || 'N/A'}
          </Chip>
        </View>

        {/* Status badges se houver */}
        {report.locked === 'Y' && (
          <Chip
            icon="lock"
            compact
            style={[styles.statusChip, { backgroundColor: colors.error + '20' }]}
            textStyle={{ color: colors.error }}
          >
            Bloqueado
          </Chip>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  reportTitle: {
    fontWeight: 'bold',
    color: colors.text,
  },
  reportDate: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.secondary,
  },
  statusChip: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});

export default PerformanceRepairElevatorListItem;