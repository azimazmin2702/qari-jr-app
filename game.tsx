// app/game.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler, // <--- Tambah Import Ini
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

// --- FONTS (Tukar ke Sniglet) ---
import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';

/* ===================== CONFIG ===================== */

const TOTAL_QUESTIONS = 10;
const MIN_SCORE_TO_UNLOCK = 7;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const KEY_LEVEL_PROGRESS_BASE = 'levelProgress';
const KEY_HIGHEST_LEVEL_BASE = 'highestLevel';

type LevelProgressMap = Record<number, number>;

/* ===================== COMPONENT ===================== */

export default function GameMenu() {
  const router = useRouter();

  const [highestLevel, setHighestLevel] = useState<number>(0); 
  const [levelProgress, setLevelProgress] = useState<LevelProgressMap>({});
  const [profileId, setProfileId] = useState<string | null>(null);

  /* ---------- LOAD FONTS ---------- */
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  /* ---------- AUDIO ---------- */
  const clickSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = sound;
      } catch (e) {}
    })();
    return () => { clickSound.current?.unloadAsync(); };
  }, []);

  const playClick = async () => {
    try { await clickSound.current?.replayAsync(); } catch (e) {}
  };

  /* ---------- HANDLE BACK BUTTON (TABLET/ANDROID) ---------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Mainkan bunyi klik (pilihan)
        playClick();
        
        // Kembali ke Home
        router.replace('/home'); 
        
        // Return true supaya app tak tutup
        return true; 
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  /* ---------- LEVEL CONFIG ---------- */
  const LEVELS = [
    { id: 1, title: 'Tahap 1', desc: 'Pilih huruf selepas huruf yang ditunjukkan', color: '#DCEDC8' },
    { id: 2, title: 'Tahap 2', desc: 'Pilih huruf berdasarkan bunyi yang dimainkan', color: '#FFF9C4' },
    { id: 3, title: 'Tahap 3', desc: 'Pilih huruf dan baris yang betul', color: '#B3E5FC' },
    { id: 4, title: 'Tahap 4', desc: 'Susun huruf dan baris ikut bunyi', color: '#FFE0B2' },
    { id: 5, title: 'Tahap 5', desc: 'Cabaran terakhir — kuiz pantas!', color: '#E1BEE7' },
  ];

  /* ---------- ANIMATION REFS ---------- */
  const scalesRef = useRef<Record<number, Animated.Value>>({});
  LEVELS.forEach(l => {
    if (!scalesRef.current[l.id]) {
      scalesRef.current[l.id] = new Animated.Value(1);
    }
  });

  /* ---------- LOAD PROGRESS (PROFILE AWARE) ---------- */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadData = async () => {
        try {
            const rawProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
            const profile = rawProfile ? JSON.parse(rawProfile) : null;
            const pid = profile?.id;
            if (active) setProfileId(pid);

            const keyHighest = pid ? `${KEY_HIGHEST_LEVEL_BASE}_${pid}` : KEY_HIGHEST_LEVEL_BASE;
            const keyProgress = pid ? `${KEY_LEVEL_PROGRESS_BASE}_${pid}` : KEY_LEVEL_PROGRESS_BASE;

            const savedHighest = await AsyncStorage.getItem(keyHighest);
            const progRaw = await AsyncStorage.getItem(keyProgress);

            if (active) {
                setHighestLevel(savedHighest ? parseInt(savedHighest, 10) : 0);
                setLevelProgress(progRaw ? JSON.parse(progRaw) : {});
            }

        } catch (e) {
            console.log("Error loading game progress", e);
        }
      };

      loadData();
      return () => { active = false; };
    }, [])
  );

  /* ---------- NAVIGATION ---------- */
  const handleStartLevel = (level: number) => {
    playClick();
    setTimeout(() => {
        router.push(`/level${level}` as any);
    }, 150);
  };

  const handleBack = () => {
      playClick();
      setTimeout(() => {
          router.replace('/home'); // Tukar ke replace supaya konsisten
      }, 150);
  };

  /* ---------- LOADING ---------- */
  if (!fontsLoaded) {
    return (
      <ImageBackground
        source={require('../assets/images/qari-bg-green.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#00796B" />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  /* ---------- UI ---------- */
  return (
    <ImageBackground
      source={require('../assets/images/qari-bg-green.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* HEADER DASHBOARD */}
          <View style={styles.headerBox}>
            <Text style={styles.mainTitle}>
                 Permainan 🎮
            </Text>

            {/* SUKU KATA: Tahap Tertinggi Anda (BERWARNA) */}
            <View style={styles.statsBox}>
                <Text style={styles.sukuKataTitle}>
                    <Text style={{color: '#D32F2F'}}>Ta</Text>
                    <Text style={{color: '#1976D2'}}>hap </Text>
                    <Text style={{color: '#D32F2F'}}>Ter</Text>
                    <Text style={{color: '#1976D2'}}>ting</Text>
                    <Text style={{color: '#D32F2F'}}>gi </Text>
                    <Text style={{color: '#D32F2F'}}>An</Text>
                    <Text style={{color: '#1976D2'}}>da</Text>
                    <Text style={{color: '#000'}}>: </Text>
                    <Text style={{color: '#E65100', fontSize: 45}}>{highestLevel}</Text>
                </Text>
            </View>

            {/* ARAHAN: Kumpul 7 Markah (TEXT BIASA) */}
            <View style={styles.ruleBox}>
                <Text style={styles.ruleText}>
                    🔒 Kumpul <Text style={{color: '#E65100', fontWeight:'bold'}}>7 Markah</Text> untuk buka tahap seterusnya
                </Text>
            </View>
          </View>

          {/* LEVEL LIST */}
          {LEVELS.map(level => {
            const scaleAnim = scalesRef.current[level.id];
            const score = levelProgress[level.id];

            const prevScore = level.id === 1 ? TOTAL_QUESTIONS : levelProgress[level.id - 1];
            const passedPrev = level.id === 1
              ? true
              : typeof prevScore === 'number' && prevScore >= MIN_SCORE_TO_UNLOCK;

            const unlocked = level.id === 1 || passedPrev;
            const completed = typeof score === 'number';

            const onPressIn = () =>
              Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
            const onPressOut = () =>
              Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

            return (
              <Pressable
                key={level.id}
                disabled={!unlocked}
                onPress={() => unlocked && handleStartLevel(level.id)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={{ width: '100%', alignItems: 'center' }}
              >
                <Animated.View
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: unlocked ? level.color : '#EEEEEE',
                      transform: [{ scale: scaleAnim }],
                      opacity: unlocked ? 1 : 0.6,
                      borderColor: unlocked ? '#fff' : '#BDBDBD',
                    },
                  ]}
                >
                  <View style={styles.textContainer}>
                    {/* TAJUK LEVEL: Sniglet Extra Bold (Warna Hijau Gelap Solid) */}
                    <Text style={styles.levelTitle}>
                      Tahap {level.id}
                    </Text>

                    {/* DESCRIPTION: Sniglet Regular */}
                    <Text style={styles.levelDesc}>
                      {level.desc}
                    </Text>

                    {completed ? (
                      <Text style={styles.scoreText}>
                        Markah: {score} / {TOTAL_QUESTIONS}
                      </Text>
                    ) : unlocked ? (
                      <Text style={styles.statusTextBlue}>
                        ▶ Tekan untuk mula
                      </Text>
                    ) : (
                      <Text style={styles.statusTextGray}>
                        🔒 Kunci
                      </Text>
                    )}
                  </View>

                  {completed ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>🏅</Text>
                    </View>
                  ) : (
                    <View style={styles.placeholderBadge}>
                      {!unlocked && <Text style={{ fontSize: 30 }}>🔒</Text>}
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}

          {/* BACK BUTTON (MANUAL) */}
          <Pressable style={{ width: '100%', alignItems: 'center' }} onPress={handleBack}>
            <View style={styles.backButton}>
              <Text style={styles.backText}>
                KEMBALI KE MENU
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 70,
    width: 650, // Tablet width
  },

  headerBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff'
  },
  
  // Font Sniglet ExtraBold untuk Tajuk Utama
  mainTitle: { 
      fontSize: 32, 
      color: '#455A64', 
      marginBottom: 10,
      fontFamily: 'Sniglet_800ExtraBold'
  },
  
  statsBox: {
      backgroundColor: '#E0F7FA',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 15,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#4DD0E1'
  },
  
  // Font Sniglet Regular/Bold untuk Suku Kata
  sukuKataTitle: { 
      fontSize: 30, 
      color: '#333',
      fontFamily: 'Sniglet_800ExtraBold'
  },

  ruleBox: {
      backgroundColor: '#FFF3E0',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: '#FFB74D'
  },

  // Font Sniglet Regular untuk Arahan
  ruleText: {
      fontSize: 22,
      color: '#5D4037',
      fontFamily: 'Sniglet_400Regular',
      textAlign: 'center'
  },

  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    minHeight: 140,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
  },
  textContainer: { flex: 1, paddingRight: 15 },
  
  // TAJUK LEVEL: Sniglet Extra Bold
  levelTitle: { 
      fontSize: 32, 
      marginBottom: 6,
      color: '#2E7D32', // Solid Green
      fontFamily: 'Sniglet_800ExtraBold',
      textShadowColor: 'rgba(255,255,255,0.5)',
      textShadowOffset: {width: 1, height: 1},
      textShadowRadius: 1
  },
  
  // DESC: Sniglet Regular
  levelDesc: { 
      fontSize: 20, 
      color: '#37474F',
      marginTop: 2, 
      lineHeight: 26,
      fontFamily: 'Sniglet_400Regular'
  },

  scoreText: { 
      marginTop: 10, 
      fontSize: 22, 
      color: '#1B5E20', 
      fontFamily: 'Sniglet_800ExtraBold' 
  },
  
  statusTextBlue: { 
      marginTop: 10, 
      fontSize: 20, 
      color: '#0277BD',
      fontFamily: 'Sniglet_800ExtraBold'
  },
  
  statusTextGray: { 
      marginTop: 10, 
      fontSize: 20, 
      color: '#757575',
      fontFamily: 'Sniglet_400Regular'
  },

  badge: {
    backgroundColor: '#FFF176',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FBC02D'
  },
  badgeText: { fontSize: 30 },
  placeholderBadge: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },

  backButton: {
    marginTop: 35,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#004D40'
  },
  backText: { 
      color: '#004D40', 
      fontSize: 24, 
      fontFamily: 'Sniglet_800ExtraBold' 
  },
});