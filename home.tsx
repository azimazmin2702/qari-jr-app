// app/home.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  ImageBackground,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { computeBarisPct } from '../lib/barisProgress';
import { computeHurufPct } from '../lib/hurufProgress';

// --- FONTS & AUDIO ---
import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

/* ===================== CONSTANT ===================== */
const SELECTED_PROFILE_KEY = 'qari_selected_profile';

/* ===================== UTILS ===================== */
const getGreeting = (name?: string) => {
  const h = new Date().getHours();
  const base = h < 12 ? 'Selamat Pagi' : h < 18 ? 'Selamat Petang' : 'Selamat Malam';
  return name ? `${base},\n${name}!` : base;
};

const getBadgeLevel = (huruf: number, baris: number, game: number) => {
  if (game >= 99) return 10;
  if (game >= 79) return 9;
  if (game >= 59) return 8;
  if (game >= 39) return 7;
  if (game >= 19) return 6;
  if (baris >= 95) return 5;
  if (baris >= 66) return 4;
  if (baris >= 33) return 3;
  if (huruf >= 80) return 2;
  if (huruf >= 40) return 1;
  return 0;
};

const getBadgeColors = (level: number) => {
  if (level === 10) return { bg: '#FFEBEE', text: '#D32F2F', border: '#FFCDD2' }; // Merah (Api)
  if (level >= 7)   return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' }; // Emas
  if (level >= 4)   return { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' }; // Biru
  return { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' }; // Hijau (Asas)
};

/* ===================== COMPONENTS ===================== */

function ProgressBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const isComplete = pct >= 100; 

  const stars = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <View style={styles.pbContainer}>
      <View style={styles.pbHeader}>
        <Text style={styles.pbLabel}>{label}</Text>
        <Text style={styles.pbValue}>{pct.toFixed(0)}%</Text>
      </View>
      
      <View style={styles.starRow}>
         {stars.map((starNum) => {
             const isActive = pct >= ((starNum * 10) - 9); 
             return (
                 <Text key={starNum} style={[styles.starIcon, { opacity: isActive ? 1 : 0.2 }]}>
                     ⭐
                 </Text>
             );
         })}

         {isComplete && (
            <View style={styles.medalRight}>
               <Text style={styles.medalIcon}>🥇</Text>
            </View>
         )}
      </View>
    </View>
  );
}

const NavBox = ({ label, icon, colors, scale, locked, onPress, style }: any) => {
  const gradientColors = locked ? ['#CFD8DC', '#B0BEC5'] : colors;
  const iconStyle = locked ? { opacity: 0.4, tintColor: '#546E7A' } : {};

  return (
    <Animated.View style={[styles.navBoxWrapper, style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        disabled={locked}
        activeOpacity={0.9}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        style={styles.touchableFill}
      >
        <LinearGradient colors={gradientColors} style={styles.navBoxGradient}>
          <View style={styles.bgCircle} />
          <Image source={icon} style={[styles.navIcon, iconStyle]} resizeMode="contain" />
          <Text style={styles.navText}>{label}</Text>
          
          {locked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>DIKUNCI</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ===================== HOME SCREEN ===================== */
export default function HomeScreen() {
  const router = useRouter();

  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
  const [progHuruf, setProgHuruf] = useState(0);
  const [progBaris, setProgBaris] = useState(0);
  const [progGame, setProgGame] = useState(0);
  const [isMusicOn, setIsMusicOn] = useState(true);
  
  const [showTrophyModal, setShowTrophyModal] = useState(false);

  const badgeLevel = getBadgeLevel(progHuruf, progBaris, progGame);
  const badgeColors = getBadgeColors(badgeLevel);

  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  
  const scaleHuruf = useRef(new Animated.Value(1)).current;
  const scaleBaris = useRef(new Animated.Value(1)).current;
  const scaleGame = useRef(new Animated.Value(1)).current;

  // Animasi Trophy (Pulse)
  const trophyScale = useRef(new Animated.Value(1)).current;
  const profileTrophyScale = useRef(new Animated.Value(1)).current; // New animation for profile trophy

  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const clickSound = useRef<Audio.Sound | null>(null);
  const bgMusic = useRef<Audio.Sound | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/profiles');
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
        const profile = raw ? JSON.parse(raw) : null;
        
        if (profile) {
            setCurrentProfile(profile);
            setGreeting(getGreeting(profile.name));
        } else {
            router.replace('/profiles');
            return; 
        }

        const { sound: click } = await Audio.Sound.createAsync(
          require('../assets/sounds/click.mp3'), { volume: 0.7 }
        );
        clickSound.current = click;

        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, damping: 15 }),
        ]).start();

      } catch (error) {
        console.log("Error Init Home", error);
      }
    })();

    return () => {
      clickSound.current?.unloadAsync().catch(() => {});
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isFocused = true;
      const playMusic = async () => {
        try {
          if (!isMusicOn) return; 
          if (bgMusic.current) await bgMusic.current.unloadAsync();
          
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/backgroundmusic.mp3'),
            { isLooping: true, volume: 0.6 }
          );
          bgMusic.current = sound;
          if (isFocused) await sound.playAsync();
        } catch (e) { console.log("Music Error:", e); }
      };
      playMusic();
      return () => {
        isFocused = false;
        if (bgMusic.current) {
          bgMusic.current.stopAsync().catch(() => {});
          bgMusic.current.unloadAsync().catch(() => {});
        }
      };
    }, [isMusicOn]) 
  );

  const toggleMusic = async () => setIsMusicOn(prev => !prev); 

  useFocusEffect(
    useCallback(() => {
      if (!currentProfile?.id) return;
      let active = true;
      (async () => {
        try {
            const pid = currentProfile.id;
            const gameKey = `progress_game_${pid}`; 
            const gRaw = await AsyncStorage.getItem(gameKey);
            const h = await computeHurufPct(pid); 
            const b = await computeBarisPct(pid);
            
            if (active) {
                const gVal = gRaw ? Number(gRaw) : 0;
                setProgGame(gVal);
                setProgHuruf(h);
                setProgBaris(b);

                const currentLevel = getBadgeLevel(h, b, gVal);
                if (currentLevel === 10) {
                    setShowTrophyModal(true);
                    // Start Animations
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(trophyScale, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                            Animated.timing(trophyScale, { toValue: 1, duration: 800, useNativeDriver: true })
                        ])
                    ).start();
                     Animated.loop(
                        Animated.sequence([
                            Animated.timing(profileTrophyScale, { toValue: 1.15, duration: 700, useNativeDriver: true }),
                            Animated.timing(profileTrophyScale, { toValue: 1, duration: 700, useNativeDriver: true })
                        ])
                    ).start();
                }
            }
        } catch (e) {}
      })();
      return () => { active = false; };
    }, [currentProfile])
  );

  const playClick = async () => { try { await clickSound.current?.replayAsync(); } catch (e) {} };

  const handleNav = (route: string) => {
    playClick();
    setTimeout(() => {
        if (route === 'logout') {
              AsyncStorage.removeItem(SELECTED_PROFILE_KEY).then(() => {
               router.replace('/profiles');
              });
        } else {
            router.push(route as any);
        }
    }, 100);
  };

  if (!fontsLoaded || !currentProfile) {
    return (
      <ImageBackground source={require('../assets/images/qari-bg-blue.png')} style={{ flex: 1 }}>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 200 }} />
      </ImageBackground>
    );
  }

  const lockedBaris = progHuruf < 80;
  const lockedGame = progBaris < 80;

  return (
    <ImageBackground source={require('../assets/images/qari-bg-blue.png')} style={styles.background}>
      <StatusBar hidden />
      
      <View style={styles.floatingHeader}>
           <TouchableOpacity 
                style={[styles.musicBtn, { backgroundColor: isMusicOn ? '#E0F2F1' : '#FFEBEE' }]} 
                onPress={toggleMusic}
                activeOpacity={0.7}
           >
               <Text style={styles.musicIcon}>{isMusicOn ? '🔊' : '🔇'}</Text>
           </TouchableOpacity>
      </View>

      <View style={styles.container}>

        <Animated.View style={[styles.sidebar, { opacity: fade, transform: [{ translateY: slideUp }] }]}>
          
          <View style={styles.sidebarContent}>
              
              {/* --- 1. KAD PROFIL (WHITE BOX) --- */}
              <View style={styles.profileCard}>
                <View style={styles.avatarRow}>
                    <View style={styles.avatarCircle}>
                        <Text style={{fontSize: 55}}>{currentProfile.avatar || '🙂'}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.greetingText}>
                            {greeting}
                        </Text>
                        
                        <View style={styles.badgeRow}>
                            {/* Lencana Qari Power */}
                            <View style={[
                                styles.badgeContainer, 
                                { 
                                    backgroundColor: badgeColors.bg,
                                    borderColor: badgeColors.border,
                                    borderWidth: 2 
                                }
                            ]}>
                              <Text style={styles.badgeIcon}>🏅</Text>
                              <Text style={[styles.badgeText, { color: badgeColors.text }]}>
                                  Qari Power: {badgeLevel}
                              </Text>
                              {badgeLevel === 10 && <Text style={styles.fireIcon}>🔥</Text>}
                            </View>

                            {/* --- PIALA DI SINI (JIKA LEVEL 10) --- */}
                            {badgeLevel === 10 && (
                                <Animated.Text style={[styles.profileTrophy, { transform: [{ scale: profileTrophyScale }] }]}>
                                    🏆
                                </Animated.Text>
                            )}
                        </View>

                    </View>
                </View>
              </View>

              <View style={styles.progressCard}>
                <Text style={styles.sectionTitle}>Pencapaian</Text>
                <View style={styles.progressBarsContainer}>
                    <ProgressBar label="Huruf" value={progHuruf} />
                    <ProgressBar label="Baris" value={progBaris} />
                    <ProgressBar label="Permainan" value={progGame} />
                </View>
              </View>

              <View style={styles.footerContainer}>
                <TouchableOpacity 
                    style={[styles.bigFooterBtn, { marginBottom: 10 }]}
                    onPress={() => { playClick(); handleNav('/panduan'); }}
                    activeOpacity={0.8}
                >
                    <LinearGradient 
                      colors={['#AB47BC', '#7B1FA2']} 
                      style={styles.bigBtnGradient}
                    >
                      <Text style={[styles.bigBtnText, {color: '#fff'}]}>👨‍👩‍👧‍👦 Panduan Ibu Bapa</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomRow}>
                  <TouchableOpacity 
                      style={[styles.bigFooterBtn, { flex: 1, marginRight: 8, backgroundColor: '#fff' }]} 
                      onPress={() => { playClick(); router.push('/tentang'); }}
                  >
                    <View style={styles.bigBtnCenter}>
                      <Text style={[styles.bigBtnText, {color: '#37474F'}]}>ℹ️ Tentang</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.bigFooterBtn, { flex: 1, marginLeft: 8, backgroundColor: '#FF5252' }]} 
                    onPress={() => handleNav('logout')}
                  >
                    <View style={styles.bigBtnCenter}>
                      <Text style={[styles.bigBtnText, {color: '#fff'}]}>🚪 Keluar</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
          </View>
          
          <Text style={styles.copyright}>© 2025 Qari Jr | Projek FYP Azim Azmin</Text>
        </Animated.View>
        
        <Animated.View style={[styles.mainMenuContent, { opacity: fade, transform: [{ translateY: slideUp }] }]}>
          
          <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/android-icon-monochrome2.png')} 
                style={styles.menuLogo} 
                resizeMode="contain" 
              />
          </View>

          <View style={styles.navContainer}>
            <View style={styles.navRow}>
                <NavBox
                    label="Belajar Huruf"
                    icon={require('../assets/icons/huruf.png')}
                    colors={['#66BB6A', '#2E7D32']}
                    scale={scaleHuruf}
                    locked={false}
                    onPress={() => handleNav('/huruf')}
                />

                <NavBox
                    label="Belajar Baris"
                    icon={require('../assets/icons/baris.png')}
                    colors={['#FFA726', '#FF8F00']}
                    scale={scaleBaris}
                    locked={lockedBaris}
                    onPress={() => handleNav('/baris')}
                />
            </View>

            <View style={styles.navRow}>
                <NavBox
                    label="Permainan"
                    icon={require('../assets/icons/game.png')}
                    colors={['#26C6DA', '#0097A7']}
                    scale={scaleGame}
                    locked={lockedGame}
                    onPress={() => handleNav('/game')}
                />
            </View>
          </View>
        </Animated.View>

      </View>

      {/* ===================== TROPHY MODAL (LEVEL 10) ===================== */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTrophyModal}
        onRequestClose={() => setShowTrophyModal(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.trophyCard}>
                <Text style={styles.confettiText}>🎉 ✨ 🎊</Text>
                
                <Animated.Text style={[styles.bigTrophyIcon, { transform: [{ scale: trophyScale }] }]}>
                    🏆
                </Animated.Text>
                
                <Text style={styles.legendTitle}>LAGENDA!</Text>
                <Text style={styles.legendDesc}>
                    Tahniah! Anda telah mencapai{'\n'}Qari Power Level 10!
                </Text>

                <TouchableOpacity 
                    style={styles.closeTrophyBtn}
                    onPress={() => { playClick(); setShowTrophyModal(false); }}
                >
                    <Text style={styles.closeTrophyText}>Hebat!</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  
  floatingHeader: {
      position: 'absolute', top: 0, right: 0, width: '100%',
      flexDirection: 'row', justifyContent: 'flex-end',
      paddingTop: 45, paddingRight: 35, zIndex: 100,
  },
  musicBtn: {
      padding: 12, borderRadius: 30, elevation: 6,
      borderWidth: 2, borderColor: '#00695C', backgroundColor: '#fff'
  },
  musicIcon: { fontSize: 24 },

  container: { 
    flex: 1, flexDirection: 'row', 
    paddingHorizontal: 24, paddingBottom: 24, paddingTop: 40, 
  },

  sidebar: {
    flex: 4, marginRight: 24, height: '100%', 
  },
  sidebarContent: {
    flex: 1, borderRadius: 24, justifyContent: 'flex-start',
  },
  
  profileCard: {
    backgroundColor: '#fff', borderRadius: 24, 
    paddingHorizontal: 15, paddingVertical: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
      width: 85, height: 85, borderRadius: 42.5, 
      backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center',
      borderWidth: 4, borderColor: '#00695C', marginRight: 15,
  },
  profileInfo: { flex: 1, justifyContent: 'center' },
  greetingText: { 
      fontSize: 26, fontFamily: 'Sniglet_400Regular', color: '#37474F', 
      marginBottom: 4, lineHeight: 30
  },
  
  // --- BADGE & TROPHY ROW ---
  badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 15, 
    alignSelf: 'flex-start',
  },
  badgeIcon: { fontSize: 22, marginRight: 5 },
  badgeText: { 
      fontSize: 20, 
      fontFamily: 'Sniglet_800ExtraBold', 
  },
  fireIcon: {
      fontSize: 22,
      marginLeft: 5,
  },
  profileTrophy: {
      fontSize: 35, // Saiz piala dalam box putih
      marginLeft: 10,
  },

  progressCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    borderRadius: 12, padding: 15, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 10, flex: 1, justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 22, fontFamily: 'Sniglet_800ExtraBold', marginBottom: 10, 
    textAlign: 'center', color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4,
  },
  progressBarsContainer: { 
      justifyContent: 'center', gap: 15, flex: 1 
  },
  
  pbContainer: { marginBottom: 5 }, 
  pbHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  pbLabel: { fontFamily: 'Sniglet_400Regular', fontSize: 20, color: '#ffffff' }, 
  pbValue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  starRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start', 
      alignItems: 'center',
      gap: 1,
  },
  starIcon: { fontSize: 30 },
  medalRight: {
      marginLeft: 10, 
      backgroundColor: 'rgba(255,215,0,0.2)', 
      borderRadius: 20, 
      padding: 5,
      elevation: 5
  },
  medalIcon: { fontSize: 24 },

  footerContainer: {
      justifyContent: 'flex-end', paddingBottom: 0,
  },
  bigFooterBtn: {
      height: 60, borderRadius: 16, elevation: 3,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
      overflow: 'hidden',
  },
  bigBtnGradient: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  bigBtnCenter: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  bigBtnText: {
      fontSize: 18, fontFamily: 'Sniglet_800ExtraBold',
      textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 1,
  },
  bottomRow: { flexDirection: 'row' },
  copyright: { color: 'rgba(0, 0, 0, 0.7)', fontSize: 12, textAlign: 'center', marginTop: 5 },

  mainMenuContent: { 
    flex: 6, justifyContent: 'center', alignItems: 'center',
    paddingTop: 60, 
  },
  logoContainer: {
    marginBottom: 20, alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  menuLogo: {
    width: 400, height: 220, 
  },
  
  navContainer: { justifyContent: 'center', gap: 20 },
  navRow: {
      flexDirection: 'row', justifyContent: 'center', gap: 25, alignItems: 'center',
  },

  navBoxWrapper: { width: 220, height: 220 },
  touchableFill: { flex: 1 },
  navBoxGradient: {
    flex: 1, borderRadius: 30, alignItems: 'center', justifyContent: 'center', padding: 10,
    borderWidth: 4, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
    position: 'relative', overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navIcon: { width: '60%', height: '60%', marginBottom: 10 },
  navText: {
    fontSize: 26, fontFamily: 'Sniglet_800ExtraBold', textAlign: 'center', color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 2,
  },
  
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center', borderRadius: 26,
  },
  lockIcon: { fontSize: 40, marginBottom: 5 },
  lockText: {
    color: '#546E7A', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 12,
  },

  /* --- TROPHY MODAL STYLES --- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyCard: {
    backgroundColor: '#FFF',
    width: '60%',
    maxWidth: 500,
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFD700', // Warna Emas
    elevation: 20,
  },
  confettiText: {
    fontSize: 30,
    marginBottom: 10,
  },
  bigTrophyIcon: {
    fontSize: 120, 
    marginBottom: 20,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  legendTitle: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 40,
    color: '#FF8F00',
    marginBottom: 10,
    textAlign: 'center',
  },
  legendDesc: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 28,
  },
  closeTrophyBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  closeTrophyText: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 22,
    color: '#E65100',
  }
});