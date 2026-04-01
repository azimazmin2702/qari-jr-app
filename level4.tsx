// app/level4.tsx
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
  ScrollView,
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
  { base: 'ا', forms: [{ label: 'اَ', audio: require('../assets/audio/fathah/fathahAlif.m4a') }, { label: 'اِ', audio: require('../assets/audio/kasrah/kasrahAlif.m4a') }, { label: 'اُ', audio: require('../assets/audio/dhammah/dhammahAlif.m4a') }] },
  { base: 'ب', forms: [{ label: 'بَ', audio: require('../assets/audio/fathah/fathahBa.m4a') }, { label: 'بِ', audio: require('../assets/audio/kasrah/kasrahBa.m4a') }, { label: 'بُ', audio: require('../assets/audio/dhammah/dhammahBa.m4a') }] },
  { base: 'ت', forms: [{ label: 'تَ', audio: require('../assets/audio/fathah/fathahTa.m4a') }, { label: 'تِ', audio: require('../assets/audio/kasrah/kasrahTa.m4a') }, { label: 'تُ', audio: require('../assets/audio/dhammah/dhammahTa.m4a') }] },
  { base: 'ج', forms: [{ label: 'جَ', audio: require('../assets/audio/fathah/fathahJim.m4a') }, { label: 'جِ', audio: require('../assets/audio/kasrah/kasrahJim.m4a') }, { label: 'جُ', audio: require('../assets/audio/dhammah/dhammahJim.m4a') }] },
  { base: 'د', forms: [{ label: 'دَ', audio: require('../assets/audio/fathah/fathahDal.m4a') }, { label: 'دِ', audio: require('../assets/audio/kasrah/kasrahDal.m4a') }, { label: 'دُ', audio: require('../assets/audio/dhammah/dhammahDal.m4a') }] },
  { base: 'ر', forms: [{ label: 'رَ', audio: require('../assets/audio/fathah/fathahRo.m4a') }, { label: 'رِ', audio: require('../assets/audio/kasrah/kasrahRo.m4a') }, { label: 'رُ', audio: require('../assets/audio/dhammah/dhammahRo.m4a') }] },
  { base: 'ز', forms: [{ label: 'زَ', audio: require('../assets/audio/fathah/fathahZai.m4a') }, { label: 'زِ', audio: require('../assets/audio/kasrah/kasrahZai.m4a') }, { label: 'زُ', audio: require('../assets/audio/dhammah/dhammahZai.m4a') }] },
  { base: 'س', forms: [{ label: 'سَ', audio: require('../assets/audio/fathah/fathahSin.m4a') }, { label: 'سِ', audio: require('../assets/audio/kasrah/kasrahSin.m4a') }, { label: 'سُ', audio: require('../assets/audio/dhammah/dhammahSin.m4a') }] },
  { base: 'ش', forms: [{ label: 'شَ', audio: require('../assets/audio/fathah/fathahSyin.m4a') }, { label: 'شِ', audio: require('../assets/audio/kasrah/kasrahSyin.m4a') }, { label: 'شُ', audio: require('../assets/audio/dhammah/dhammahSyin.m4a') }] },
  { base: 'ف', forms: [{ label: 'فَ', audio: require('../assets/audio/fathah/fathahFa.m4a') }, { label: 'فِ', audio: require('../assets/audio/kasrah/kasrahFa.m4a') }, { label: 'فُ', audio: require('../assets/audio/dhammah/dhammahFa.m4a') }] },
  { base: 'ك', forms: [{ label: 'كَ', audio: require('../assets/audio/fathah/fathahKaf.m4a') }, { label: 'كِ', audio: require('../assets/audio/kasrah/kasrahKaf.m4a') }, { label: 'كُ', audio: require('../assets/audio/dhammah/dhammahKaf.m4a') }] },
  { base: 'ل', forms: [{ label: 'لَ', audio: require('../assets/audio/fathah/fathahLam.m4a') }, { label: 'لِ', audio: require('../assets/audio/kasrah/kasrahLam.m4a') }, { label: 'لُ', audio: require('../assets/audio/dhammah/dhammahLam.m4a') }] },
  { base: 'م', forms: [{ label: 'مَ', audio: require('../assets/audio/fathah/fathahMim.m4a') }, { label: 'مِ', audio: require('../assets/audio/kasrah/kasrahMim.m4a') }, { label: 'مُ', audio: require('../assets/audio/dhammah/dhammahMim.m4a') }] },
  { base: 'ن', forms: [{ label: 'نَ', audio: require('../assets/audio/fathah/fathahNun.m4a') }, { label: 'نِ', audio: require('../assets/audio/kasrah/kasrahNun.m4a') }, { label: 'نُ', audio: require('../assets/audio/dhammah/dhammahNun.m4a') }] },
  { base: 'و', forms: [{ label: 'وَ', audio: require('../assets/audio/fathah/fathahWau.m4a') }, { label: 'وِ', audio: require('../assets/audio/kasrah/kasrahWau.m4a') }, { label: 'وُ', audio: require('../assets/audio/dhammah/dhammahWau.m4a') }] },
  { base: 'ح', forms: [{ label: 'حَ', audio: require('../assets/audio/fathah/fathahHa.m4a') }, { label: 'حِ', audio: require('../assets/audio/kasrah/kasrahHa.m4a') }, { label: 'حُ', audio: require('../assets/audio/dhammah/dhammahHa.m4a') }] },
  { base: 'خ', forms: [{ label: 'خَ', audio: require('../assets/audio/fathah/fathahKho.m4a') }, { label: 'خِ', audio: require('../assets/audio/kasrah/kasrahKho.m4a') }, { label: 'خُ', audio: require('../assets/audio/dhammah/dhammahKho.m4a') }] },
  { base: 'ي', forms: [{ label: 'يَ', audio: require('../assets/audio/fathah/fathahYa.m4a') }, { label: 'يِ', audio: require('../assets/audio/kasrah/kasrahYa.m4a') }, { label: 'يُ', audio: require('../assets/audio/dhammah/dhammahYa.m4a') }] },
];

const TUTORIAL_DATA = [
    { label: 'سَ', audio: require('../assets/audio/fathah/fathahSin.m4a') },
    { label: 'كِ', audio: require('../assets/audio/kasrah/kasrahKaf.m4a') },
    { label: 'رُ', audio: require('../assets/audio/dhammah/dhammahRo.m4a') },
];

const ITEMS = LETTER_GROUPS.flatMap(g => g.forms);

/* ===================== CONFIG ===================== */

const LEVEL_NUM = 4;
const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT = 3;
const SEQUENCE_LENGTH = 3;
const PASS_SCORE = 7;
const TIME_PER_QUESTION = 15;
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const BACKGROUND_IMAGE = require('../assets/images/level4bg.png'); 

/* ===================== UTIL ===================== */

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSequence() {
  return shuffle(ITEMS.map((_, i) => i)).slice(0, SEQUENCE_LENGTH);
}

/* ===================== COMPONENT ===================== */

export default function Level4() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [question, setQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctSeq, setCorrectSeq] = useState<number[]>([]);
  const [options, setOptions] = useState<number[][]>([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number[] | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  
  // STATE TUTORIAL
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialActiveIndex, setTutorialActiveIndex] = useState<number | null>(null);
  const [isTutorialPlaying, setIsTutorialPlaying] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

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
        
        const tick = new Audio.Sound(); 
        await tick.loadAsync(require('../assets/sounds/clockticking.mp3'));
        await tick.setIsLoopingAsync(true);
        clockSound.current = tick;

      } catch (e) {
          console.log("Audio Error:", e);
      }
    })();

    playTutorialLoop();

    return () => {
      isActiveRef.current = false;
      stopTimer();
      soundRef.current?.unloadAsync();
      correctSound.current?.unloadAsync();
      wrongSound.current?.unloadAsync();
      clickSound.current?.unloadAsync();
      if (clockSound.current) {
          clockSound.current.stopAsync();
          clockSound.current.unloadAsync();
      }
    };
  }, []);

  /* ---------- TUTORIAL LOGIC ---------- */
  const playTutorialLoop = async () => {
      if (!isActiveRef.current || !showTutorial || isTutorialPlaying) return;

      setIsTutorialPlaying(true); 

      await new Promise(r => setTimeout(r, 500));

      for (let i = 0; i < TUTORIAL_DATA.length; i++) {
          if (!isActiveRef.current || !showTutorial) {
              setIsTutorialPlaying(false);
              return;
          }
          
          setTutorialActiveIndex(i); 
          
          try {
            await soundRef.current?.unloadAsync();
            const s = new Audio.Sound();
            await s.loadAsync(TUTORIAL_DATA[i].audio);
            soundRef.current = s;
            await s.replayAsync();
          } catch {}

          await new Promise(r => setTimeout(r, 1200));
      }

      setTutorialActiveIndex(null); 
      setIsTutorialPlaying(false); 
  };

  const startGame = () => {
      playFeedback('click');
      setShowTutorial(false);
      clockSound.current?.playAsync(); 
      nextQuestion(0); // FIX: Mula dengan index 0 secara eksplisit
  }

  /* ---------- GAME FUNCTIONS ---------- */
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
      if (!showTutorial) startTimer();
  }

  const handleFinishClose = () => {
      playFeedback('click');
      setShowFinishModal(false);
      router.push('/game');
  };

  /* ---------- GAME LOOP (FIXED) ---------- */
  // Update: Terima parameter 'idx' untuk mengelakkan masalah state lambat update
  const nextQuestion = async (idx?: number) => {
    // Jika idx diberi, guna ia. Jika tidak, guna state question sedia ada.
    const currentIdx = idx !== undefined ? idx : question;

    const correct = generateSequence();
    const opts = [correct];

    while (opts.length < OPTIONS_COUNT) {
      const candidate = generateSequence();
      if (!opts.some(o => JSON.stringify(o) === JSON.stringify(candidate))) {
        opts.push(candidate);
      }
    }

    setCorrectSeq(correct);
    setOptions(shuffle(opts));
    setAnswered(false);
    setSelected(null);
    setTimeLeft(TIME_PER_QUESTION);

    answerScaleAnim.setValue(1);
    shakeAnim.setValue(0);

    // FIX: Gunakan currentIdx untuk progress bar supaya selari
    Animated.timing(progressAnim, {
      toValue: currentIdx / TOTAL_QUESTIONS,
      duration: 400,
      useNativeDriver: false,
    }).start();

    timerAnim.setValue(1);
    startTimer(TIME_PER_QUESTION);

    await new Promise(r => setTimeout(r, 500));
    playSequence(correct);
  };

  const playSound = async (idx: number) => {
    try {
      if (!isActiveRef.current) return;
      Animated.sequence([
        Animated.timing(soundBtnScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(soundBtnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();

      await soundRef.current?.unloadAsync();
      const s = new Audio.Sound();
      await s.loadAsync(ITEMS[idx].audio);
      soundRef.current = s;
      await s.replayAsync();
    } catch {}
  };

  const playSequence = async (seq: number[]) => {
    for (const idx of seq) {
      if (!isActiveRef.current) return;
      await playSound(idx);
      await new Promise(r => setTimeout(r, 800));
    }
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

  const onChoose = (opt: number[]) => {
    if (answered) return;
    stopTimer();
    timerAnim.stopAnimation();

    setAnswered(true);
    setSelected(opt);

    const isCorrect = JSON.stringify(opt) === JSON.stringify(correctSeq);
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    Animated.sequence([
        Animated.timing(answerScaleAnim, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.spring(answerScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

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
    proceedNext(newScore);
  };

  const proceedNext = (currentScore: number) => {
    setTimeout(() => {
        if (question + 1 >= TOTAL_QUESTIONS) {
          finishLevel(currentScore);
        } else {
          // FIX: Kemas kini soalan DAN panggil nextQuestion dengan index baru terus
          const nextQ = question + 1;
          setQuestion(nextQ);
          nextQuestion(nextQ); 
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
    setFinishData({
        title: isSuccess ? 'Tahniah! 🎉' : 'Siap!',
        message: isSuccess ? "Hebat! Pendengaran yang tajam!" : "Cuba lagi, fokus pada bunyi.",
        isSuccess,
        finalScore
    });
    setShowFinishModal(true);
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['100%', '0%'] });
  const shakeX = shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

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
        <TouchableOpacity style={styles.muteBtn} onPress={toggleMute} activeOpacity={0.7}>
            <Text style={{fontSize: 24}}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>

        {/* BUTANG KELUAR */}
        <TouchableOpacity style={styles.exitBtn} onPress={handleExitPress} activeOpacity={0.7}>
            <Text style={{fontSize: 24}}>🚪</Text>
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ============ PAPARAN TUTORIAL ============ */}
          {showTutorial ? (
             <View style={styles.card}>
                <Text style={styles.title}>TUTORIAL</Text>
                <Text style={styles.desc}>Dengar dan perhatikan urutan bunyi.</Text>

                {/* ANIMASI TUTORIAL */}
                <View style={[styles.tutorialBox]}>
                    <View style={styles.rtlContainer}>
                        {TUTORIAL_DATA.map((item, index) => (
                            <React.Fragment key={index}>
                                <Text 
                                    style={[
                                        styles.optionText, 
                                        // Highlight huruf
                                        { color: tutorialActiveIndex === index ? '#FFD700' : '#FFF', fontSize: 45 }
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {index < TUTORIAL_DATA.length - 1 && (
                                    <Text style={[styles.arrow, { color: '#FFCC80' }]}>⬅️</Text>
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Butang Ulang Tutorial */}
                <TouchableOpacity 
                    style={[
                        styles.modalBtn, 
                        styles.btnYellow, 
                        { width: '100%', marginTop: 10, opacity: isTutorialPlaying ? 0.6 : 1 }
                    ]}
                    onPress={playTutorialLoop}
                    disabled={isTutorialPlaying} 
                >
                    <Text style={[styles.modalBtnText, { color: '#E65100' }]}>
                        {isTutorialPlaying ? 'Sedang Main...' : 'Ulang Tutorial 🔄'}
                    </Text>
                </TouchableOpacity>

                {/* Butang Mula */}
                <TouchableOpacity 
                    style={[styles.modalBtn, styles.btnGreen, { width: '100%', marginTop: 15 }]}
                    onPress={startGame}
                >
                    <Text style={styles.modalBtnText}>Mula Bermain ▶️</Text>
                </TouchableOpacity>
             </View>
          ) : (
            
            /* ============ PAPARAN GAME ============ */
            <View style={styles.card}>
                <Text style={styles.title}>TAHAP 4</Text>
                <Text style={styles.desc}>Dengar urutan dan pilih susunan yang betul</Text>

                <View style={styles.progressWrap}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Soalan {question + 1} / {TOTAL_QUESTIONS}</Text>
                        <Text style={styles.scoreLabel}>Skor: {score}</Text>
                    </View>
                    <View style={styles.progressBg}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={[styles.timerText, timeLeft <= 5 && styles.timerDanger]}>⏱️ {timeLeft}s</Text>
                    <View style={styles.timerTrack}>
                        <Animated.View style={[styles.timerFill, { width: timerWidth, backgroundColor: timeLeft <= 5 ? '#D32F2F' : '#FBC02D' }]} />
                    </View>
                </View>

                <TouchableOpacity onPress={() => playSequence(correctSeq)} disabled={answered}>
                    <Animated.View style={[styles.soundBtn, { transform: [{ scale: soundBtnScale }] }]}>
                        <Text style={{ fontSize: 50 }}>🔊</Text>
                        <Text style={styles.soundLabel}>Ulang</Text>
                    </Animated.View>
                </TouchableOpacity>

                <View style={styles.options}>
                {options.map((opt, i) => {
                    const isCorrectAnswer = JSON.stringify(opt) === JSON.stringify(correctSeq);
                    const isSelected = JSON.stringify(selected) === JSON.stringify(opt);
                    const isCorrect = answered && isCorrectAnswer;
                    const isWrong = answered && isSelected && !isCorrectAnswer;
                    const missed = answered && isCorrectAnswer && !isSelected;

                    return (
                    <Animated.View key={i} style={{ transform: [{ scale: isSelected ? answerScaleAnim : 1 }, { translateX: isWrong ? shakeX : 0 }] }}>
                        <TouchableOpacity onPress={() => onChoose(opt)} disabled={answered} activeOpacity={0.9}>
                        <View style={[styles.option, isCorrect && styles.correct, isWrong && styles.wrong, missed && styles.missed]}>
                            <View style={styles.rtlContainer}>
                                {opt.map((idx, index) => (
                                    <React.Fragment key={index}>
                                        <Text style={styles.optionText}>{ITEMS[idx].label}</Text>
                                        {index < opt.length - 1 && <Text style={styles.arrow}>⬅️</Text>}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>
                        </TouchableOpacity>
                    </Animated.View>
                    );
                })}
                </View>
            </View>
          )}
        </ScrollView>

        {/* MODAL KELUAR */}
        <Modal animationType="fade" transparent={true} visible={showExitModal} onRequestClose={cancelExit}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { borderColor: '#EF5350' }]}>
                    <Text style={[styles.modalTitle, { color: '#C62828' }]}>Berhenti Sekejap?</Text>
                    <Text style={styles.modalText}>Masa sedang berhenti. Kalau keluar, skor anda akan hilang.</Text>
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={[styles.modalBtn, styles.btnGreen]} onPress={cancelExit}>
                            <Text style={styles.modalBtnText}>Sambung</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, styles.btnRed]} onPress={confirmExit}>
                            <Text style={styles.modalBtnText}>Keluar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* MODAL FINISH */}
        <Modal animationType="slide" transparent={true} visible={showFinishModal} onRequestClose={handleFinishClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { borderColor: finishData.isSuccess ? '#2E7D32' : '#F9A825' }]}>
                    <Text style={{ fontSize: 60, marginBottom: 10 }}>{finishData.isSuccess ? '👂' : '🎧'}</Text>
                    <Text style={[styles.modalTitle, { color: finishData.isSuccess ? '#2E7D32' : '#F57F17' }]}>{finishData.title}</Text>
                    <View style={styles.resultScoreContainer}>
                        <Text style={styles.resultScoreLabel}>SKOR AKHIR</Text>
                        <Text style={styles.resultScoreValue}>{finishData.finalScore} / {TOTAL_QUESTIONS}</Text>
                    </View>
                    <Text style={styles.modalText}>{finishData.message}</Text>
                    <TouchableOpacity style={[styles.modalBtnFull, { backgroundColor: finishData.isSuccess ? '#4CAF50' : '#FFB300' }]} onPress={handleFinishClose}>
                        <Text style={styles.modalBtnText}>{finishData.isSuccess ? 'Seterusnya 🚀' : 'Cuba Lagi 🔄'}</Text>
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
  safe: { flex: 1 },
  muteBtn: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.6)', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 2, borderColor: '#F9A825' },
  exitBtn: { position: 'absolute', top: 80, right: 20, backgroundColor: 'rgba(255,200,200,0.8)', width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 2, borderColor: '#C62828' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 40 },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 26, padding: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 6, borderWidth: 3, borderColor: '#fff', width: '100%', maxWidth: 650, alignSelf: 'center' },
  title: { fontSize: 32, fontFamily: 'Sniglet_800ExtraBold', color: '#F57F17', marginBottom: 2 },
  desc: { fontSize: 16, fontFamily: 'Sniglet_400Regular', color: '#F9A825', marginBottom: 10, textAlign: 'center' },
  progressWrap: { width: '100%', marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 16, color: '#F57F17', fontFamily: 'Sniglet_400Regular' },
  scoreLabel: { fontSize: 16, color: '#F57F17', fontFamily: 'Sniglet_800ExtraBold' },
  progressBg: { width: '100%', height: 12, backgroundColor: '#FFF9C4', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#FBC02D' },
  progressFill: { height: '100%', backgroundColor: '#F57F17' },
  timerContainer: { width: '100%', flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  timerText: { fontSize: 20, fontFamily: 'Sniglet_800ExtraBold', color: '#F57F17', marginRight: 10, width: 70 },
  timerDanger: { color: '#D32F2F' },
  timerTrack: { flex: 1, height: 10, backgroundColor: '#FFCCBC', borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#FFAB91' },
  timerFill: { height: '100%' },
  soundBtn: { marginTop: 5, backgroundColor: '#FFF176', width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#F9A825', elevation: 4 },
  soundLabel: { fontSize: 16, fontFamily: 'Sniglet_400Regular', color: '#F57F17', marginTop: 2 },
  options: { marginTop: 15, width: '100%' },
  
  // OPTION STYLE (Fixed Centering)
  option: {
    backgroundColor: '#EF6C00',
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 10,
    alignItems: 'center', // Center horizontal
    justifyContent: 'center', // Center vertical
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4
  },
  tutorialBox: {
    width: '100%', // Ambil lebar penuh card
    backgroundColor: '#EF6C00',
    borderRadius: 18,
    paddingVertical: 30, // Ruang atas bawah lebih besar
    marginVertical: 20,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center', // Center children horizontally
    justifyContent: 'center', // Center children vertically
  },
  
  // RTL CONTAINER (Key Fix for Centering)
  rtlContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center', // PASTIKAN CENTER DI SINI
      width: 'auto', // Jangan paksa 100% jika tidak perlu, biar flexbox handle
      flexWrap: 'wrap', // Prevent overflow
  },
  
  optionText: { fontSize: 32, fontFamily: 'Sniglet_800ExtraBold', color: '#fff', textAlign: 'center' },
  arrow: { fontSize: 24, marginHorizontal: 10, color: '#FFCC80' },
  correct: { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  wrong: { backgroundColor: '#C62828', borderColor: '#B71C1C' },
  missed: { backgroundColor: '#81C784', opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#FFF', width: '85%', maxWidth: 400, padding: 30, borderRadius: 30, alignItems: 'center', elevation: 10, borderWidth: 5 },
  modalTitle: { fontFamily: 'Sniglet_800ExtraBold', fontSize: 32, marginBottom: 10, textAlign: 'center' },
  modalText: { fontFamily: 'Sniglet_400Regular', fontSize: 18, color: '#555', textAlign: 'center', marginBottom: 25, lineHeight: 24 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 15 },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 2, borderWidth: 2, borderColor: '#FFF' },
  btnGreen: { backgroundColor: '#4CAF50' },
  btnRed: { backgroundColor: '#EF5350' },
  btnYellow: { backgroundColor: '#FFF176' }, // Warna baru
  modalBtnFull: { width: '100%', paddingVertical: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 3, borderWidth: 2, borderColor: '#FFF' },
  modalBtnText: { fontFamily: 'Sniglet_800ExtraBold', fontSize: 20, color: '#FFF' },
  resultScoreContainer: { backgroundColor: '#FFF9C4', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 15, marginVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FBC02D' },
  resultScoreLabel: { fontFamily: 'Sniglet_400Regular', fontSize: 14, color: '#F57F17', marginBottom: 2 },
  resultScoreValue: { fontFamily: 'Sniglet_800ExtraBold', fontSize: 36, color: '#E65100' }
});