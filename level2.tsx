// app/level2.tsx
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

const LETTERS = [
  { key: 'ا', file: require('../assets/audio/Alif.m4a') },
  { key: 'ب', file: require('../assets/audio/Ba.m4a') },
  { key: 'ج', file: require('../assets/audio/Jim.m4a') },
  { key: 'د', file: require('../assets/audio/Dal.m4a') },
  { key: 'ك', file: require('../assets/audio/Kaf.m4a') },
  { key: 'م', file: require('../assets/audio/Mim.m4a') },
  { key: 'و', file: require('../assets/audio/Wau.m4a') },
  { key: 'ص', file: require('../assets/audio/Shod.m4a') },
  { key: 'ع', file: require('../assets/audio/Ain.m4a') },
  { key: 'ي', file: require('../assets/audio/Ya.m4a') },
];

const TOTAL_ROUNDS = 10;
const LEVEL_NUM = 2;
const PASS_SCORE = 7;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
// Pastikan gambar ini wujud dalam folder assets/images
const BACKGROUND_IMAGE = require('../assets/images/level2bg.png'); 

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

export default function Level2() {
  const router = useRouter();

  /* ---------- HOOKS ---------- */
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);

  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  
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

  // Animasi UI
  const soundBtnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Sound Refs
  const bgMusic = useRef<Audio.Sound | null>(null);
  const hurufSound = useRef<Audio.Sound | null>(null);
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);
  const clickSound = useRef<Audio.Sound | null>(null);

  /* ---------- 1. DISABLE BACK BUTTON ---------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showFinishModal) return true;
        setShowExitModal(true); 
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showFinishModal])
  );

  /* ---------- LOAD RESOURCES & MUSIC ---------- */
  useEffect(() => {
    setQuestionOrder(shuffle(LETTERS.map((_, i) => i)));

    (async () => {
      try {
        const c = new Audio.Sound(); await c.loadAsync(require('../assets/sounds/correct.mp3'));
        correctSound.current = c;
        const w = new Audio.Sound(); await w.loadAsync(require('../assets/sounds/wrong.mp3'));
        wrongSound.current = w;
        const clk = new Audio.Sound(); await clk.loadAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = clk;

        const bgm = new Audio.Sound();
        await bgm.loadAsync(require('../assets/sounds/gamemusic.mp3'));
        await bgm.setIsLoopingAsync(true);
        await bgm.setVolumeAsync(0.3);
        await bgm.playAsync();
        bgMusic.current = bgm;

      } catch (e) {
          console.log("Audio Error:", e);
      }
    })();

    return () => {
      hurufSound.current?.unloadAsync();
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
          await bgMusic.current.setVolumeAsync(0.3);
          setIsMuted(false);
      } else {
          await bgMusic.current.setVolumeAsync(0.0);
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

  /* ---------- EXIT HANDLERS ---------- */
  const handleExitPress = () => {
      playFeedback('click');
      setShowExitModal(true);
  }

  const confirmExit = async () => {
      playFeedback('click');
      setShowExitModal(false);
      if(bgMusic.current) await bgMusic.current.stopAsync();
      router.replace('/game');
  }

  const cancelExit = () => {
      playFeedback('click');
      setShowExitModal(false);
  }

  /* ---------- FINISH HANDLERS ---------- */
  const handleFinishClose = () => {
      playFeedback('click');
      setShowFinishModal(false);
      router.push('/game');
  };

  /* ---------- GAME LOOP ---------- */
  useEffect(() => {
    if (!questionOrder.length) return;

    const currentIdx = round - 1;
    if (currentIdx >= questionOrder.length) return;

    const correctIdx = questionOrder[currentIdx];
    const pool = LETTERS.map((_, i) => i).filter(i => i !== correctIdx);
    setOptions(shuffle([correctIdx, ...shuffle(pool).slice(0, 2)]));

    setAnswered(false);
    setSelected(null);

    Animated.timing(progressAnim, {
      toValue: (round - 1) / TOTAL_ROUNDS,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // Auto play sound selepas sedikit delay
    setTimeout(() => playQuestionSound(correctIdx), 800);

  }, [round, questionOrder]);

  const playQuestionSound = async (idx: number) => {
    try {
      Animated.sequence([
        Animated.timing(soundBtnScale, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(soundBtnScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      await hurufSound.current?.unloadAsync();
      const s = new Audio.Sound();
      await s.loadAsync(LETTERS[idx].file);
      hurufSound.current = s;
      await s.replayAsync();
    } catch {}
  };

  const onChoose = (idx: number) => {
    if (answered) return;
    setAnswered(true);
    setSelected(idx);

    const correctIdx = questionOrder[round - 1];
    const isCorrect = idx === correctIdx;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    if (isCorrect) {
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
      if (round >= TOTAL_ROUNDS) {
        finishLevel(newScore);
      } else {
        setRound(r => r + 1);
      }
    }, 1200);
  };

  const finishLevel = async (finalScore: number) => {
    if(bgMusic.current) {
        await bgMusic.current.stopAsync();
    }

    const raw = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    await saveLevelScore(LEVEL_NUM, finalScore, profile?.id);

    const isSuccess = finalScore >= PASS_SCORE;
    const title = isSuccess ? 'Tahniah! 🎉' : 'Siap! 👍';
    const message = isSuccess 
        ? "Hebat! Tahap seterusnya dibuka!" 
        : "Cuba lagi untuk markah lebih tinggi.";

    setFinishData({ title, message, isSuccess, finalScore });
    setShowFinishModal(true);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  
  if (!fontsLoaded) return null;

  /* ---------- UI ---------- */
  return (
    // WRAP DENGAN IMAGE BACKGROUND
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

        {/* KAD UTAMA */}
        <View style={styles.card}>
          <Text style={styles.title}>TAHAP 2</Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
               <Text style={styles.progressLabel}>Soalan {round} / {TOTAL_ROUNDS}</Text>
               <Text style={styles.scoreLabel}>Skor: {score}</Text>
            </View>
            <View style={styles.progressBg}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>

          <Text style={styles.hint}>Dengar dan pilih huruf...</Text>

          <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => playQuestionSound(questionOrder[round - 1])}
          >
              <Animated.View style={[styles.soundBtn, { transform: [{ scale: soundBtnScale }] }]}>
                  <Text style={{ fontSize: 70 }}>🔊</Text>
                  <Text style={styles.soundLabel}>Tekan Semula</Text>
              </Animated.View>
          </TouchableOpacity>

          <View style={styles.choices}>
            {options.map(i => {
              const correctIdx = questionOrder[round - 1];
              const isCorrectAnswer = answered && i === correctIdx;
              const isWrong = answered && selected === i && i !== correctIdx;

              return (
                <Animated.View
                  key={i}
                  style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}
                >
                  <TouchableOpacity 
                      disabled={answered} 
                      activeOpacity={0.8}
                      onPress={() => onChoose(i)}
                  >
                    <View
                      style={[
                        styles.choiceBtn,
                        isCorrectAnswer && styles.correct, 
                        isWrong && styles.wrong, 
                      ]}
                    >
                      <Text style={styles.choiceText}>{LETTERS[i].key}</Text>
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
            onRequestClose={handleFinishClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[
                    styles.modalCard, 
                    { borderColor: finishData.isSuccess ? '#2E7D32' : '#F9A825' }
                ]}>
                    <Text style={{ fontSize: 60, marginBottom: 10 }}>
                        {finishData.isSuccess ? '🏆' : '💪'}
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
                            {finishData.finalScore} / {TOTAL_ROUNDS}
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
      borderColor: '#0288D1', // Biru
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

  // Kad Utama
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

  title: { fontSize: 36, fontFamily: 'Sniglet_800ExtraBold', color: '#0277BD', marginBottom: 10 },
  
  progressWrap: { width: '100%', marginVertical: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 18, color: '#01579B', fontFamily: 'Sniglet_400Regular' },
  scoreLabel: { fontSize: 18, color: '#01579B', fontFamily: 'Sniglet_800ExtraBold' },

  progressBg: {
    width: '100%', height: 20, backgroundColor: '#BBDEFB',
    borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#64B5F6'
  },
  progressFill: { height: '100%', backgroundColor: '#2196F3' },
  
  hint: {
    fontSize: 24, color: '#0277BD', marginBottom: 10,
    fontFamily: 'Sniglet_400Regular', textAlign: 'center'
  },
  
  soundBtn: { 
      backgroundColor: '#E1F5FE', 
      width: 160, height: 160, borderRadius: 30, 
      marginVertical: 10, alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#4FC3F7', elevation: 4
  },
  soundLabel: { fontSize: 16, fontFamily: 'Sniglet_400Regular', color: '#0288D1', marginTop: 5 },
  
  choices: { width: '100%', marginTop: 10, flexDirection: 'row', justifyContent: 'space-around' },
  
  choiceBtn: {
    backgroundColor: '#4FC3F7', // Warna Biru
    width: 90, height: 90, 
    borderRadius: 20,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff'
  },
  choiceText: { fontSize: 45, fontFamily: 'Sniglet_800ExtraBold', color: '#fff' },
  
  correct: { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  wrong: { backgroundColor: '#C62828', borderColor: '#B71C1C' },

  /* ---------- MODAL STYLES (Copied from Level 1) ---------- */
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