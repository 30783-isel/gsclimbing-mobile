// src/components/OfflineBanner.tsx
import { Banner } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
  }, []);

  return (
    <Banner
      visible={!isOnline}
      icon="wifi-off"
      style={{ backgroundColor: '#FFA726' }}
    >
      📵 Modo Offline - Os dados serão sincronizados quando houver conexão
    </Banner>
  );
}