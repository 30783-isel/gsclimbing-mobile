/**
 * Step 3: Additional Fields
 * Até 7 campos adicionais personalizáveis (label + value)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, List, IconButton, Dialog, Portal, TextInput, Chip } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';

interface AdditionalField {
  label: string;
  value: string;
}

interface Step3Props {
  additionalFields: AdditionalField[];
  language: 'EN' | 'ES';
  onFieldsChange: (fields: AdditionalField[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const MAX_FIELDS = 7;

export function DefectReportStep3({
  additionalFields,
  language,
  onFieldsChange,
  onBack,
  onSubmit,
  isSubmitting,
}: Step3Props) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  // Labels traduzidos
  const labels = language === 'EN' ? {
    title: 'Additional Fields',
    subtitle: `Add up to ${MAX_FIELDS} custom fields (optional)`,
    addField: 'Add Field',
    editField: 'Edit Field',
    label: 'Label',
    value: 'Value',
    labelPlaceholder: 'e.g., Inspector Name',
    valuePlaceholder: 'e.g., John Doe',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Remove',
    back: 'Back',
    submit: 'Submit Report',
    submitting: 'Submitting...',
    noFields: 'No additional fields added',
    maxReached: `Maximum of ${MAX_FIELDS} fields reached`,
    required: 'Both label and value are required',
    confirmRemove: 'Remove this field?',
  } : {
    title: 'Campos Adicionales',
    subtitle: `Añadir hasta ${MAX_FIELDS} campos personalizados (opcional)`,
    addField: 'Añadir Campo',
    editField: 'Editar Campo',
    label: 'Etiqueta',
    value: 'Valor',
    labelPlaceholder: 'ej., Nombre del Inspector',
    valuePlaceholder: 'ej., Juan Pérez',
    save: 'Guardar',
    cancel: 'Cancelar',
    remove: 'Eliminar',
    back: 'Atrás',
    submit: 'Enviar Informe',
    submitting: 'Enviando...',
    noFields: 'No se añadieron campos adicionales',
    maxReached: `Máximo de ${MAX_FIELDS} campos alcanzado`,
    required: 'La etiqueta y el valor son obligatorios',
    confirmRemove: '¿Eliminar este campo?',
  };

  // Abrir diálogo (novo ou editar)
  const openDialog = (index?: number) => {
    if (index !== undefined) {
      setEditingIndex(index);
      setFieldLabel(additionalFields[index].label);
      setFieldValue(additionalFields[index].value);
    } else {
      setEditingIndex(null);
      setFieldLabel('');
      setFieldValue('');
    }
    setDialogVisible(true);
  };

  // Fechar diálogo
  const closeDialog = () => {
    setDialogVisible(false);
    setEditingIndex(null);
    setFieldLabel('');
    setFieldValue('');
  };

  // Guardar campo
  const saveField = () => {
    if (!fieldLabel.trim() || !fieldValue.trim()) {
      Alert.alert(
        language === 'EN' ? 'Required' : 'Requerido',
        labels.required
      );
      return;
    }

    const newField: AdditionalField = {
      label: fieldLabel.trim(),
      value: fieldValue.trim(),
    };

    if (editingIndex !== null) {
      // Editar existente
      const updated = [...additionalFields];
      updated[editingIndex] = newField;
      onFieldsChange(updated);
    } else {
      // Adicionar novo
      if (additionalFields.length >= MAX_FIELDS) {
        Alert.alert(
          language === 'EN' ? 'Maximum Reached' : 'Máximo Alcanzado',
          labels.maxReached
        );
        return;
      }
      onFieldsChange([...additionalFields, newField]);
    }

    closeDialog();
  };

  // Remover campo
  const removeField = (index: number) => {
    Alert.alert(
      labels.remove,
      labels.confirmRemove,
      [
        {
          text: labels.cancel,
          style: 'cancel',
        },
        {
          text: labels.remove,
          style: 'destructive',
          onPress: () => {
            const updated = additionalFields.filter((_, i) => i !== index);
            onFieldsChange(updated);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={labels.title}
          subtitle={labels.subtitle}
          right={() => (
            <Chip style={styles.countChip}>
              {additionalFields.length} / {MAX_FIELDS}
            </Chip>
          )}
        />

        <Card.Content>
          {/* Lista de campos */}
          {additionalFields.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{labels.noFields}</Text>
            </View>
          ) : (
            <View style={styles.fieldsList}>
              {additionalFields.map((field, index) => (
                <List.Item
                  key={index}
                  title={field.label}
                  description={field.value}
                  left={props => <List.Icon {...props} icon="text-box" />}
                  right={() => (
                    <View style={styles.fieldActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openDialog(index)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => removeField(index)}
                      />
                    </View>
                  )}
                  style={styles.fieldItem}
                />
              ))}
            </View>
          )}

          {/* Botão adicionar campo */}
          {additionalFields.length < MAX_FIELDS && (
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => openDialog()}
              style={styles.addButton}
            >
              {labels.addField}
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Botões de navegação */}
      <View style={styles.navigationButtons}>
        <Button
          mode="outlined"
          onPress={onBack}
          disabled={isSubmitting}
          style={styles.navButton}
          icon="arrow-left"
        >
          {labels.back}
        </Button>
        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
          style={[styles.navButton, styles.submitButton]}
          icon="check"
        >
          {isSubmitting ? labels.submitting : labels.submit}
        </Button>
      </View>

      {/* Diálogo de adicionar/editar campo */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>
            {editingIndex !== null ? labels.editField : labels.addField}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label={`${labels.label} *`}
              value={fieldLabel}
              onChangeText={setFieldLabel}
              mode="outlined"
              placeholder={labels.labelPlaceholder}
              style={styles.dialogInput}
              returnKeyType="next"
            />
            <TextInput
              label={`${labels.value} *`}
              value={fieldValue}
              onChangeText={setFieldValue}
              mode="outlined"
              placeholder={labels.valuePlaceholder}
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>{labels.cancel}</Button>
            <Button onPress={saveField} mode="contained">
              {labels.save}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  countChip: {
    marginRight: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  fieldsList: {
    marginBottom: spacing.md,
  },
  fieldItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginTop: spacing.md,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  navButton: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.success,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
});
