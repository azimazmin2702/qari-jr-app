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

const LETTER_GROUPS = [
  { base: 'ا', forms: [{l:'اَ',r:'A',a:require('../assets/audio/fathah/fathahAlif.m4a')}, {l:'اِ',r:'I',a:require('../assets/audio/kasrah/kasrahAlif.m4a')}, {l:'اُ',r:'U',a:require('../assets/audio/dhammah/dhammahAlif.m4a')}] },
  { base: 'ب', forms: [{l:'بَ',r:'Ba',a:require('../assets/audio/fathah/fathahBa.m4a')}, {l:'بِ',r:'Bi',a:require('../assets/audio/kasrah/kasrahBa.m4a')}, {l:'بُ',r:'Bu',a:require('../assets/audio/dhammah/dhammahBa.m4a')}] },
  { base: 'ت', forms: [{l:'تَ',r:'Ta',a:require('../assets/audio/fathah/fathahTa.m4a')}, {l:'تِ',r:'Ti',a:require('../assets/audio/kasrah/kasrahTa.m4a')}, {l:'تُ',r:'Tu',a:require('../assets/audio/dhammah/dhammahTa.m4a')}] },
  { base: 'ج', forms: [{l:'جَ',r:'Ja',a:require('../assets/audio/fathah/fathahJim.m4a')}, {l:'جِ',r:'Ji',a:require('../assets/audio/kasrah/kasrahJim.m4a')}, {l:'جُ',r:'Ju',a:require('../assets/audio/dhammah/dhammahJim.m4a')}] },
  { base: 'د', forms: [{l:'دَ',r:'Da',a:require('../assets/audio/fathah/fathahDal.m4a')}, {l:'دِ',r:'Di',a:require('../assets/audio/kasrah/kasrahDal.m4a')}, {l:'دُ',r:'Du',a:require('../assets/audio/dhammah/dhammahDal.m4a')}] },
  { base: 'ر', forms: [{l:'رَ',r:'Ro',a:require('../assets/audio/fathah/fathahRo.m4a')}, {l:'رِ',r:'Ri',a:require('../assets/audio/kasrah/kasrahRo.m4a')}, {l:'رُ',r:'Ru',a:require('../assets/audio/dhammah/dhammahRo.m4a')}] },
  { base: 'س', forms: [{l:'سَ',r:'Sa',a:require('../assets/audio/fathah/fathahSin.m4a')}, {l:'سِ',r:'Si',a:require('../assets/audio/kasrah/kasrahSin.m4a')}, {l:'سُ',r:'Su',a:require('../assets/audio/dhammah/dhammahSin.m4a')}] },
  { base: 'م', forms: [{l:'مَ',r:'Ma',a:require('../assets/audio/fathah/fathahMim.m4a')}, {l:'مِ',r:'Mi',a:require('../assets/audio/kasrah/kasrahMim.m4a')}, {l:'مُ',r:'Mu',a:require('../assets/audio/dhammah/dhammahMim.m4a')}] },
];

const ALL_ITEMS = LETTER_GROUPS.flatMap(g => g.forms);

/* ===================== CONFIG ===================== */

const LEVEL_NUM = 5;
const TOTAL_QUESTIONS = 10;
const PASS_SCORE = 7;
const TIME_PER_QUESTION = 10;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const BACKGROUND_IMAGE = require('../assets/images/level5bg.png'); 

type QuestionType = 'AUDIO_MATCH' | 'RUMI_MATCH';

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

export default function Level5() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [qType, setQType] = useState<QuestionType>('AUDIO_MATCH');
  const [options, setOptions] = useState<any[]>([]);
  
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

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

  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;
  const soundBtnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const answerScaleAnim = useRef(new Animated.Value(1)).current;

  const soundRef = useRef<Audio.Sound | null>(null);
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);
  const clickSound = useRef<Audio.Sound | null>(null);
  const clockSound = useRef<Audio.Sound | null>(null);
  const celebrateSound = useRef<Audio.Sound | null>(null); // <--- 1. TAMBAH REF CELEBRATE 
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);

  /* ---------- 1. DISABLE BACK BUTTON ---------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showFinishModal) return true;
        handleExitPress(); 
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [showFinishModal])
  );

  /* ---------- INIT ---------- */
  useEffect(() => {
    isActiveRef.current = true;
    
    (async () => {
      try {
        const c = new Audio.Sound(); await c.loadAsync(require('../assets/sounds/correct.mp3'));
        correctSound.current = c;
        const w = new Audio.Sound(); await w.loadAsync(require('../assets/sounds/wrong.mp3'));
        wrongSound.current = w;
        const clk = new Audio.Sound(); await clk.loadAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = clk;
        
        // <--- 2. LOAD SOUND CELEBRATES
        const cel = new Audio.Sound(); await cel.loadAsync(require('../assets/sounds/celebrates.mp3'));
        celebrateSound.current = cel;

        const tick = new Audio.Sound();
        await tick.loadAsync(require('../assets/sounds/clockticking.mp3'));
        await tick.setIsLoopingAsync(true);
        await tick.playAsync();
        clockSound.current = tick;

      } catch (e) {
          console.log("Audio Error", e);
      }
    })();

    generateQuestion(0); // Mula dengan round 0

    return () => {
      isActiveRef.current = false;
      stopTimer();
      soundRef.current?.unloadAsync();
      correctSound.current?.unloadAsync();
      wrongSound.current?.unloadAsync();
      clickSound.current?.unloadAsync();
      celebrateSound.current?.unloadAsync(); // <--- 3. UNLOAD SOUND
      if (clockSound.current) {
          clockSound.current.stopAsync();
          clockSound.current.unloadAsync();
      }
    };
  }, []);

  /* ---------- TIMER HELPERS ---------- */
  const startTimer = (initialTime?: number) => {
    stopTimer();
    Animated.timing(timerAnim, {
        toValue: 0,
        duration: (initialTime || timeLeft) * 1000, 
        useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          stopTimer();
          onTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
  };

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

  const handleExitPress = () => {
      playFeedback('click');
      stopTimer();
      timerAnim.stopAnimation(); 
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
      startTimer();
  }

  /* ---------- GAME LOGIC (FIXED PROGRESS BAR) ---------- */
  const generateQuestion = async (nextRoundIndex?: number) => {
    const currentRound = nextRoundIndex !== undefined ? nextRoundIndex : round;

    const correctItem = ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)];
    setCurrentQ(correctItem);

    const type: QuestionType = Math.random() > 0.5 ? 'AUDIO_MATCH' : 'RUMI_MATCH';
    setQType(type);

    const pool = ALL_ITEMS.filter(i => i.l !== correctItem.l);
    const distractors = shuffle(pool).slice(0, 3);
    setOptions(shuffle([correctItem, ...distractors]));

    setAnswered(false);
    setSelected(null);
    setTimeLeft(TIME_PER_QUESTION);
    answerScaleAnim.setValue(1);
    shakeAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: currentRound / TOTAL_QUESTIONS,
      duration: 400,
      useNativeDriver: false,
    }).start();

    timerAnim.setValue(1);
    startTimer(TIME_PER_QUESTION);

    if (type === 'AUDIO_MATCH') {
       setTimeout(() => playSoundItem(correctItem.a), 500);
    }
  };

  const playSoundItem = async (audioFile: any) => {
    try {
      if (!isActiveRef.current) return;
      Animated.sequence([
        Animated.timing(soundBtnScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(soundBtnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      await soundRef.current?.unloadAsync();
      const s = new Audio.Sound();
      await s.loadAsync(audioFile);
      soundRef.current = s;
      await s.replayAsync();
    } catch {}
  };

  const onTimeUp = () => {
    if (answered) return;
    setAnswered(true);
    playFeedback('wrong');
    Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    proceedNext(score);
  };

  const onChoose = (item: any, index: number) => {
    if (answered) return;
    stopTimer();
    timerAnim.stopAnimation();

    setAnswered(true);
    setSelected(index);

    const isCorrect = item.l === currentQ.l;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    Animated.sequence([
        Animated.timing(answerScaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.spring(answerScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    if (isCorrect) {
        playFeedback('correct');
        if (qType === 'RUMI_MATCH') {
            playSoundItem(item.a);
        }
    } else {
        playFeedback('wrong');
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    }

    proceedNext(newScore);
  };

  const proceedNext = (currentScore: number) => {
    setTimeout(() => {
        if (round + 1 >= TOTAL_QUESTIONS) {
          finishLevel(currentScore);
        } else {
          const nextR = round + 1;
          setRound(nextR);
          generateQuestion(nextR);
        }
      }, 1500);
  };

  const finishLevel = async (finalScore: number) => {
    stopTimer();
    clockSound.current?.stopAsync();

    const raw = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
    const profile = raw ? JSON.parse(raw) : null;
    await saveLevelScore(LEVEL_NUM, finalScore, profile?.id);

    const isSuccess = finalScore >= PASS_SCORE;
    
    // <--- 4. PLAY SOUND JIKA SUCCESS
    if (isSuccess) {
      try {
        await celebrateSound.current?.replayAsync();
      } catch (e) {
        console.log("Error playing celebrate sound", e);
      }
    }

    const title = isSuccess ? 'TAHNIAH! 🎉' : 'Belum Rezeki';
    const message = isSuccess 
        ? "Anda sekarang adalah\nQari Jr Lagenda!" 
        : "Cuba lagi untuk capai tahap Lagenda!";

    setFinishData({ title, message, isSuccess, finalScore });
    setShowFinishModal(true);
  };

  const handleFinishClose = () => {
      playFeedback('click');
      setShowFinishModal(false);
      router.push('/game');
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] });
  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  if (!fontsLoaded || !currentQ) return null;

  /* ---------- UI RENDER ---------- */
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

        {/* CARD UTAMA */}
        <View style={styles.card}>
          <Text style={styles.title}>CABARAN MINDA</Text>
          
          <View style={styles.headerRow}>
              <View style={{flex: 1}}>
                  <Text style={styles.subText}>Soalan {round + 1}/{TOTAL_QUESTIONS}</Text>
                  <View style={styles.progressBg}>
                      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                  </View>
              </View>
              <View style={{marginLeft: 15, alignItems: 'flex-end'}}>
                  <Text style={styles.subText}>Skor: {score}</Text>
                  <Text style={[styles.timerText, timeLeft <= 3 && styles.timerDanger]}>⏱️ {timeLeft}</Text>
              </View>
          </View>

          <View style={styles.timerTrack}>
              <Animated.View style={[styles.timerFill, { width: timerWidth }]} />
          </View>

          {/* Soalan Area */}
          <View style={styles.questionArea}>
              {qType === 'AUDIO_MATCH' ? (
                  <>
                      <Text style={styles.instruction}>Dengar bunyi ini:</Text>
                      <TouchableOpacity 
                          activeOpacity={0.8}
                          onPress={() => playSoundItem(currentQ.a)}
                      >
                          <Animated.View style={[styles.soundBtn, { transform: [{ scale: soundBtnScale }] }]}>
                              <Text style={{ fontSize: 60 }}>🔊</Text>
                          </Animated.View>
                      </TouchableOpacity>
                  </>
              ) : (
                  <>
                      <Text style={styles.instruction}>Pilih baris huruf untuk:</Text>
                      <View style={styles.rumiBox}>
                          <Text style={styles.rumiText}>{currentQ.r}</Text>
                      </View>
                  </>
              )}
          </View>

          {/* Pilihan Jawapan */}
          <View style={styles.optionsGrid}>
              {options.map((item, index) => {
                  const isCorrect = item.l === currentQ.l;
                  const isSelected = selected === index;
                  
                  let feedbackStyle = {};
                  if (answered) {
                      if (isCorrect) feedbackStyle = styles.optionCorrect;
                      else if (isSelected) feedbackStyle = styles.optionWrong;
                  }

                  const animatedStyle = {
                      transform: [
                          { scale: isSelected ? answerScaleAnim : 1 },
                          { translateX: isSelected && !isCorrect ? shakeX : 0 }
                      ]
                  };

                  return (
                      <Animated.View 
                          key={index} 
                          style={[styles.optionWrapper, animatedStyle]}
                      >
                          <TouchableOpacity
                              disabled={answered || timeLeft === 0}
                              style={[styles.optionBtn, feedbackStyle]} 
                              onPress={() => onChoose(item, index)}
                              activeOpacity={0.9}
                          >
                              <Text style={styles.optionText}>{item.l}</Text>
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

        {/* ================= LEGEND FINISH MODAL ================= */}
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
                    
                    {finishData.isSuccess ? (
                        <View style={{ alignItems: 'center', marginBottom: 15 }}>
                             <Text style={{ fontSize: 30, marginBottom: -10 }}>🎉  ✨  🎉</Text>
                             <Text style={{ fontSize: 90 }}>🏆</Text>
                             <Text style={{ fontSize: 30, marginTop: -10 }}>🎊  ✨  🎊</Text>
                        </View>
                    ) : (
                        <Text style={{ fontSize: 80, marginBottom: 15 }}>💪</Text>
                    )}

                    <Text style={[
                        styles.modalTitle, 
                        { color: finishData.isSuccess ? '#F57F17' : '#7B1FA2', fontSize: 34 }
                    ]}>
                        {finishData.title}
                    </Text>
                    
                    <View style={[
                        styles.resultScoreContainer,
                        finishData.isSuccess && { backgroundColor: '#FFFDE7', borderColor: '#FBC02D' }
                    ]}>
                        <Text style={[
                            styles.resultScoreLabel,
                            finishData.isSuccess && { color: '#F57F17' }
                        ]}>
                            SKOR AKHIR
                        </Text>
                        <Text style={[
                            styles.resultScoreValue,
                            finishData.isSuccess && { color: '#E65100' }
                        ]}>
                            {finishData.finalScore} / {TOTAL_QUESTIONS}
                        </Text>
                    </View>

                    <Text style={[styles.modalText, { fontSize: 20 }]}>
                        {finishData.message}
                    </Text>

                    <TouchableOpacity 
                        style={[
                            styles.modalBtnFull, 
                            { backgroundColor: finishData.isSuccess ? '#FFB300' : '#AB47BC' }
                        ]} 
                        onPress={handleFinishClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.modalBtnText}>
                            {finishData.isSuccess ? 'Terima Kasih! 🌟' : 'Cuba Lagi 🔄'}
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
      borderColor: '#AB47BC', 
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
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#fff',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    zIndex: 1
  },

  title: { fontSize: 32, fontFamily: 'Sniglet_800ExtraBold', color: '#7B1FA2', marginBottom: 10 },
  
  headerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  subText: { fontFamily: 'Sniglet_400Regular', fontSize: 18, color: '#6A1B9A' },
  
  progressBg: { width: '100%', height: 10, backgroundColor: '#E1BEE7', borderRadius: 5, marginTop: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#AB47BC' },

  timerText: { fontSize: 22, fontWeight: 'bold', color: '#7B1FA2' },
  timerDanger: { color: '#D32F2F' },
  timerTrack: { width: '100%', height: 6, backgroundColor: '#FFCDD2', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: '#D32F2F' },

  questionArea: { alignItems: 'center', marginVertical: 20, minHeight: 140, justifyContent: 'center' },
  instruction: { fontSize: 20, color: '#4A148C', fontFamily: 'Sniglet_400Regular', marginBottom: 10 },
  
  soundBtn: { 
      backgroundColor: '#F3E5F5', 
      width: 110, height: 110, borderRadius: 55, 
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#AB47BC', elevation: 5
  },
  
  rumiBox: {
      backgroundColor: '#8E24AA',
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 20,
      elevation: 5,
      borderWidth: 3,
      borderColor: '#fff'
  },
  rumiText: { fontSize: 48, color: '#fff', fontWeight: 'bold' },

  optionsGrid: { 
      width: '100%', 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between' 
  },
  optionWrapper: { width: '48%', marginBottom: 15 },
  
  optionBtn: {
      backgroundColor: '#BA68C8',
      height: 80,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      borderWidth: 2,
      borderColor: '#fff'
  },
  
  optionCorrect: { backgroundColor: '#4CAF50', borderColor: '#1B5E20' },
  optionWrong: { backgroundColor: '#F44336', borderColor: '#B71C1C' },
  
  optionText: { fontSize: 38, color: '#fff', fontFamily: 'Sniglet_800ExtraBold' },

  /* ---------- MODAL STYLES ---------- */
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
    backgroundColor: '#F3E5F5',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CE93D8'
  },
  resultScoreLabel: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 14,
    color: '#6A1B9A',
    marginBottom: 2
  },
  resultScoreValue: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 36,
    color: '#4A148C'
  }
});