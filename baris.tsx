// app/baris.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';

const SELECTED_PROFILE_KEY = 'qari_selected_profile';
// Base keys (akan digabungkan dengan ID)
const KEY_FATHAH_DONE = 'barisFathahCompleted';
const KEY_KASRAH_DONE = 'barisKasrahCompleted';

export default function BarisScreen() {
  const router = useRouter();
  
  // LOAD FON
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  // LOCK STATE
  const [fathahDone, setFathahDone] = useState<boolean>(false);
  const [kasrahDone, setKasrahDone] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // ANIMATION SCALE
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;
  const scaleBack = useRef(new Animated.Value(1)).current;

  // SOUND REF
  const soundRef = useRef<Audio.Sound | null>(null);

  /* ===================== LOAD SOUND ===================== */
  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/click.mp3')
        );
        soundRef.current = sound;
      } catch (e) {
        console.log('Sound load error', e);
      }
    })();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playClick = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (e) {}
  };

  /* ===================== CHECK LOCKS (PROFILE AWARE) ===================== */
  // Guna useFocusEffect supaya setiap kali masuk screen ini, dia check balik progress
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkProgress = async () => {
        try {
          // 1. Dapatkan Profile ID
          const rawProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
          const profile = rawProfile ? JSON.parse(rawProfile) : null;
          const pid = profile?.id;

          // 2. Tentukan Key Unik
          const keyFathah = pid ? `${KEY_FATHAH_DONE}_${pid}` : KEY_FATHAH_DONE;
          const keyKasrah = pid ? `${KEY_KASRAH_DONE}_${pid}` : KEY_KASRAH_DONE;

          // 3. Baca Status
          const f = await AsyncStorage.getItem(keyFathah);
          const k = await AsyncStorage.getItem(keyKasrah);

          if (isActive) {
            setFathahDone(f === 'true');
            setKasrahDone(k === 'true');
            setLoading(false);
          }
        } catch (e) {
          console.warn('Error reading lock state', e);
        }
      };

      checkProgress();

      return () => {
        isActive = false;
      };
    }, [])
  );

  /* ===================== ANIMATION HELPERS ===================== */
  const pressIn = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 0.94, useNativeDriver: true }).start();

  const pressOut = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 1, friction: 6, useNativeDriver: true }).start();

  /* ===================== NAVIGATION HANDLER ===================== */
  const handleNav = (route: string) => {
    playClick();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  if (!fontsLoaded || loading) {
    return (
        <ImageBackground source={require('../assets/images/qari-bg-green.png')} style={{flex:1}}>
            <ActivityIndicator size="large" color="#004D40" style={{marginTop: 100}} />
        </ImageBackground>
    );
  }

  // Helper: render a stage that can be locked
  const Stage = ({ title, icon, colors, scale, href, locked }: any) => {
    return (
      <Animated.View style={{ transform: [{ scale }], margin: 12 }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => pressIn(scale)}
          onPressOut={() => pressOut(scale)}
          onPress={() => {
            if (locked) return; // Boleh tambah bunyi 'error' di sini jika mahu
            handleNav(href);
          }}
          disabled={locked}
        >
          <View>
            <LinearGradient
              colors={colors}
              start={[0, 0]}
              end={[1, 1]}
              style={[styles.bigButton, locked ? styles.lockedButtonDim : null]}
            >
              <Image source={icon} style={styles.icon} resizeMode="contain" />
              <Text style={styles.buttonText}>{title}</Text>
            </LinearGradient>

            {/* Overlay lock badge when locked */}
            {locked && (
              <View style={styles.lockOverlayContainer}>
                <View style={styles.lockBubble}>
                  <Text style={styles.lockText}>🔒</Text>
                  <Text style={styles.lockLabel}>Terkunci</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/images/qari-bg-green.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <View style={styles.overlay}>
        
        {/* HEADER */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>Jom Belajar Baris</Text>
          <Text style={styles.subtitle}>Pilih baris untuk mula</Text>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
          <Stage
            title="Baris Fathah"
            icon={require('../assets/icons/barisfathah.png')}
            colors={['#FF9AB3', '#FFB6C1']}
            scale={scale1}
            href="/barisfathah"
            locked={false} // Sentiasa buka level 1
          />

          <Stage
            title="Baris Kasrah"
            icon={require('../assets/icons/bariskasrah.png')}
            colors={['#FFE082', '#FFD54F']}
            scale={scale2}
            href="/bariskasrah"
            locked={!fathahDone} // Terkunci selagi Fathah belum 'true'
          />

          <Stage
            title="Baris Dhammah"
            icon={require('../assets/icons/barisdhammah.png')}
            colors={['#80DEEA', '#4DD0E1']}
            scale={scale3}
            href="/barisdhammah"
            locked={!kasrahDone} // Terkunci selagi Kasrah belum 'true'
          />
        </View>

        {/* BACK BUTTON */}
        <Animated.View style={{ transform: [{ scale: scaleBack }], marginTop: 20 }}>
            <TouchableOpacity
              style={styles.backButton}
              onPressIn={() => pressIn(scaleBack)}
              onPressOut={() => pressOut(scaleBack)}
              onPress={() => handleNav('/home')}
            >
              <Text style={styles.backText}>KEMBALI KE MENU</Text>
            </TouchableOpacity>
        </Animated.View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },

  overlay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  headerBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 28,
    marginBottom: 25,
    elevation: 6,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  title: {
    fontSize: 42,
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#004D40',
  },

  subtitle: {
    fontSize: 20,
    fontFamily: 'Sniglet_400Regular',
    color: '#00796B',
    marginTop: 6,
  },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    marginTop: 10,
  },

  bigButton: {
    width: 250, // Dikecilkan sedikit supaya muat 3 dalam tablet
    height: 250,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },

  // applied when locked to slightly dim the gradient content
  lockedButtonDim: {
    opacity: 0.5,
    backgroundColor: '#CFD8DC' // Tambah warna asas kelabu
  },

  icon: {
    width: 150,
    height: 120,
    marginBottom: 10,
  },

  buttonText: {
    fontSize: 24,
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#004D40',
    textAlign: 'center',
    marginTop: 5
  },

  // overlay for lock badge
  lockOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockBubble: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B0BEC5'
  },
  lockText: { fontSize: 30, color: '#333' },
  lockLabel: { fontSize: 14, color: '#546E7A', marginTop: 4, fontWeight: 'bold' },

  backButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 22,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#26A69A'
  },

  backText: {
    color: '#004D40',
    fontSize: 20,
    fontFamily: 'Sniglet_800ExtraBold',
  },
});