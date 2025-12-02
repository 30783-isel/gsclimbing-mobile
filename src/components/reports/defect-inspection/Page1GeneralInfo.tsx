import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';

interface Page1GeneralInfoProps {
  site: string;
  wtgNumber: string;
  wtgType: string;
  yearConstruction: string;
  onUpdateField: (field: string, value: string) => void;
}

export const Page1GeneralInfo: React.FC<Page1GeneralInfoProps> = ({
  site,
  wtgNumber,
  wtgType,
  yearConstruction,
  onUpdateField,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="titleLarge" style={styles.title}>
        1. Informações Gerais
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Preencha os dados básicos do relatório
      </Text>

      <View style={styles.form}>
        <TextInput
          label="Lugar/Site *"
          value={site}
          onChangeText={(text) => onUpdateField('site', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="map-marker" />}
        />

        <TextInput
          label="Núm.IEC/WTG N° *"
          value={wtgNumber}
          onChangeText={(text) => onUpdateField('wtgNumber', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="wind-turbine" />}
        />

        <TextInput
          label="IEC tipo/WTG type"
          value={wtgType}
          onChangeText={(text) => onUpdateField('wtgType', text)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="information" />}
        />

        <TextInput
          label="Año de construcción/Year of construction"
          value={yearConstruction}
          onChangeText={(text) => onUpdateField('yearConstruction', text)}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          maxLength={4}
          left={<TextInput.Icon icon="calendar" />}
          placeholder="2024"
        />

        <Text variant="bodySmall" style={styles.requiredNote}>
          * Campos obrigatórios
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  requiredNote: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
});
