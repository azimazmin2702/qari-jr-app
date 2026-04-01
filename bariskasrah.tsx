// app/bariskasrah.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View,
} from 'react-native';

// FONT SNIGLET
import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';

// Progress helper
import { getBarisItemSet, markBarisItem } from '../lib/barisProgress';

/* ===================== DATA ===================== */

// 1. Senarai Huruf Asas
const HURUF = [
  'ا','ب','ت','ث','ج','ح','خ',
  'د','ذ','ر','ز','س','ش','ص',
  'ض','ط','ظ','ع','غ','ف','ق',
  'ك','ل','م','ن','ه','و','ي'
];

// 2. Generate Huruf Kasrah (Tanda Bawah)
const HURUF_KASRAH = HURUF.map(h => `${h}\u0650`);

// 3. Audio Map
const AUDIO_MAP: Record<string, any> = {
  'اِ': require('../assets/audio/kasrah/kasrahAlif.m4a'),
  'بِ': require('../assets/audio/kasrah/kasrahBa.m4a'),
  'تِ': require('../assets/audio/kasrah/kasrahTa.m4a'),
  'ثِ': require('../assets/audio/kasrah/kasrahTsa.m4a'),
  'جِ': require('../assets/audio/kasrah/kasrahJim.m4a'),
  'حِ': require('../assets/audio/kasrah/kasrahHa.m4a'),
  'خِ': require('../assets/audio/kasrah/kasrahKho.m4a'),
  'دِ': require('../assets/audio/kasrah/kasrahDal.m4a'),
  'ذِ': require('../assets/audio/kasrah/kasrahDzal.m4a'),
  'رِ': require('../assets/audio/kasrah/kasrahRo.m4a'),
  'زِ': require('../assets/audio/kasrah/kasrahZai.m4a'),
  'سِ': require('../assets/audio/kasrah/kasrahSin.m4a'),
  'شِ': require('../assets/audio/kasrah/kasrahSyin.m4a'),
  'صِ': require('../assets/audio/kasrah/kasrahShod.m4a'),
  'ضِ': require('../assets/audio/kasrah/kasrahDhod.m4a'),
  'طِ': require('../assets/audio/kasrah/kasrahTho.m4a'),
  'ظِ': require('../assets/audio/kasrah/kasrahZho.m4a'),
  'عِ': require('../assets/audio/kasrah/kasrahAin.m4a'),
  'غِ': require('../assets/audio/kasrah/kasrahGhain.m4a'),
  'فِ': require('../assets/audio/kasrah/kasrahFa.m4a'),
  'قِ': require('../assets/audio/kasrah/kasrahQaf.m4a'),
  'كِ': require('../assets/audio/kasrah/kasrahKaf.m4a'),
  'لِ': require('../assets/audio/kasrah/kasrahLam.m4a'),
  'مِ': require('../assets/audio/kasrah/kasrahMim.m4a'),
  'نِ': require('../assets/audio/kasrah/kasrahNun.m4a'),
  'هِ': require('../assets/audio/kasrah/kasrahHa2.m4a'),
  'وِ': require('../assets/audio/kasrah/kasrahWau.m4a'),
  'يِ': require('../assets/audio/kasrah/kasrahYa.m4a'),
};

// 4. Rumi Map (Bunyi 'i')
const ROMI_KASRAH: Record<string, string> = {
  'اِ': 'I',   'بِ': 'Bi',  'تِ': 'Ti',  'ثِ': 'Tsi',
  'جِ': 'Ji',  'حِ': 'Hi',  'خِ': 'Khi', 'دِ': 'Di',
  'ذِ': 'Dzi', 'رِ': 'Ri',  'زِ': 'Zi',  'سِ': 'Si',
  'شِ': 'Syi', 'صِ': 'Shi', 'ضِ': 'Dhi', 'طِ': 'Thi',
  'ظِ': 'Zhi', 'عِ': '‘I',  'غِ': 'Ghi', 'فِ': 'Fi',
  'قِ': 'Qi',  'كِ': 'Ki',  'لِ': 'Li',  'مِ': 'Mi',
  'نِ': 'Ni',  'هِ': 'Hi',  'وِ': 'Wi',  'يِ': 'Yi'
};

const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const KEY_KASRAH_DONE_BASE = 'barisKasrahCompleted';

export default function BarisKasrahScreen() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  // State Audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const clickSound = useRef<Audio.Sound | null>(null);

  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Load Data (Profile & Progress)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const initData = async () => {
        try {
            const rawProfile = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
            const profile = rawProfile ? JSON.parse(rawProfile) : null;
            const pid = profile?.id;
            if (active) setProfileId(pid);

            const arr = await getBarisItemSet(pid);
            if (active) {
                setCompletedItems(new Set(arr));
                setLoading(false);
            }
        } catch (err) {
          console.warn('Failed to load baris items', err);
        }
      };
      initData();
      return () => { 
          active = false; 
          if (sound) sound.unloadAsync();
      };
    }, [])
  );

  // 2. Load Click Sound
  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = sound;
      } catch (e) { console.log('Failed to load click sound'); }
    })();
    return () => { clickSound.current?.unloadAsync(); };
  }, []);

  // Play Click
  const playClick = async () => {
    try { await clickSound.current?.replayAsync(); } catch (e) {}
  };

  // Handle Back
  const handleBack = () => {
    playClick();
    setTimeout(() => {
      router.push('/baris');
    }, 150);
  };

  // Auto-play modal
  useEffect(() => {
    if (modalVisible && activeItem) {
        playAndMark(activeItem);
    }
  }, [modalVisible, activeItem]);

  // Mainkan Audio & Simpan
  const playAndMark = async (item: string) => {
    try {
        const res = await markBarisItem(item, profileId || undefined);
        if (res?.added) {
            setCompletedItems(prev => new Set(prev).add(item));
        }

        const isAllDone = HURUF_KASRAH.every(h => completedItems.has(h) || h === item);
        if (isAllDone) {
            // SIMPAN KEY UNIK
            const key = profileId ? `${KEY_KASRAH_DONE_BASE}_${profileId}` : KEY_KASRAH_DONE_BASE;
            await AsyncStorage.setItem(key, 'true');
        }

        if (sound) {
            await sound.unloadAsync().catch(() => {});
        }
        
        if (AUDIO_MAP[item]) {
            const { sound: newSound } = await Audio.Sound.createAsync(AUDIO_MAP[item]);
            setSound(newSound);
            await newSound.playAsync();
        }
    } catch (e) {
        console.log("Error playing", e);
    }
  };

  const closeModal = () => {
      setModalVisible(false);
      setActiveItem(null);
      sound?.unloadAsync().catch(() => {});
  };

  const goNext = () => {
      if (!activeItem) return;
      const idx = HURUF_KASRAH.indexOf(activeItem);
      if (idx < HURUF_KASRAH.length - 1) {
          setActiveItem(HURUF_KASRAH[idx + 1]);
      }
  };

  const goPrev = () => {
      if (!activeItem) return;
      const idx = HURUF_KASRAH.indexOf(activeItem);
      if (idx > 0) {
          setActiveItem(HURUF_KASRAH[idx - 1]);
      }
  };

  const AnimatedTile = ({ item }: { item: string }) => {
    const isDone = completedItems.has(item);
    return (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tile, isDone && styles.tileDone]}
          onPress={() => {
              setActiveItem(item);
              setModalVisible(true);
          }}
        >
          <Text style={styles.tileText}>{item}</Text>
          {isDone && <Text style={styles.doneTick}>✓</Text>}
        </TouchableOpacity>
    );
  };

  if (!fontsLoaded || loading) {
     return (
        <ImageBackground source={require('../assets/images/qari-bg-green.png')} style={{flex:1}}>
            <ActivityIndicator size="large" color="#004D40" style={{marginTop: 100}} />
        </ImageBackground>
    );
  }

  const currentIndex = activeItem ? HURUF_KASRAH.indexOf(activeItem) : -1;
  const currentRumi = activeItem ? ROMI_KASRAH[activeItem] : '';

  return (
    <ImageBackground
      source={require('../assets/images/qari-bg-green.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.safe}>
        
        <View style={styles.headerBox}>
          <Text style={styles.title}>Baris Kasrah (I)</Text>
          <Text style={styles.subtitle}>Tekan huruf untuk belajar baris kasrah</Text>
        </View>

        <FlatList
          data={HURUF_KASRAH}
          renderItem={({ item }) => <AnimatedTile item={item} />}
          keyExtractor={(item) => item}
          numColumns={7}
          contentContainerStyle={styles.flatContent}
          columnWrapperStyle={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 15 }}
          showsVerticalScrollIndicator={false}
        />

        {/* BACK BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
             <Text style={styles.backText}>KEMBALI</Text>
          </TouchableOpacity>
        </View>

        {/* POPUP MODAL */}
        {modalVisible && activeItem && (
          <View style={styles.overlay}>
            <View style={styles.modal}>

              <TouchableOpacity style={styles.close} onPress={closeModal}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              {/* Warna untuk Kasrah biasanya kuning/gold sikit atau merah ikut tema, sini saya guna style konsisten */}
              <Text style={styles.romi}>{currentRumi}</Text>
              <Text style={styles.bigHuruf}>{activeItem}</Text>

              <View style={styles.controls}>
                {currentIndex < HURUF_KASRAH.length - 1 && (
                  <TouchableOpacity style={styles.ctrl} onPress={goNext}>
                    <Text style={styles.ctrlText}>{'<'}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.ctrl, styles.ctrlPlay]} onPress={() => playAndMark(activeItem)}>
                  <Text style={styles.ctrlText}>🔊</Text>
                </TouchableOpacity>

                {currentIndex > 0 && (
                  <TouchableOpacity style={styles.ctrl} onPress={goPrev}>
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

/* ================= Styles ================= */
const styles = StyleSheet.create({
  background: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    elevation: 5,
  },
  title: { fontSize: 36, color: '#004D40', fontFamily: 'Sniglet_800ExtraBold' },
  subtitle: { fontSize: 18, color: '#00695C', marginTop: 6, fontFamily: 'Sniglet_400Regular' },

  flatContent: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  
  tile: {
    width: 100, height: 100, marginVertical: 10, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 6, borderWidth: 2, borderColor: '#fff',
  },
  tileDone: { backgroundColor: '#E8F5E9', borderColor: '#81C784' },
  tileText: { fontSize: 45, color: '#004D40', fontFamily: 'Sniglet_800ExtraBold' },
  doneTick: { position: 'absolute', top: 5, right: 8, fontSize: 18, color: '#26A69A', fontWeight: '700' },

  footer: { marginTop: 10, marginBottom: 25 },
  backButton: {
    backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 22, elevation: 4, borderWidth: 1, borderColor: '#DDD'
  },
  backText: { fontSize: 18, color: '#004D40', fontFamily: 'Sniglet_800ExtraBold' },

  /* MODAL */
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    width: 500, backgroundColor: '#fff', borderRadius: 30, padding: 30,
    alignItems: 'center', elevation: 10,
  },
  close: { position: 'absolute', top: 15, right: 15, padding: 5 },
  closeText: { fontSize: 24, color: '#888', fontWeight: 'bold' },
  
  romi: { fontSize: 70, marginBottom: 10, fontFamily: 'Sniglet_800ExtraBold', color: '#E53935' },
  bigHuruf: { fontSize: 150, fontFamily: 'Sniglet_800ExtraBold', color: '#004D40', marginVertical: 10 },

  controls: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  ctrl: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#81C784',
    marginHorizontal: 15, justifyContent: 'center', alignItems: 'center', elevation: 5,
  },
  ctrlPlay: { backgroundColor: '#004D40', width: 90, height: 90, borderRadius: 45 },
  ctrlText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
});