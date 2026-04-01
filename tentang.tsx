// app/tentang.tsx
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Font Sniglet
import {
  Sniglet_400Regular,
  Sniglet_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/sniglet';

export default function TentangScreen() {
  const router = useRouter();
  const clickSound = useRef<Audio.Sound | null>(null);

  const [fontsLoaded] = useFonts({
    Sniglet_400Regular,
    Sniglet_800ExtraBold,
  });

  /* ===== AUDIO LOGIC ===== */
  useEffect(() => {
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'));
        clickSound.current = sound;
      } catch (e) {
        console.log("Error loading sound");
      }
    })();
    return () => { clickSound.current?.unloadAsync(); };
  }, []);

  const handleBack = async () => {
    try { await clickSound.current?.replayAsync(); } catch (e) {}
    // Beri masa sikit untuk bunyi habis sebelum tukar page
    setTimeout(() => {
      router.back();
    }, 150);
  };

  if (!fontsLoaded) return null;

  return (
    <ImageBackground 
      source={require('../assets/images/qari-bg-blue.png')} 
      style={styles.background}
    >
      <View style={styles.overlay}>
        
        {/* Logo Kecil di Atas */}
        <Image 
          source={require('../assets/images/favicon.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />

        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            <Text style={styles.title}>Qari Jr</Text>

            <Text style={styles.text}>
              <Text style={styles.highlight}>Qari Jr</Text> ialah aplikasi pembelajaran awal Al-Quran
              yang direka khas untuk kanak-kanak di Malaysia.
            </Text>

            <Text style={styles.text}>
              Aplikasi ini membantu anak-anak mengenali huruf Hijaiyah serta asas bacaan Al-Quran
              melalui aktiviti yang menyeronokkan, interaktif dan mesra kanak-kanak.
            </Text>

            <Text style={styles.text}>
              Qari Jr juga menyokong ibu bapa dalam membimbing pendidikan awal Al-Quran di rumah.
            </Text>

             <Text style={styles.copyright}>© 2025 Qari Jr | Projek FYP Azim Azmin</Text>
          </ScrollView>

          {/* Butang Kembali */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>Kembali</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    maxWidth: 550, // Lebarkan sikit untuk tablet
    maxHeight: '80%', 
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center',
  },
  
  // Font: Sniglet Extra Bold
  title: {
    fontFamily: 'Sniglet_800ExtraBold',
    fontSize: 36,
    color: '#00695C',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Font: Sniglet Regular
  text: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 22,
    color: '#455A64',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 15,
  },
  
  highlight: {
    color: '#00695C',
    fontFamily: 'Sniglet_800ExtraBold', // Highlight guna bold
  },
  
  copyright: {
    fontFamily: 'Sniglet_400Regular',
    fontSize: 16,
    color: '#90A4AE',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  
  backButton: {
    marginTop: 10,
    backgroundColor: '#FF7043', 
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  backText: {
    fontFamily: 'Sniglet_800ExtraBold',
    color: '#FFFFFF',
    fontSize: 22,
    textAlign: 'center',
  },
});