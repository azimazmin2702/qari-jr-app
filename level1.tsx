// app/level1.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  ImageBackground,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// FONT
import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';

// GAME LOGIC HELPER
import { saveLevelScore } from '../lib/gameProgress';

/* ===================== DATA ===================== */

const HURUF = [
  'ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز',
  'س','ش','ص','ض','ط','ظ','ع','غ','ف','ق',
  'ك','ل','م','ن','ه','و','ي'
];

const TOTAL_ROUNDS = 10;
const LEVEL_NUMBER = 1;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const BACKGROUND_IMAGE = require('../assets/images/level1bg.png'); 

/* ===================== UTIL ===================== */

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const getRandomIndexNotLast = () =>
  Math.floor(Math.random() * (HURUF.length - 1));

/* ===================== COMPONENT ===================== */

export default function Level1() {
  const router = useRouter();

  /* ---------- HOOKS ---------- */
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(() => getRandomIndexNotLast());
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  
  // STATE: Exit Modal
  const [showExitModal, setShowExitModal] = useState(false);

  // STATE BARU: Finish Modal (Tamat Level)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishData, setFinishData] = useState({ 
      title: '', 
      message: '', 
      isSuccess: false,
      finalScore: 0 
  });

  const hurufScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  /* ---------- SOUND ---------- */
  const bgMusic = useRef<Audio.Sound | null>(null);
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);
  const clickSound = useRef<Audio.Sound | null>(null);

  /* ---------- 1. DISABLE HARDWARE BACK BUTTON ---------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Jika game dah tamat, block back button atau force exit
        if (showFinishModal) return true;
        
        setShowExitModal(true); 
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showFinishModal])
  );

  /* ---------- LOAD RESOURCE & MUSIC ---------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const cs = new Audio.Sound(); await cs.loadAsync(require('../assets/sounds/correct.mp3'));
        const ws = new Audio.Sound(); await ws.loadAsync(require('../assets/sounds/wrong.mp3'));
        const clk = new Audio.Sound(); await clk.loadAsync(require('../assets/sounds/click.mp3'));

        const bgm = new Audio.Sound();
        await bgm.loadAsync(require('../assets/sounds/gamemusic.mp3'));
        await bgm.setIsLoopingAsync(true);
        await bgm.setVolumeAsync(1.0);
        await bgm.playAsync();

        if (mounted) {
          correctSound.current = cs;
          wrongSound.current = ws;
          clickSound.current = clk;
          bgMusic.current = bgm;
        }
      } catch (e) {
          console.log("Audio Error:", e);
      }
    })();

    return () => {
      mounted = false;
      correctSound.current?.unloadAsync();
      wrongSound.current?.unloadAsync();
      clickSound.current?.unloadAsync();
      if (bgMusic.current) {
          bgMusic.current.stopAsync();
          bgMusic.current.unloadAsync();
      }
    };
  }, []);

  /* ---------- TOGGLE MUTE ---------- */
  const toggleMute = async () => {
      if (!bgMusic.current) return;
      if (isMuted) {
          await bgMusic.current.setVolumeAsync(1.0);
          setIsMuted(false);
      } else {
          await bgMusic.current.setVolumeAsync(0.0);
          setIsMuted(true);
      }
  };

  const playSound = async (type: 'correct' | 'wrong' | 'click') => {
    try {
      if (type === 'correct') await correctSound.current?.replayAsync();
      else if (type === 'wrong') await wrongSound.current?.replayAsync();
      else await clickSound.current?.replayAsync();
    } catch {}
  };

  /* ---------- EXIT HANDLERS ---------- */
  const handleExitPress = () => {
      playSound('click');
      setShowExitModal(true);
  }

  const confirmExit = async () => {
      playSound('click');
      setShowExitModal(false);
      if(bgMusic.current) await bgMusic.current.stopAsync();
      router.replace('/game');
  }

  const cancelExit = () => {
      playSound('click');
      setShowExitModal(false);
  }

  /* ---------- FINISH HANDLERS (LOGIC BARU) ---------- */
  const handleFinishClose = () => {
      playSound('click');
      setShowFinishModal(false);
      router.push('/game'); // Kembali ke menu utama
  };

  /* ---------- GAME LOGIC ---------- */

  useEffect(() => {
    generateChoices(currentIndex);
    setAnswered(false);
    setSelected(null);

    Animated.timing(progressAnim, {
      toValue: (round - 1) / TOTAL_ROUNDS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, round]);

  const generateChoices = (index: number) => {
    const correct = HURUF[index + 1];
    const pool = HURUF.filter((_, i) => i !== index && i !== index + 1);
    setChoices(shuffle([correct, ...shuffle(pool).slice(0, 2)]));
  };

  const onSelect = async (choice: string) => {
    if (answered) return;

    setAnswered(true);
    setSelected(choice);

    const correct = HURUF[currentIndex + 1];
    const isCorrect = choice === correct;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (isCorrect) {
      playSound('correct');
      Animated.sequence([
        Animated.timing(hurufScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(hurufScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      playSound('wrong');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finishLevel(newScore);
      } else {
        setRound(r => r + 1);
        setCurrentIndex(getRandomIndexNotLast());
      }
    }, 1200);
  };

  const finishLevel = async (finalScore: number) => {
    // 1. Stop muzik
    if(bgMusic.current) {
        await bgMusic.current.stopAsync();
    }

    // 2. Simpan Data
    const raw = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    const pid = profile?.id;
    await saveLevelScore(LEVEL_NUMBER, finalScore, pid);

    // 3. Setup Data untuk Modal
    const isSuccess = finalScore >= 7;
    const title = isSuccess ? 'Tahniah! 🎉' : 'Siap! 👍';
    const message = isSuccess 
        ? "Hebat! Tahap seterusnya dibuka!" 
        : "Cuba lagi untuk markah lebih tinggi.";

    // 4. Buka Modal
    setFinishData({ title, message, isSuccess, finalScore });
    setShowFinishModal(true);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shakeX = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  if (!fontsLoaded) return null;

  /* ---------- UI ---------- */

  return (
    <ImageBackground 
        source={BACKGROUND_IMAGE} 
        style={{ flex: 1 }} 
        resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar hidden />
        
        {/* BUTANG MUTE */}
        <TouchableOpacity 
          style={styles.muteBtn} 
          onPress={toggleMute}
          activeOpacity={0.7}
        >
            <Text style={{fontSize: 24}}>
                {isMuted ? '🔇' : '🔊'}
            </Text>
        </TouchableOpacity>

        {/* BUTANG KELUAR */}
        <TouchableOpacity 
          style={styles.exitBtn} 
          onPress={handleExitPress}
          activeOpacity={0.7}
        >
            <Text style={{fontSize: 24}}>🚪</Text>
        </TouchableOpacity>

        {/* 2. Kad Utama */}
        <View style={styles.card}>
          <Text style={styles.title}>TAHAP 1</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
               <Text style={styles.progressLabel}>Soalan {round} / {TOTAL_ROUNDS}</Text>
               <Text style={styles.scoreLabel}>Skor: {score}</Text>
            </View>
            
            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>

          <Text style={styles.hint}>Selepas huruf ini ialah…</Text>

          <Animated.View style={[styles.hurufCard, { transform: [{ scale: hurufScale }] }]}>
            <Text style={styles.huruf}>{HURUF[currentIndex]}</Text>
          </Animated.View>

          <View style={styles.choices}>
            {choices.map(c => {
              const isWrong = answered && selected === c && c !== HURUF[currentIndex + 1];
              const isCorrectAnswer = answered && c === HURUF[currentIndex + 1];

              return (
                <Animated.View
                  key={c}
                  style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}
                >
                  <TouchableOpacity 
                      disabled={answered} 
                      activeOpacity={0.8}
                      onPress={() => onSelect(c)}
                  >
                    <View
                      style={[
                        styles.choiceBtn,
                        isCorrectAnswer && styles.correct,
                        answered && selected === c && isWrong && styles.wrong,
                      ]}
                    >
                      <Text style={styles.choiceText}>{c}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* ================= CUSTOM EXIT MODAL ================= */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={showExitModal}
            onRequestClose={cancelExit}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { borderColor: '#EF5350' }]}>
                    <Text style={[styles.modalTitle, { color: '#C62828' }]}>Nak Berhenti?</Text>
                    <Text style={styles.modalText}>
                        Kalau keluar sekarang, skor anda tidak akan disimpan.
                    </Text>
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.btnGreen]} 
                            onPress={cancelExit}
                        >
                            <Text style={styles.modalBtnText}>Sambung</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.btnRed]} 
                            onPress={confirmExit}
                        >
                            <Text style={styles.modalBtnText}>Keluar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* ================= CUSTOM FINISH LEVEL MODAL ================= */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={showFinishModal}
            onRequestClose={handleFinishClose} // Android Back Button
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalCard, 
                    { borderColor: finishData.isSuccess ? '#2E7D32' : '#F9A825' } // Hijau (Win) atau Oren (Try Again)
                ]}>
                    
                    {/* Emoji Besar */}
                    <Text style={{ fontSize: 60, marginBottom: 10 }}>
                        {finishData.isSuccess ? '🏆' : '💪'}
                    </Text>

                    {/* Tajuk */}
                    <Text style={[
                        styles.modalTitle, 
                        { color: finishData.isSuccess ? '#2E7D32' : '#F57F17' }
                    ]}>
                        {finishData.title}
                    </Text>
                    
                    {/* Skor Besar */}
                    <View style={styles.resultScoreContainer}>
                        <Text style={styles.resultScoreLabel}>SKOR AKHIR</Text>
                        <Text style={styles.resultScoreValue}>
                            {finishData.finalScore} / {TOTAL_ROUNDS}
                        </Text>
                    </View>

                    {/* Message */}
                    <Text style={styles.modalText}>
                        {finishData.message}
                    </Text>

                    {/* Satu Butang Besar */}
                    <TouchableOpacity 
                        style={[
                            styles.modalBtnFull, 
                            { backgroundColor: finishData.isSuccess ? '#4CAF50' : '#FFB300' }
                        ]} 
                        onPress={handleFinishClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.modalBtnText}>
                            {finishData.isSuccess ? 'Seterusnya 🚀' : 'Cuba Lagi 🔄'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </SafeAreaView>
    </ImageBackground>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, justifyContent: 'center' },
  
  // Mute Button
  muteBtn: {
      position: 'absolute',
      top: 40,
      right: 20,
      backgroundColor: 'rgba(255,255,255,0.6)',
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      borderWidth: 2,
      borderColor: '#2E7D32',
  },

  // Exit Button
  exitBtn: {
      position: 'absolute',
      top: 100,
      right: 20,
      backgroundColor: 'rgba(255,200,200,0.8)',
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      borderWidth: 2,
      borderColor: '#C62828',
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  title: { fontSize: 36, fontFamily: 'Sniglet_800ExtraBold', color: '#2E7D32', marginBottom: 10 },
  
  progressWrap: { width: '100%', marginVertical: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 18, color: '#1B5E20', fontFamily: 'Sniglet_400Regular' },
  scoreLabel: { fontSize: 18, color: '#1B5E20', fontFamily: 'Sniglet_800ExtraBold' },

  progressBg: {
    width: '100%',
    height: 20,
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#81C784'
  },
  progressFill: { height: '100%', backgroundColor: '#4CAF50' },
  
  hint: {
    fontSize: 24,
    color: '#004D40',
    marginBottom: 10,
    fontFamily: 'Sniglet_400Regular',
    textAlign: 'center'
  },
  
  hurufCard: { 
      backgroundColor: '#fff', 
      width: 140, 
      height: 140, 
      borderRadius: 25, 
      marginVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#A5D6A7',
      elevation: 4
  },
  huruf: { fontSize: 90, fontFamily: 'Sniglet_800ExtraBold', color: '#1B5E20' },
  
  choices: { width: '100%', marginTop: 10 },
  choiceBtn: {
    backgroundColor: '#66BB6A',
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 15,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff'
  },
  choiceText: { fontSize: 32, fontFamily: 'Sniglet_800ExtraBold', color: '#fff' },
  
  correct: { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  wrong: { backgroundColor: '#C62828', borderColor: '#B71C1C' },

  /* ---------- SHARED MODAL STYLES ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFF',
    width: '85%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 10,
    borderWidth: 5, // Border tebal sedikit untuk nampak kartun
  },
  modalTitle: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 32,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  
  // Style untuk Exit Modal Buttons
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  btnGreen: { backgroundColor: '#4CAF50' },
  btnRed: { backgroundColor: '#EF5350' },

  // Style untuk Finish Modal Button (Full Width)
  modalBtnFull: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalBtnText: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 20,
    color: '#FFF',
  },

  // Style Khas Result Score
  resultScoreContainer: {
    backgroundColor: '#F1F8E9',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5E1A5'
  },
  resultScoreLabel: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 14,
    color: '#558B2F',
    marginBottom: 2
  },
  resultScoreValue: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 36,
    color: '#33691E'
  }
});