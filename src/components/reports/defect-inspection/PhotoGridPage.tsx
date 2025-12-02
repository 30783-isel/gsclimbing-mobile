import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { PhotoSlot } from './PhotoSlot';
import { colors, spacing } from '@/constants/theme';
import type { PhotoData } from '@/types/defectInspectionReport.types';

interface PhotoGridPageProps {
  pageNumber: number;
  photos: PhotoData[];
  onTakePhoto: (pageNumber: number, position: number) => void;
  onPickPhoto: (pageNumber: number, position: number) => void;
  onRemovePhoto: (photoId: string) => void;
  onUpdateDescription: (photoId: string, description: string) => void;
}

export const PhotoGridPage: React.FC<PhotoGridPageProps> = ({
  pageNumber,
  photos,
  onTakePhoto,
  onPickPhoto,
  onRemovePhoto,
  onUpdateDescription,
}) => {
  const pageTitle = pageNumber === 2 ? '2. Documentação Fotográfica (1-4)' : '3. Documentação Fotográfica (5-8)';
  const startPosition = pageNumber === 2 ? 1 : 5;

  // Filtrar fotos desta página
  const getPhotoForPosition = (position: number): PhotoData | undefined => {
    return photos.find(
      (p) => p.pageNumber === pageNumber && p.position === position
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text variant="titleLarge" style={styles.title}>
        {pageTitle}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Adicione até 4 fotos com descrição
      </Text>

      <View style={styles.grid}>
        {[0, 1, 2, 3].map((index) => {
          const position = startPosition + index;
          const photo = getPhotoForPosition(position);

          return (
            <PhotoSlot
              key={`photo-${pageNumber}-${position}`}
              photo={photo}
              position={position}
              pageNumber={pageNumber}
              onTakePhoto={onTakePhoto}
              onPickPhoto={onPickPhoto}
              onRemovePhoto={onRemovePhoto}
              onUpdateDescription={onUpdateDescription}
            />
          );
        })}
      </View>

      <Text variant="bodySmall" style={styles.tip}>
        💡 Dica: Tire fotos claras e bem enquadradas dos defeitos encontrados
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tip: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
