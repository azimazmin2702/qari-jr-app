// app/huruf.tsx
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';
import AsyncStorage from '@react-native-async-storage/async-storage';


const HURUF = [
  'ا','ب','ت','ث','ج','ح','خ',
  'د','ذ','ر','ز','س','ش','ص',
  'ض','ط','ظ','ع','غ','ف','ق',
  'ك','ل','م','ن','ه','و','ي'
];

const AUDIO_MAP: Record<string, any> = {
  'ا': require('../assets/audio/Alif.m4a'),
  'ب': require('../assets/audio/Ba.m4a'),
  'ت': require('../assets/audio/Ta.m4a'),
  'ث': require('../assets/audio/Tsa.m4a'),
  'ج': require('../assets/audio/Jim.m4a'),
  'ح': require('../assets/audio/Ha.m4a'),
  'خ': require('../assets/audio/Kho.m4a'),
  'د': require('../assets/audio/Dal.m4a'),
  'ذ': require('../assets/audio/Dzal.m4a'),
  'ر': require('../assets/audio/Ro.m4a'),
  'ز': require('../assets/audio/Zai.m4a'),
  'س': require('../assets/audio/Sin.m4a'),
  'ش': require('../assets/audio/Syin.m4a'),
  'ص': require('../assets/audio/Shod.m4a'),
  'ض': require('../assets/audio/Dhod.m4a'),
  'ط': require('../assets/audio/Tho.m4a'),
  'ظ': require('../assets/audio/Zho.m4a'),
  'ع': require('../assets/audio/Ain.m4a'),
  'غ': require('../assets/audio/Ghain.m4a'),
  'ف': require('../assets/audio/Fa.m4a'),
  'ق': require('../assets/audio/Qaf.m4a'),
  'ك': require('../assets/audio/Kaf.m4a'),
  'ل': require('../assets/audio/Lam.m4a'),
  'م': require('../assets/audio/Mim.m4a'),
  'ن': require('../assets/audio/Nun.m4a'),
  'ه': require('../assets/audio/Ha2.m4a'),
  'و': require('../assets/audio/Wau.m4a'),
  'ي': require('../assets/audio/Ya.m4a'),
};

const ROMI_MAP: Record<string, { main: string; tail?: string }> = {
  'ا': { main: 'A', tail: 'lif' },
  'ب': { main: 'Ba' }, 'ت': { main: 'Ta' }, 'ث': { main: 'Tsa' },
  'ج': { main: 'Jim' }, 'ح': { main: 'Ha' }, 'خ': { main: 'Kho' },
  'د': { main: 'Dal' }, 'ذ': { main: 'Dzal' }, 'ر': { main: 'Ro' },
  'ز': { main: 'Zai' }, 'س': { main: 'Sin' }, 'ش': { main: 'Syin' },
  'ص': { main: 'Shod' }, 'ض': { main: 'Dhod' }, 'ط': { main: 'Tho' },
  'ظ': { main: 'Zho' }, 'ع': { main: '‘Ain' }, 'غ': { main: 'Ghain' },
  'ف': { main: 'Fa' }, 'ق': { main: 'Qaf' }, 'ك': { main: 'Kaf' },
  'ل': { main: 'Lam' }, 'م': { main: 'Mim' }, 'ن': { main: 'Nun' },
  'ه': { main: 'Ha' }, 'و': { main: 'Wau' }, 'ي': { main: 'Ya' },
};

const LEARNT_HURUF_BASE = 'learnt_huruf';
const SELECTED_PROFILE_KEY = 'qari_selected_profile';

/* ===================== SCREEN ===================== */

export default function HurufScreen() {
  const router = useRouter(); 
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [learned, setLearned] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeHuruf, setActiveHuruf] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Ref untuk Click Sound
  const clickSound = useRef<Audio.Sound | null>(null);

  /* ===== LOAD CLICK SOUND ===== */
  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = sound;
      } catch (e) {
        // Abaikan jika error, mungkin file tiada
      }
    })();
    return () => { clickSound.current?.unloadAsync(); };
  }, []);

  const playClick = async () => {
    try { await clickSound.current?.replayAsync(); } catch (e) {}
  };

  /* ===== HANDLE BACK BUTTON ===== */
  const handleBack = () => {
      playClick();
      // Delay sedikit supaya bunyi sempat keluar
      setTimeout(() => {
          router.replace('/home');
      }, 150);
  };

  /* ===== LOAD SAVED DATA & PROFILE ===== */
  useEffect(() => {
    (async () => {
      try {
        const rawProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
        const profile = rawProfile ? JSON.parse(rawProfile) : null;
        const pid = profile?.id; 
        setProfileId(pid);

        const storageKey = pid ? `${LEARNT_HURUF_BASE}_${pid}` : LEARNT_HURUF_BASE;

        const rawData = await AsyncStorage.getItem(storageKey);
        if (rawData) {
            setLearned(JSON.parse(rawData));
        }
      } catch (e) {
        console.warn("Error loading data", e);
      }
    })();
  }, []);

  /* ===== HELPER: MARK LEARNED ===== */
  const markHurufLearned = async (huruf: string) => {
    if (learned.includes(huruf)) return;

    const next = [...learned, huruf];
    setLearned(next);

    const storageKey = profileId ? `${LEARNT_HURUF_BASE}_${profileId}` : LEARNT_HURUF_BASE;
    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  };

  /* ===== PLAY AUDIO ===== */
  const playAudio = async (huruf: string) => {
    try {
        if (sound) await sound.unloadAsync().catch(() => {});
        const { sound: s } = await Audio.Sound.createAsync(AUDIO_MAP[huruf]);
        setSound(s);
        await s.playAsync();

        markHurufLearned(huruf);
    } catch (e) {
        console.log("Audio play error", e);
    }
  };

  /* ===== AUTO PLAY ON OPEN / CHANGE ===== */
  useEffect(() => {
    if (modalVisible && activeHuruf) {
      playAudio(activeHuruf);
    }
  }, [modalVisible, activeHuruf]);

  useFocusEffect(
    useCallback(() => {
        return () => {
            sound?.unloadAsync().catch(() => {});
        };
    }, [sound])
  );

  if (!fontsLoaded) {
    return (
        <ImageBackground source={require('../assets/images/qari-bg-green.png')} style={styles.background}>
             <ActivityIndicator size="large" color="#fff" style={{marginTop: 100}}/>
        </ImageBackground>
    );
  }

  const idx = activeHuruf ? HURUF.indexOf(activeHuruf) : -1;
  const romi = activeHuruf ? ROMI_MAP[activeHuruf] : null;

  return (
    <ImageBackground source={require('../assets/images/qari-bg-green.png')} style={styles.background}>
      <StatusBar hidden />
      <SafeAreaView style={styles.safe}>

        {/* ===== HEADER ===== */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>Jom Belajar Huruf Hijaiyah!</Text>
          <Text style={styles.subtitle}>Tekan huruf untuk dengar bunyi</Text>
        </View>

        {/* ===== GRID ===== */}
        <FlatList
          data={HURUF}
          numColumns={7} 
          keyExtractor={(i, x) => i + x}
          columnWrapperStyle={{ flexDirection: 'row-reverse', justifyContent: 'center' }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tile, learned.includes(item) && styles.tileLearned]}
              onPress={() => {
                playClick(); 
                setActiveHuruf(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.tileText}>{item}</Text>

              {learned.includes(item) && (
                <Text style={styles.doneTick}>✓</Text>
              )}
            </TouchableOpacity>
          )}
        />

        {/* ===== BACK BUTTON (UPDATED) ===== */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
           <Text style={styles.backText}>KEMBALI KE MENU</Text>
        </TouchableOpacity>

        {/* ===== POPUP ===== */}
        {modalVisible && activeHuruf && (
          <View style={styles.overlay}>
            <View style={styles.modal}>

              <TouchableOpacity
                style={styles.close}
                onPress={() => {
                  playClick();
                  setModalVisible(false);
                  sound?.unloadAsync().catch(() => {});
                }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.romi}>
                <Text style={{ color: '#E53935' }}>{romi?.main}</Text>
                {romi?.tail && <Text style={{ color: '#333' }}>{romi.tail}</Text>}
              </Text>

              <Text style={styles.bigHuruf}>{activeHuruf}</Text>

              <View style={styles.controls}>
                {/* PREVIOUS */}
                {idx < HURUF.length - 1 && (
                  <TouchableOpacity
                    style={styles.ctrl}
                    onPress={() => {
                      playClick();
                      const nextHuruf = HURUF[idx + 1];
                      setActiveHuruf(nextHuruf);
                    }}
                  >
                    <Text style={styles.ctrlText}>{'<'}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.ctrl, styles.ctrlPlay]} onPress={() => playAudio(activeHuruf)}>
                  <Text style={styles.ctrlText}>🔊</Text>
                </TouchableOpacity>

                {/* NEXT */}
                {idx > 0 && (
                  <TouchableOpacity
                    style={styles.ctrl}
                    onPress={() => {
                      playClick();
                      const prevHuruf = HURUF[idx - 1];
                      setActiveHuruf(prevHuruf);
                    }}
                  >
                    <Text style={styles.ctrlText}>{'>'}</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, alignItems: 'center' },

  headerBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  title: { fontSize: 36, fontFamily: 'Sniglet_800ExtraBold', color: '#004D40', marginBottom: 5 },
  subtitle: { fontSize: 18, fontFamily: 'Sniglet_400Regular', color: '#00695C' },

  tile: {
    width: 100, 
    height: 100,
    margin: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff',
  },

  tileLearned: { 
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784' 
  },
  tileText: { fontSize: 45, fontFamily: 'Sniglet_800ExtraBold', color: '#004D40' },

  doneTick: {
    position: 'absolute',
    top: 5,
    right: 8,
    fontSize: 20,
    color: '#2E7D32',
    fontWeight: '700',
  },

  backButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
  },

  backText: { color: '#004D40', fontSize: 18, fontFamily: 'Sniglet_800ExtraBold' },

  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modal: {
    width: 500, 
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },

  close: { position: 'absolute', top: 15, right: 15, padding: 5 },
  closeText: { fontSize: 24, color: '#888', fontWeight: 'bold' },

  romi: { fontSize: 70, marginBottom: 10, fontFamily: 'Sniglet_800ExtraBold' },
  bigHuruf: { 
    fontSize: 150, 
    fontFamily: 'Sniglet_800ExtraBold', 
    color: '#004D40', 
    
    textAlign: 'center',       
    lineHeight: 200,          
    paddingBottom: 20,        
    includeFontPadding: false, 
    marginTop: 10,             
    // --------------------------------------
  },

  controls: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  ctrl: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#81C784',
    marginHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  ctrlPlay: {
      backgroundColor: '#004D40',
      width: 90, height: 90, borderRadius: 45 
  },

  ctrlText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});