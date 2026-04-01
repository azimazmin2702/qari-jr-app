// app/panduan.tsx
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts } from '@expo-google-fonts/sniglet';

/* ===================== COMPONENT ===================== */

export default function PanduanScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  // Ref untuk Sound
  const clickSound = useRef<Audio.Sound | null>(null);

  // Load Sound Effect
  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/click.mp3')
        );
        clickSound.current = sound;
      } catch (error) {
        console.log("Error loading sound", error);
      }
    })();

    // Cleanup
    return () => {
      clickSound.current?.unloadAsync();
    };
  }, []);

  // Fungsi Mainkan Bunyi
  const playClick = async () => {
    try {
      await clickSound.current?.replayAsync();
    } catch (e) {
      // ignore error
    }
  };

  const handleBack = () => {
    playClick(); 
    setTimeout(() => {
        router.back(); 
    }, 100);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar hidden />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#EDE7F6', '#B39DDB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Panduan Ibu Bapa 👨‍👩‍👧‍👦</Text>
        <Text style={styles.headerSubtitle}>Aplikasi Qari Jr</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >

        {/* SEKSYEN 1: PENGENALAN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apa itu Qari Jr?</Text>
          <Text style={styles.cardText}>
            Qari Jr adalah aplikasi pembelajaran mudah alih yang direka khas untuk kanak-kanak di Malaysia bagi mengenali asas bacaan Al-Quran melalui kaedah gamifikasi.
          </Text>
        </View>

        {/* SEKSYEN 2: MODUL PEMBELAJARAN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modul Pembelajaran</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.bullet}>🅰️</Text>
            <View style={styles.textWrap}>
              <Text style={styles.listTitle}>Belajar Huruf</Text>
              <Text style={styles.listDesc}>
                Kad imbas interaktif. Tekan huruf untuk mendengar sebutan yang betul.
              </Text>
            </View>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.bullet}>➖</Text>
            <View style={styles.textWrap}>
              <Text style={styles.listTitle}>Belajar Baris</Text>
              <Text style={styles.listDesc}>
                Mengenali bunyi asas: Fathah (Baris Atas), Kasrah (Bawah), dan Dhammah (Depan).
              </Text>
            </View>
          </View>
        </View>

        {/* SEKSYEN 3: MODUL PERMAINAN (BARU DITAMBAH) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Modul Permainan</Text>
          
          <View style={styles.listItem}>
            <Text style={styles.bullet}>🎮</Text>
            <View style={styles.textWrap}>
              <Text style={styles.listTitle}>Uji Minda</Text>
              <Text style={styles.listDesc}>
                Siri permainan mini yang menguji ingatan dan kefahaman anak anda terhadap apa yang telah dipelajari.
              </Text>
            </View>
          </View>

          <View style={styles.listItem}>
            <Text style={styles.bullet}>🚀</Text>
            <View style={styles.textWrap}>
              <Text style={styles.listTitle}>Cabaran Bertahap</Text>
              <Text style={styles.listDesc}>
                Mengandungi 5 tahap kesukaran yang berbeza untuk meningkatkan kemahiran berfikir secara kritis.
              </Text>
            </View>
          </View>
        </View>

        {/* SEKSYEN 4: LENCANA QARI POWER */}
        <View style={[styles.card, {backgroundColor: '#FFF8E1', borderColor: '#FFC107', borderWidth: 2}]}>
           <Text style={[styles.cardTitle, {color: '#FF6F00'}]}>Lencana Qari Power 🏅</Text>
           <Text style={styles.cardText}>
             Sistem pencapaian ini direka untuk memotivasikan anak anda. Warna lencana akan berubah mengikut tahap penguasaan mereka!
           </Text>

           <View style={styles.levelBox}>
              <View style={styles.levelItem}>
                  <Text style={styles.levelEmoji}>🌿</Text>
                  <Text style={styles.levelText}><Text style={{fontWeight:'bold', color:'#2E7D32'}}>Hijau (Tahap 1-3):</Text> Peringkat Permulaan.</Text>
              </View>
              <View style={styles.levelItem}>
                  <Text style={styles.levelEmoji}>💧</Text>
                  <Text style={styles.levelText}><Text style={{fontWeight:'bold', color:'#1565C0'}}>Biru (Tahap 4-6):</Text> Semakin Mahir!</Text>
              </View>
              <View style={styles.levelItem}>
                  <Text style={styles.levelEmoji}>👑</Text>
                  <Text style={styles.levelText}><Text style={{fontWeight:'bold', color:'#F57F17'}}>Emas (Tahap 7-9):</Text> Sangat Cemerlang!</Text>
              </View>
              <View style={styles.levelItem}>
                  <Text style={styles.levelEmoji}>🔥</Text>
                  <Text style={styles.levelText}><Text style={{fontWeight:'bold', color:'#D32F2F'}}>Api (Tahap 10):</Text> Lagenda!</Text>
              </View>
           </View>

           {/* INFO PIALA */}
           <View style={styles.trophyInfoBox}>
               <Text style={{fontSize: 40, textAlign: 'center', marginBottom: 5}}>🏆</Text>
               <Text style={styles.trophyTitle}>Misi Utama: Dapatkan Piala!</Text>
               <Text style={styles.trophyDesc}>
                   Apabila anak anda mencapai <Text style={{fontWeight:'bold'}}>100%</Text> dalam semua kategori (Huruf, Baris & Permainan), mereka akan dianugerahkan Piala Emas dan gelaran <Text style={{fontWeight:'bold', color:'#E65100'}}>LAGENDA</Text> di laman profil mereka!
               </Text>
           </View>

        </View>

        {/* SEKSYEN 5: SISTEM PERMAINAN & KUNCI */}
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={[styles.cardTitle, {color: '#E65100'}]}>Sistem Permainan & Kunci 🔒</Text>
          <Text style={styles.cardText}>
            Untuk memastikan kefahaman anak anda, aplikasi ini menggunakan sistem "Level Progression":
          </Text>
          
          <View style={styles.ruleBox}>
            <Text style={styles.ruleText}>
              ✅ <Text style={{fontWeight: 'bold'}}>Syarat Lulus:</Text> Anak anda perlu mendapat sekurang-kurangnya <Text style={{fontWeight: 'bold', color: '#D84315'}}>7 markah (70%)</Text> untuk membuka tahap seterusnya.
            </Text>
          </View>

          <Text style={styles.cardText}>
            • <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Tahap 1:</Text> Susunan Huruf (Pilih huruf seterusnya){'\n'}
            • <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Tahap 2:</Text> Pengecaman Bunyi (Dengar & Pilih){'\n'}
            • <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Tahap 3:</Text> Pengecaman Baris (Kenali tanda bacaan){'\n'}
            • <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Tahap 4:</Text> Memori Turutan (Ingat susunan bunyi){'\n'}
            • <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Tahap 5:</Text> Cabaran Akhir (Kuiz rawak pantas)
          </Text>
        </View>

        {/* SEKSYEN 6: TIPS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tips Untuk Ibu Bapa</Text>
          <Text style={styles.cardText}>
            1. <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Bimbing Anak:</Text> Pembelajaran lebih berkesan jika anda menyebut huruf bersama mereka.{'\n\n'}
            2. <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Jangan Terburu-buru:</Text> Biarkan mereka mengulang Tahap 1 sehingga mereka benar-benar mahir sebelum ke Tahap 2.{'\n\n'}
            3. <Text style={{fontFamily: 'Sniglet_800ExtraBold'}}>Raikan Kejayaan:</Text> Puji mereka apabila berjaya membuka kunci tahap baru!
          </Text>
        </View>

        {/* SEKSYEN 7: TENTANG */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tentang Aplikasi</Text>
          <Text style={styles.cardText}>
            Aplikasi ini dibangunkan sebagai Projek Tahun Akhir (FYP). Semua data disimpan secara lokal di dalam peranti anda. Tiada data peribadi dikumpul secara luaran.
          </Text>
          <Text style={styles.creditText}>© 2025 Qari Jr | Azim Azmin</Text>
        </View>

        {/* RUANG BAWAH */}
        <View style={{height: 100}} />

      </ScrollView>

      {/* BUTANG KEMBALI */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={styles.backBtn} 
            onPress={handleBack} 
            activeOpacity={0.8}
        >
            <Text style={styles.backText}>KEMBALI KE MENU UTAMA</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#4527A0',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: 'Sniglet_400Regular',
    color: '#5E35B1',
    marginTop: 5,
  },

  scrollContent: {
    padding: 20,
  },

  // CARD STYLE
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  highlightCard: {
    borderWidth: 2,
    borderColor: '#FFB74D',
    backgroundColor: '#FFF3E0',
  },

  cardTitle: {
    fontSize: 24,
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#311B92',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  cardText: {
    fontSize: 18,
    fontFamily: 'Sniglet_400Regular',
    color: '#455A64',
    lineHeight: 26,
  },

  // LIST ITEM
  listItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  bullet: {
    fontSize: 24,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  listTitle: {
    fontSize: 20,
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#2E7D32',
  },
  listDesc: {
    fontSize: 16,
    fontFamily: 'Sniglet_400Regular',
    color: '#546E7A',
  },

  // LEVEL BOX
  levelBox: {
      marginTop: 10,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderRadius: 10,
      padding: 10,
  },
  levelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  levelEmoji: {
      fontSize: 22,
      marginRight: 10,
  },
  levelText: {
      fontSize: 17,
      fontFamily: 'Sniglet_400Regular',
      color: '#333',
      flex: 1,
  },

  // TROPHY BOX
  trophyInfoBox: {
      marginTop: 15,
      backgroundColor: '#FFFDE7', 
      borderRadius: 15,
      padding: 15,
      borderWidth: 1,
      borderColor: '#FBC02D',
      alignItems: 'center',
  },
  trophyTitle: {
      fontSize: 20,
      fontFamily: 'Sniglet_800ExtraBold',
      color: '#F57F17',
      marginBottom: 5,
      textAlign: 'center',
  },
  trophyDesc: {
      fontSize: 16,
      fontFamily: 'Sniglet_400Regular',
      color: '#5D4037',
      textAlign: 'center',
      lineHeight: 22,
  },

  // RULE BOX
  ruleBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCC80',
    marginVertical: 10,
  },
  ruleText: {
    fontSize: 18,
    fontFamily: 'Sniglet_400Regular',
    color: '#333',
  },

  creditText: {
    marginTop: 15,
    fontSize: 14,
    fontFamily: 'Sniglet_400Regular',
    color: '#90A4AE',
    textAlign: 'center',
  },

  // FOOTER BUTTON
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backBtn: {
    backgroundColor: '#673AB7',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  backText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Sniglet_800ExtraBold',
  },
});