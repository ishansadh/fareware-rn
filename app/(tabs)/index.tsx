import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ActivityIndicator, View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const BASE_URL = 'https://genuine-crumble-33f1c9.netlify.app';

export default function HomeScreen() {
  const webRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{lat:number; lng:number} | null>(null);
  const [pageReady, setPageReady] = useState(false);

  // Ask permission and get coords once
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location', 'Permission denied — using fallback in page.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(c);
    })();
  }, []);

  // When both page is ready and we have coords, send them
  useEffect(() => {
    if (pageReady && coords) {
      const msg = JSON.stringify({ type: 'FW_COORDS', payload: coords });
      webRef.current?.postMessage(msg);
    }
  }, [pageReady, coords]);

  const handleMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data || '{}');
      if (msg.type === 'FW_READY') {
        setPageReady(true);
      }
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 }}>
        <TouchableOpacity
          onPress={() => webRef.current?.goBack()}
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0.3 }}
        >
          <Text style={{ fontSize: 16 }}>◀︎ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => webRef.current?.reload()}>
          <Text style={{ fontSize: 16 }}>↻ Reload</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webRef}
        // cache-busting query string ensures the phone gets the latest page
        source={{ uri: `${BASE_URL}?v=${Date.now()}` }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 60, right: 16 }}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  );
}
