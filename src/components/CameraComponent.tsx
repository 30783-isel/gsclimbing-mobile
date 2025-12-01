import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '@/constants/theme';

interface CameraComponentProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
}

export const CameraComponent: React.FC<CameraComponentProps> = ({
  onPhotoTaken,
  onClose,
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo?.uri) {
          onPhotoTaken(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoTaken(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>A solicitar permissões...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          É necessário acesso à câmara para tirar fotos
        </Text>
        <IconButton
          icon="camera"
          size={48}
          iconColor={colors.primary}
          onPress={requestPermission}
        />
        <Text style={styles.permissionSubtext}>
          Toque para conceder permissão
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="close"
            size={28}
            iconColor={colors.white}
            onPress={onClose}
            style={styles.headerButton}
          />
          <Text variant="titleMedium" style={styles.headerTitle}>
            Tirar Foto
          </Text>
          <IconButton
            icon="camera-flip"
            size={28}
            iconColor={colors.white}
            onPress={toggleCameraFacing}
            style={styles.headerButton}
          />
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <IconButton
            icon="image"
            size={32}
            iconColor={colors.white}
            onPress={pickImage}
            style={styles.controlButton}
          />

          <TouchableOpacity
            onPress={takePicture}
            style={styles.captureButton}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.controlButton} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: spacing.lg,
    color: colors.text,
  },
  permissionSubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    margin: 0,
  },
  headerTitle: {
    color: colors.white,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
  },
});