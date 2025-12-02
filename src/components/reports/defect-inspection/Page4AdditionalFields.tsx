import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, IconButton, Card } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import type { AdditionalField } from '@/types/defectInspectionReport.types';

interface Page4AdditionalFieldsProps {
  additionalFields: AdditionalField[];
  onAddField: () => void;
  onRemoveField: (index: number) => void;
  onUpdateField: (index: number, field: 'label' | 'value', value: string) => void;
  maxFields?: number;
}

export const Page4AdditionalFields: React.FC<Page4AdditionalFieldsProps> = ({
  additionalFields,
  onAddField,
  onRemoveField,
  onUpdateField,
  maxFields = 7,
}) => {
  const canAddMore = additionalFields.length < maxFields;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="titleLarge" style={styles.title}>
        4. Campos Adicionais
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Adicione informações extras (máximo {maxFields} campos)
      </Text>

      {additionalFields.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Nenhum campo adicional adicionado.
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtext}>
              Use o botão abaixo para adicionar campos personalizados.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.fieldsList}>
          {additionalFields.map((field, index) => (
            <Card key={index} style={styles.fieldCard}>
              <Card.Content>
                <View style={styles.fieldHeader}>
                  <Text variant="titleSmall" style={styles.fieldNumber}>
                    Campo {index + 1}
                  </Text>
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => onRemoveField(index)}
                  />
                </View>

                <TextInput
                  label="Nome do Campo"
                  value={field.label}
                  onChangeText={(text) => onUpdateField(index, 'label', text)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ex: Inspector, Weather, etc."
                  left={<TextInput.Icon icon="tag" />}
                />

                <TextInput
                  label="Valor"
                  value={field.value}
                  onChangeText={(text) => onUpdateField(index, 'value', text)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Ex: John Doe, Sunny, etc."
                  multiline
                  numberOfLines={2}
                  left={<TextInput.Icon icon="text" />}
                />
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <Button
        mode="outlined"
        onPress={onAddField}
        disabled={!canAddMore}
        icon="plus"
        style={styles.addButton}
      >
        Adicionar Campo {!canAddMore && '(Máximo atingido)'}
      </Button>

      <Text variant="bodySmall" style={styles.tip}>
        💡 Use campos adicionais para informações específicas como: Inspector,
        Weather, Tools Used, etc.
      </Text>
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
  emptyCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
  },
  fieldsList: {
    marginBottom: spacing.md,
  },
  fieldCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldNumber: {
    color: colors.primary,
  },
  input: {
    marginBottom: spacing.sm,
  },
  addButton: {
    marginVertical: spacing.lg,
  },
  tip: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
