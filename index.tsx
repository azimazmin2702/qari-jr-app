import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {

    const timer = setTimeout(() => {
      router.replace('/profiles');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#00695C" />
      <Text style={{ marginTop: 12, fontFamily: 'System' }}>Memuatkan...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0F2F1' },
});