// app/level3.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  ImageBackground, // Guna ImageBackground
  Modal, // Import Modal
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

const LETTER_GROUPS = [
  {
    base: 'ح',
    forms: [
      { label: 'حَ', audio: require('../assets/audio/fathah/fathahHa.m4a') },
      { label: 'حِ', audio: require('../assets/audio/kasrah/kasrahHa.m4a') },
      { label: 'حُ', audio: require('../assets/audio/dhammah/dhammahHa.m4a') },
    ],
  },
  {
    base: 'ج',
    forms: [
      { label: 'جَ', audio: require('../assets/audio/fathah/fathahJim.m4a') },
      { label: 'جِ', audio: require('../assets/audio/kasrah/kasrahJim.m4a') },
      { label: 'جُ', audio: require('../assets/audio/dhammah/dhammahJim.m4a') },
    ],
  },
  {
    base: 'د',
    forms: [
      { label: 'دَ', audio: require('../assets/audio/fathah/fathahDal.m4a') },
      { label: 'دِ', audio: require('../assets/audio/kasrah/kasrahDal.m4a') },
      { label: 'دُ', audio: require('../assets/audio/dhammah/dhammahDal.m4a') },
    ],
  },
  {
    base: 'ر',
    forms: [
      { label: 'رَ', audio: require('../assets/audio/fathah/fathahRo.m4a') },
      { label: 'رِ', audio: require('../assets/audio/kasrah/kasrahRo.m4a') },
      { label: 'رُ', audio: require('../assets/audio/dhammah/dhammahRo.m4a') },
    ],
  },
  {
   base: 'ب',
   forms: [
     { label: 'بَ', audio: require('../assets/audio/fathah/fathahBa.m4a') },
     { label: 'بِ', audio: require('../assets/audio/kasrah/kasrahBa.m4a') },
     { label: 'بُ', audio: require('../assets/audio/dhammah/dhammahBa.m4a') },
   ],
  },
  {
   base: 'ت',
   forms: [
     { label: 'تَ', audio: require('../assets/audio/fathah/fathahTa.m4a') },
     { label: 'تِ', audio: require('../assets/audio/kasrah/kasrahTa.m4a') },
     { label: 'تُ', audio: require('../assets/audio/dhammah/dhammahTa.m4a') },
   ],
  },
  {
    base: 'م',
    forms: [
     { label: 'مَ', audio: require('../assets/audio/fathah/fathahMim.m4a') },
     { label: 'مِ', audio: require('../assets/audio/kasrah/kasrahMim.m4a') },
     { label: 'مُ', audio: require('../assets/audio/dhammah/dhammahMim.m4a') },
    ],
  },
  {
    base: 'ش',
    forms: [
      { label: 'شَ', audio: require('../assets/audio/fathah/fathahSyin.m4a') },
      { label: 'شِ', audio: require('../assets/audio/kasrah/kasrahSyin.m4a') },
      { label: 'شُ', audio: require('../assets/audio/dhammah/dhammahSyin.m4a') },
    ],
  },
  {
    base: 'ن',
    forms: [
      { label: 'نَ', audio: require('../assets/audio/fathah/fathahNun.m4a') },
      { label: 'نِ', audio: require('../assets/audio/kasrah/kasrahNun.m4a') },
      { label: 'نُ', audio: require('../assets/audio/dhammah/dhammahNun.m4a') },
    ],
  },
  {
    base: 'و',
    forms: [
      { label: 'وَ', audio: require('../assets/audio/fathah/fathahWau.m4a') },
      { label: 'وِ', audio: require('../assets/audio/kasrah/kasrahWau.m4a') },
      { label: 'وُ', audio: require('../assets/audio/dhammah/dhammahWau.m4a') },
    ],
  },
  {
    base: 'ل',
    forms: [
      { label: 'لَ', audio: require('../assets/audio/fathah/fathahLam.m4a') },
      { label: 'لِ', audio: require('../assets/audio/kasrah/kasrahLam.m4a') },
      { label: 'لُ', audio: require('../assets/audio/dhammah/dhammahLam.m4a') },
    ],
  },
  {
    base: 'ك',
    forms: [
      { label: 'كَ', audio: require('../assets/audio/fathah/fathahKaf.m4a') },
      { label: 'كِ', audio: require('../assets/audio/kasrah/kasrahKaf.m4a') },
      { label: 'كُ', audio: require('../assets/audio/dhammah/dhammahKaf.m4a') },
    ],
  },
];

const QUESTIONS = LETTER_GROUPS.flatMap(g => g.forms);

/* ===================== CONFIG ===================== */

const LEVEL_NUM = 3;
const PASS_SCORE = 7;
const MAX_ROUNDS = 10;
const TIME_PER_QUESTION = 10;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
// Pastikan fail gambar ini wujud
const BACKGROUND_IMAGE = require('../assets/images/level3bg.png'); 

/* ===================== UTIL ===================== */

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ===================== COMPONENT ===================== */

export default function Level3() {
  const router = useRouter();

  /* ---------- HOOKS ---------- */
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [order, setOrder] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);

  const [options, setOptions] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  // State untuk Mute
  const [isMuted, setIsMuted] = useState(false);

  // MODAL STATES
  const [showExitModal, setShowExitModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishData, setFinishData] = useState({ 
      title: '', 
      message: '', 
      isSuccess: false,
      finalScore: 0 
  });

  // Animasi
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const soundBtnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sounds
  const soundRef = useRef<Audio.Sound | null>(null);
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);
  const clickSound = useRef<Audio.Sound | null>(null);
  const clockSound = useRef<Audio.Sound | null>(null);

  /* ---------- 1. DISABLE BACK BUTTON ---------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showFinishModal) return true;
        handleExitPress(); // Guna custom handler
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showFinishModal])
  );

  /* ---------- INIT ---------- */
  useEffect(() => {
    // 1. Shuffle Soalan
    const indices = shuffle(QUESTIONS.map((_, i) => i)).slice(0, MAX_ROUNDS);
    setOrder(indices);

    // 2. Load Audio UI & Clock
    (async () => {
      try {
        const c = new Audio.Sound(); await c.loadAsync(require('../assets/sounds/correct.mp3'));
        correctSound.current = c;
        const w = new Audio.Sound(); await w.loadAsync(require('../assets/sounds/wrong.mp3'));
        wrongSound.current = w;
        const clk = new Audio.Sound(); await clk.loadAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = clk;
        
        // Setup Clock Ticking (Background Loop)
        const tick = new Audio.Sound(); 
        await tick.loadAsync(require('../assets/sounds/clockticking.mp3'));
        await tick.setIsLoopingAsync(true); // Loop sentiasa
        await tick.playAsync(); // Mainkan terus bila level buka
        clockSound.current = tick;

      } catch (e) {
          console.log("Audio Error:", e);
      }
    })();

    return () => {
      stopTimer();
      soundRef.current?.unloadAsync();
      correctSound.current?.unloadAsync();
      wrongSound.current?.unloadAsync();
      clickSound.current?.unloadAsync();
      
      // Stop Clock bila level tutup
      if (clockSound.current) {
          clockSound.current.stopAsync();
          clockSound.current.unloadAsync();
      }
    };
  }, []);

  const TOTAL_ROUNDS_LEN = order.length;

  /* ---------- HELPER: TIMER MANAGEMENT ---------- */
  
  // Fungsi untuk mula/sambung timer
  const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          // Bunyi jam bila tinggal 3 saat
          if (prevTime === 4) {
              clockSound.current?.replayAsync();
          }
  
          if (prevTime <= 1) {
            // MASA TAMAT
            stopTimer();
            handleTimeUp(); // Panggil fungsi khas
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
  };

  // Fungsi untuk stop timer
  const stopTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
  };

  /* ---------- MUTE TOGGLE ---------- */
  const toggleMute = async () => {
      if (!clockSound.current) return;
      
      if (isMuted) {
          await clockSound.current.setVolumeAsync(1.0);
          setIsMuted(false);
      } else {
          await clockSound.current.setVolumeAsync(0.0);
          setIsMuted(true);
      }
  };

  const playFeedback = async (type: 'correct' | 'wrong' | 'click') => {
    try {
      if (type === 'correct') await correctSound.current?.replayAsync();
      else if (type === 'wrong') await wrongSound.current?.replayAsync();
      else await clickSound.current?.replayAsync();
    } catch {}
  };

  /* ---------- EXIT HANDLERS (MODAL LOGIC) ---------- */
  
  const handleExitPress = () => {
      playFeedback('click');
      stopTimer(); // PAUSE TIMER
      timerAnim.stopAnimation(); // PAUSE ANIMATION BAR
      setShowExitModal(true);
  }

  const confirmExit = async () => {
      playFeedback('click');
      setShowExitModal(false);
      if(clockSound.current) await clockSound.current.stopAsync();
      router.replace('/game');
  }

  const cancelExit = () => {
      playFeedback('click');
      setShowExitModal(false);
      
      // SAMBUNG TIMER
      // Kita start balik timer. Nota: Animasi bar mungkin reset atau kekal static, 
      // tapi logik masa akan bersambung dari baki masa (timeLeft).
      startTimer(); 
  }

  /* ---------- ROUND LOGIC ---------- */
  useEffect(() => {
    if (!order.length || round >= TOTAL_ROUNDS_LEN) return;

    // 1. Setup Data Soalan Baru
    const correctIdx = order[round];
    const pool = QUESTIONS.map((_, i) => i).filter(i => i !== correctIdx);
    setOptions(shuffle([correctIdx, ...shuffle(pool).slice(0, 2)]));

    // 2. Reset UI State
    setAnswered(false);
    setSelected(null);
    setTimeLeft(TIME_PER_QUESTION);

    // 3. Reset Animations
    Animated.timing(progressAnim, {
      toValue: (round + 1) / TOTAL_ROUNDS_LEN,
      duration: 300,
      useNativeDriver: false,
    }).start();

    timerAnim.setValue(1);
    
    // 4. Start Timer Logic
    // Start Animasi Bar Masa
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: TIME_PER_QUESTION * 1000,
      useNativeDriver: false,
    }).start();

    startTimer(); // Guna helper function

    // Auto play audio soalan
    setTimeout(() => playQuestion(correctIdx), 400);

    // CLEANUP
    return () => stopTimer();

  }, [round, order]);

  /* ---------- AUDIO ---------- */
  const playQuestion = async (idx: number) => {
    try {
      Animated.sequence([
        Animated.timing(soundBtnScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(soundBtnScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      await soundRef.current?.unloadAsync();
      const s = new Audio.Sound();
      await s.loadAsync(QUESTIONS[idx].audio);
      soundRef.current = s;
      await s.replayAsync();
    } catch {}
  };

  /* ---------- HANDLE TIME UP ---------- */
  const handleTimeUp = () => {
    setAnswered(true);
    playFeedback('wrong');

    Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    // Pindah ke soalan seterusnya
    setTimeout(() => {
        nextRound(score); 
    }, 1500); 
  };

  /* ---------- ANSWER ---------- */
  const onChoose = (idx: number) => {
    if (answered) return;
    
    // Matikan timer serta merta
    stopTimer();
    timerAnim.stopAnimation();

    setAnswered(true);
    setSelected(idx);

    const correctIdx = order[round];
    const ok = idx === correctIdx;

    const newScore = ok ? score + 1 : score;
    setScore(newScore);
    
    if (ok) {
        playFeedback('correct');
    } else {
        playFeedback('wrong');
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    }

    setTimeout(() => {
      nextRound(newScore);
    }, 1200);
  };

  /* ---------- NEXT ROUND HELPER ---------- */
  const nextRound = (currentScore: number) => {
      if (round + 1 >= TOTAL_ROUNDS_LEN) {
        finishLevel(currentScore);
      } else {
        setRound(r => r + 1); 
      }
  };

  /* ---------- FINISH HANDLERS ---------- */
  const finishLevel = async (finalScore: number) => {
    stopTimer();
    clockSound.current?.stopAsync();

    const raw = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    
    await saveLevelScore(LEVEL_NUM, finalScore, profile?.id);

    const isSuccess = finalScore >= PASS_SCORE;
    const title = isSuccess ? 'Tahniah! 🎉' : 'Masa Tamat!';
    const message = isSuccess 
        ? "Hebat! Anda sangat pantas!" 
        : "Cuba lagi, jangan putus asa!";

    setFinishData({ title, message, isSuccess, finalScore });
    setShowFinishModal(true);
  };

  const handleFinishClose = () => {
      playFeedback('click');
      setShowFinishModal(false);
      router.push('/game');
  };

  /* ---------- DERIVED ANIMATIONS ---------- */
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] });
  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  if (!fontsLoaded || !order.length) return null;

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

        {/* Kad Utama */}
        <View style={styles.card}>
          <Text style={styles.title}>TAHAP 3</Text>
          <Text style={styles.desc}>Cepat! Pilih jawapan sebelum masa tamat!</Text>

          {/* Info Bar */}
          <View style={styles.progressWrap}>
              <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Soalan {round + 1} / {TOTAL_ROUNDS_LEN}</Text>
                  <Text style={styles.scoreLabel}>Skor: {score}</Text>
              </View>
              <View style={styles.progressBg}>
                  <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
          </View>

          {/* Timer Bar */}
          <View style={styles.timerContainer}>
              <Text style={[styles.timerText, timeLeft <= 3 && styles.timerDanger]}>⏱️ {timeLeft}s</Text>
              <View style={styles.timerTrack}>
                  <Animated.View 
                      style={[
                          styles.timerFill, 
                          { width: timerWidth, backgroundColor: timeLeft <= 3 ? '#D32F2F' : '#F57C00' }
                      ]} 
                  />
              </View>
          </View>

          {/* Sound Button */}
          <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => playQuestion(order[round])}
          >
              <Animated.View style={[styles.soundBtn, { transform: [{ scale: soundBtnScale }] }]}>
                  <Text style={{ fontSize: 60 }}>🔊</Text>
                  <Text style={styles.soundLabel}>Dengar Semula</Text>
              </Animated.View>
          </TouchableOpacity>

          {/* Options */}
          <View style={styles.options}>
            {options.filter(i => QUESTIONS[i]).map(i => {
               const isCorrect = answered && i === order[round];
               const isWrong = answered && selected === i && i !== order[round];
               const correctButNotSelected = answered && i === order[round] && selected !== i;

               return (
                  <Animated.View 
                      key={i} 
                      style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}
                  >
                      <TouchableOpacity
                        disabled={answered || timeLeft === 0}
                        onPress={() => onChoose(i)}
                      >
                      <View
                          style={[
                          styles.option,
                          isCorrect && styles.correct,
                          isWrong && styles.wrong,
                          correctButNotSelected && styles.missed
                          ]}
                      >
                          <Text style={styles.optionText}>{QUESTIONS[i].label}</Text>
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
                    <Text style={[styles.modalTitle, { color: '#C62828' }]}>Berhenti Sekejap?</Text>
                    <Text style={styles.modalText}>
                        Masa sedang berhenti. Kalau keluar, skor anda akan hilang.
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
            onRequestClose={handleFinishClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalCard, 
                    { borderColor: finishData.isSuccess ? '#2E7D32' : '#F9A825' }
                ]}>
                    <Text style={{ fontSize: 60, marginBottom: 10 }}>
                        {finishData.isSuccess ? '⚡' : '⏳'}
                    </Text>

                    <Text style={[
                        styles.modalTitle, 
                        { color: finishData.isSuccess ? '#2E7D32' : '#F57F17' }
                    ]}>
                        {finishData.title}
                    </Text>
                    
                    <View style={styles.resultScoreContainer}>
                        <Text style={styles.resultScoreLabel}>SKOR AKHIR</Text>
                        <Text style={styles.resultScoreValue}>
                            {finishData.finalScore} / {TOTAL_ROUNDS_LEN}
                        </Text>
                    </View>

                    <Text style={styles.modalText}>
                        {finishData.message}
                    </Text>

                    <TouchableOpacity 
                        style={[
                            styles.modalBtnFull, 
                            { backgroundColor: finishData.isSuccess ? '#4CAF50' : '#FFB300' }
                        ]} 
                        onPress={handleFinishClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.modalBtnText}>
                            {finishData.isSuccess ? 'Seterusnya 🚀'  : 'Cuba Lagi 🔄'}
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
  safe: { flex: 1, justifyContent: 'center', padding: 20 },
  
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
      borderColor: '#E65100', // Warna Oren Gelap
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
    borderRadius: 26,
    padding: 26,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#fff',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    zIndex: 1
  },

  title: { fontSize: 36, fontFamily: 'Sniglet_800ExtraBold', color: '#E65100', marginBottom: 5 },
  desc: { fontSize: 18, fontFamily: 'Sniglet_400Regular', color: '#F57C00', marginBottom: 15, textAlign: 'center' },

  progressWrap: { width: '100%', marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 18, color: '#E65100', fontFamily: 'Sniglet_400Regular' },
  scoreLabel: { fontSize: 18, color: '#E65100', fontFamily: 'Sniglet_800ExtraBold' },

  progressBg: {
    width: '100%', height: 16, backgroundColor: '#FFE0B2',
    borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#FFB74D'
  },
  progressFill: { height: '100%', backgroundColor: '#FB8C00' },

  // Timer Styles
  timerContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  timerText: { fontSize: 24, fontFamily: 'Sniglet_800ExtraBold', color: '#E65100', marginRight: 10, width: 90 },
  timerDanger: { color: '#D32F2F' },
  timerTrack: {
    flex: 1, height: 14, backgroundColor: '#FFCCBC',
    borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#FFAB91'
  },
  timerFill: { height: '100%' },

  // Sound Button
  soundBtn: { 
      backgroundColor: '#FFF3E0', 
      width: 140, height: 140, borderRadius: 30, 
      marginVertical: 10, alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#FFB74D', elevation: 4
  },
  soundLabel: { fontSize: 16, fontFamily: 'Sniglet_400Regular', color: '#EF6C00', marginTop: 5 },

  // Options
  options: { width: '100%', marginTop: 15, flexDirection: 'row', justifyContent: 'space-around' },
  option: {
    backgroundColor: '#FF9800', // Warna Oren terang
    width: 90, height: 90,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff'
  },
  optionText: { fontSize: 40, color: '#fff', fontFamily: 'Sniglet_800ExtraBold' },

  correct: { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  wrong: { backgroundColor: '#C62828', borderColor: '#B71C1C' },
  missed: { backgroundColor: '#81C784', opacity: 0.8 }, 

  /* ---------- MODAL STYLES (Oren Theme) ---------- */
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
    borderWidth: 5,
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
  resultScoreContainer: {
    backgroundColor: '#FFF3E0', // Oren Pudar
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCC80'
  },
  resultScoreLabel: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 14,
    color: '#E65100',
    marginBottom: 2
  },
  resultScoreValue: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 36,
    color: '#BF360C'
  }
});