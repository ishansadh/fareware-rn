import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const URL = 'https://genuine-crumble-33f1c9.netlify.app'; // <-- your Netlify URL

export default function HomeScreen() {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webRef.current?.reload();
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleNavStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleShouldStart = (req: any) => {
    // Keep same-origin in the app; open others in Safari
    try {
      const origin = new URL(URL).origin;
      const reqOrigin = new URL(req.url).origin;
      if (reqOrigin === origin) return true;
    } catch {}
    Linking.openURL(req.url);
    return false;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Top bar with Back + Reload */}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <WebView
          ref={webRef}
          source={{ uri: URL }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavStateChange}
          onShouldStartLoadWithRequest={handleShouldStart}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={{ marginTop: 24 }} />}
          onError={(e) => console.log('WebView error:', e.nativeEvent)}
        />
      </ScrollView>

      {loading && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 60, right: 16 }}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  );
}
