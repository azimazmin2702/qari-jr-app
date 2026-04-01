// app/admin.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av'; // 1. Import Audio
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react'; // 2. Import useRef
import {
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

/* ===================== CONSTANTS ===================== */
const PROFILES_KEY = 'qari_profiles';
const ADMIN_ID = 'ADMIN_MASTER_ID';
const BACKGROUND_IMAGE = require('../assets/images/adminbg.png'); 

// Fallback constant
const TOTAL_HURUF = 28; 
const TOTAL_BARIS = 84; 

type StudentData = {
  id: string;
  name: string;
  avatar: string;
  progHuruf: number;
  progBaris: number;
  progGame: number;
};

export default function AdminScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  const [students, setStudents] = useState<StudentData[]>([]);
  
  // 3. Ref untuk Sound
  const clickSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    fetchData();

    // 4. Load Sound bila screen mount
    (async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/click.mp3')
            );
            clickSound.current = sound;
        } catch (e) {
            console.log("Audio Error:", e);
        }
    })();

    // Cleanup sound bila keluar
    return () => {
        clickSound.current?.unloadAsync();
    };
  }, []);

  // 5. Fungsi Mainkan Bunyi
  const playClick = async () => {
      try {
          await clickSound.current?.replayAsync();
      } catch (e) {}
  };

  const fetchData = async () => {
    try {
      const rawProfiles = await AsyncStorage.getItem(PROFILES_KEY);
      
      let allProfiles = [];
      if (rawProfiles) {
          allProfiles = JSON.parse(rawProfiles);
      }

      // Tapis keluar akaun Admin
      const studentProfiles = allProfiles.filter((p: any) => p.id !== ADMIN_ID);

      const dataPromises = studentProfiles.map(async (p: any) => {
        
        // --- 1. HURUF ---
        let pctHuruf = 0;
        const storedHurufPct = await AsyncStorage.getItem(`progress_huruf_${p.id}`);
        if (storedHurufPct) {
            pctHuruf = parseInt(storedHurufPct, 10);
        } else {
            const hurufRaw = await AsyncStorage.getItem(`learnt_huruf_${p.id}`);
            const hurufArr = hurufRaw ? JSON.parse(hurufRaw) : [];
            pctHuruf = Math.round((hurufArr.length / TOTAL_HURUF) * 100);
        }

        // --- 2. BARIS ---
        let pctBaris = 0;
        const storedBarisPct = await AsyncStorage.getItem(`progress_baris_${p.id}`);
        if (storedBarisPct) {
            pctBaris = parseInt(storedBarisPct, 10);
        } else {
            const barisRaw = await AsyncStorage.getItem(`learnt_baris_${p.id}`);
            const barisArr = barisRaw ? JSON.parse(barisRaw) : [];
            pctBaris = Math.round((barisArr.length / TOTAL_BARIS) * 100);
        }

        // --- 3. GAME ---
        let pctGame = 0;
        const storedGamePct = await AsyncStorage.getItem(`progress_game_${p.id}`);
        
        if (storedGamePct) {
            pctGame = parseInt(storedGamePct, 10);
        } else {
            const gameRaw = await AsyncStorage.getItem(`highestLevel_${p.id}`);
            const levelReached = gameRaw ? parseInt(gameRaw) : 0;
            pctGame = Math.min(100, levelReached * 20); 
        }

        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar || '👤',
          progHuruf: pctHuruf,
          progBaris: pctBaris,
          progGame: pctGame
        };
      });

      const results = await Promise.all(dataPromises);
      setStudents(results);

    } catch (e) {
      console.log("Error loading admin data", e);
    }
  };

  if (!fontsLoaded) return null;

  /* ===================== RENDER ITEM ===================== */
  const renderStudent = ({ item }: { item: StudentData }) => {
      const isLegend = item.progHuruf >= 100 && item.progBaris >= 100 && item.progGame >= 100;

      return (
        <View style={[styles.studentCard, isLegend && styles.legendCardBorder]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarBox}>
              <Text style={{fontSize: 30}}>{item.avatar}</Text>
            </View>
            
            <View style={styles.nameContainer}>
                <Text style={styles.studentName}>{item.name}</Text>
                
                {isLegend && (
                    <View style={styles.trophyContainer}>
                        <Text style={styles.trophyIcon}>🏆</Text>
                        <Text style={styles.legendLabel}>LAGENDA</Text>
                    </View>
                )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Huruf</Text>
              <Text style={[styles.statValue, {color: '#4CAF50'}]}>{item.progHuruf}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Baris</Text>
              <Text style={[styles.statValue, {color: '#FF9800'}]}>{item.progBaris}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Game</Text>
              <Text style={[styles.statValue, {color: '#2196F3'}]}>{item.progGame}%</Text>
            </View>
          </View>
        </View>
      );
  };

  return (
    <ImageBackground 
        source={BACKGROUND_IMAGE} 
        style={{ flex: 1 }} 
        resizeMode="cover"
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar hidden />
        
        <View style={styles.header}>
          <Text style={styles.title}>Prestasi Murid 📊</Text>
          <Text style={styles.subtitle}>Rekod kemajuan semua profil</Text>
        </View>

        <FlatList 
          data={students}
          keyExtractor={item => item.id}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Tiada murid lagi...</Text>
            </View>
          }
        />

        <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => {
                playClick(); // 6. Mainkan bunyi bila tekan keluar
                router.replace('/profiles');
            }}
        >
          <Text style={styles.backText}>Log Keluar Admin</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </ImageBackground>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
    elevation: 3,
  },
  title: { fontSize: 32, fontFamily: 'Sniglet_800ExtraBold', color: '#E65100' },
  subtitle: { fontSize: 16, fontFamily: 'Sniglet_400Regular', color: '#BF360C' },

  listContent: { padding: 20, paddingBottom: 100 },

  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF3E0'
  },
  legendCardBorder: {
      borderColor: '#FFD700', // Border Emas
      borderWidth: 3,
      backgroundColor: '#FFFDE7' 
  },

  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarBox: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    marginRight: 15, borderWidth: 1, borderColor: '#EEE'
  },
  
  nameContainer: {
      flex: 1,
      justifyContent: 'center',
  },
  studentName: { fontSize: 24, fontFamily: 'Sniglet_800ExtraBold', color: '#333' },
  
  // Style Piala
  trophyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      backgroundColor: '#FFECB3',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  trophyIcon: { fontSize: 18, marginRight: 5 },
  legendLabel: { fontSize: 14, fontFamily: 'Sniglet_800ExtraBold', color: '#F57F17' },

  divider: { height: 1, backgroundColor: '#EEE', width: '100%', marginBottom: 10 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 14, fontFamily: 'Sniglet_400Regular', color: '#888' },
  statValue: { fontSize: 20, fontFamily: 'Sniglet_800ExtraBold' },

  emptyBox: { marginTop: 50, alignItems: 'center' },
  emptyText: { 
      fontSize: 18, 
      fontFamily: 'Sniglet_400Regular', 
      color: '#fff', 
      textShadowColor: 'rgba(0,0,0,0.5)', 
      textShadowRadius: 3 
  },

  backBtn: {
    position: 'absolute', bottom: 30, alignSelf: 'center',
    backgroundColor: '#D84315', paddingVertical: 12, paddingHorizontal: 40,
    borderRadius: 25, elevation: 5,
    borderWidth: 2, borderColor: '#fff'
  },
  backText: { color: '#fff', fontSize: 18, fontFamily: 'Sniglet_800ExtraBold' }
});