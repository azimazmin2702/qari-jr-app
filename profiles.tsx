import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    BackHandler,
    Dimensions,
    FlatList,
    ImageBackground,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Fonts
import { GochiHand_400Regular, useFonts as useGochi } from '@expo-google-fonts/gochi-hand';
import { LuckiestGuy_400Regular, useFonts as useLuckiest } from '@expo-google-fonts/luckiest-guy';
import { Sniglet_400Regular, Sniglet_800ExtraBold, useFonts as useSniglet } from '@expo-google-fonts/sniglet';

const PROFILES_KEY = 'qari_profiles';
const SELECTED_PROFILE_KEY = 'qari_selected_profile';
const ADMIN_ID = 'ADMIN_MASTER_ID';
const ADMIN_PIN = '0000';

type Profile = { id: string; name: string; avatar?: string };

export default function ProfilesScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🧒');

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  
  const clickSound = useRef<Audio.Sound | null>(null);

  const [fontsLoaded] = useSniglet({ Sniglet_400Regular, Sniglet_800ExtraBold });
  const luckiestReady = useLuckiest({ LuckiestGuy_400Regular });
  const gochiReady = useGochi({ GochiHand_400Regular });


  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Keluar dari aplikasi terus
        BackHandler.exitApp();
        return true; // Return true supaya event tidak bubble ke atas
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );
  /* ============================================================ */

  useEffect(() => {
    loadProfiles();
    loadSound();
    return () => { clickSound.current?.unloadAsync(); };
  }, []);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/click.mp3'));
      clickSound.current = sound;
    } catch (e) { console.log('No sound found'); }
  };

  const playClick = async () => {
    try { await clickSound.current?.replayAsync(); } catch (e) {}
  };

  const loadProfiles = async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILES_KEY);
      let loaded: Profile[] = raw ? JSON.parse(raw) : [];

      const adminExists = loaded.find(p => p.id === ADMIN_ID);
      if (!adminExists) {
          const adminProfile: Profile = { id: ADMIN_ID, name: 'Admin', avatar: '👨‍🏫' };
          loaded = [adminProfile, ...loaded]; // Letak admin paling depan
          await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(loaded));
      }

      setProfiles(loaded);
    } catch (err) { console.warn('Failed load profiles', err); }
  };

  const persist = async (next: Profile[]) => {
    setProfiles(next);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  };

  const createProfile = async () => {
    const name = newName.trim();
    if (!name) return Alert.alert('Oopps!', 'Sila tulis nama anda.');

    playClick();
    const id = String(Date.now());
    const p: Profile = { id, name, avatar: selectedEmoji };

    const nonAdmin = profiles.filter(x => x.id !== ADMIN_ID);
    const adminUser = profiles.find(x => x.id === ADMIN_ID);
    const nextList = adminUser ? [adminUser, ...nonAdmin, p] : [...profiles, p];

    await persist(nextList);
    setNewName('');
    setModalVisible(false);
  };

  const handleProfilePress = (p: Profile) => {
      playClick();
      if (p.id === ADMIN_ID) {
          setPin('');
          setAdminModalVisible(true);
      } else {
          selectUserProfile(p);
      }
  }

  const selectUserProfile = async (p: Profile) => {
    await AsyncStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(p));
    setTimeout(() => {
        router.replace('/home');
    }, 100);
  };

  const checkAdminPin = () => {
      if (pin === ADMIN_PIN) {
          setAdminModalVisible(false);
          setTimeout(() => {
              router.push('/admin'); // Pergi ke page Admin
          }, 100);
      } else {
          Alert.alert("Akses Ditolak", "Kata laluan salah!");
          setPin('');
      }
  }

  const deleteProfile = (p: Profile) => {
    if (p.id === ADMIN_ID) return; // Safety check

    playClick();
    Alert.alert('Padam Akaun?', `Betul nak padam akaun "${p.name}"? Semua markah akan hilang!`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Padam',
        style: 'destructive',
        onPress: async () => {
          const next = profiles.filter(x => x.id !== p.id);
          await persist(next);
          
          const keysToRemove = [
            `progress_huruf_${p.id}`,
            `progress_baris_${p.id}`,
            `progress_game_${p.id}`,
            `learnt_huruf_${p.id}`,
            `learnt_baris_${p.id}`
          ];
          await AsyncStorage.multiRemove(keysToRemove);
        },
      },
    ]);
  };

  const emojiList = [
  '🧒','👦','👧','🧑','👩','👨','👶',
  '👮','👷','👩‍🚀', '🌙','⭐','☀️','☁️','🌈','🌍','💧','🌊','❄️',
  '🌲','🌴','🌸','🌻','🍁', '😼','🦁','🐼','🐯','🐻',
  '🐰','🐨','🐮','🐵','🐔','🐧','🐦','🦆','🦅',
  '🦉','🐴','🐝','🦋','🐞','🦈','🦖',  '📚','📖','✏️','🖌️','🎒', 
  '⚽','🏀','🚲','🚀','✈️','⛵', 
  '🏰','👑','💎','💡','🏆', 
  '🍎','🍦','🍩','🏹' 
];

  if (!fontsLoaded || !luckiestReady) return null;

  const renderProfileItem = ({ item }: { item: Profile }) => {
    const isAdmin = item.id === ADMIN_ID;
    
    const gradientColors: [string, string, ...string[]] = isAdmin 
        ? ['#FFECB3', '#FFCA28'] 
        : ['#ffffff', '#f0f0f0'];
    
    const borderColor = isAdmin ? '#FF6F00' : '#fff';

    return (
        <View style={s.cardWrapper}>
        <TouchableOpacity 
            style={s.avatarContainer} 
            activeOpacity={0.8}
            onPress={() => handleProfilePress(item)}
        >
            <LinearGradient colors={gradientColors} style={[s.avatarGradient, { borderColor }]}>
                <Text style={s.emoji}>{item.avatar}</Text>
            </LinearGradient>
            
            <Text 
                style={[s.nameText, isAdmin && { color: '#FFD54F', textShadowColor: '#000' }]} 
                numberOfLines={2} 
                adjustsFontSizeToFit={true}
                minimumFontScale={0.6}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
        
        {/* Butang Delete: Sorok jika Admin */}
        {!isAdmin && (
            <TouchableOpacity style={s.deleteBadge} onPress={() => deleteProfile(item)}>
                <Text style={s.deleteX}>✕</Text>
            </TouchableOpacity>
        )}
        </View>
    );
  };

  return (
    <ImageBackground source={require('../assets/images/qari-bg-blue.png')} style={s.bg}>
      <StatusBar hidden />
      <View style={s.overlay}>
        
        {/* HEADER */}
        <View style={s.header}>
            <Text style={s.appTitle}>QARI JR</Text>
            <Text style={s.subTitle}>Pilih atau cipta akaun untuk mula belajar</Text>
        </View>

        {/* PROFILE GRID */}
        <View style={s.gridContainer}>
            <FlatList
                data={profiles}
                keyExtractor={item => item.id}
                renderItem={renderProfileItem}
                numColumns={3}
                contentContainerStyle={s.listContent}
                ListFooterComponent={
                    <View style={s.cardWrapper}>
                        <TouchableOpacity 
                            style={[s.avatarContainer, s.addBtnContainer]} 
                            onPress={() => { playClick(); setModalVisible(true); }}
                        >
                            <LinearGradient colors={['#80DEEA', '#00ACC1']} style={s.avatarGradient}>
                                <Text style={s.addIcon}>+</Text>
                            </LinearGradient>
                            <Text style={[s.nameText, {color: '#006064'}]}>Tambah</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>

        {/* MODAL: CREATE PROFILE */}
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
            <View style={m.backdrop}>
                <View style={m.card}>
                    <Text style={m.title}>Pilih Avatar & Nama</Text>
                    
                    <View style={m.emojiSelector}>
                        <FlatList
                            data={emojiList}
                            keyExtractor={item => item}
                            numColumns={5} 
                            showsVerticalScrollIndicator={false}
                            // FIX: Tambah columnWrapperStyle untuk spacing sekata
                            columnWrapperStyle={{ justifyContent: 'space-around', paddingHorizontal: 5 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => { playClick(); setSelectedEmoji(item); }}
                                    style={[m.emojiItem, selectedEmoji === item && m.emojiSelected]}
                                >
                                    <Text style={{fontSize: 28}}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <TextInput
                        placeholder="Taip Nama Di Sini..."
                        style={m.input}
                        value={newName}
                        onChangeText={setNewName}
                        placeholderTextColor="#999"
                    />
                    <View style={m.btnRow}>
                        <TouchableOpacity style={m.btnCancel} onPress={() => setModalVisible(false)}>
                            <Text style={m.btnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={m.btnSave} onPress={createProfile}>
                            <Text style={[m.btnText, {color: '#fff'}]}>Simpan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* MODAL: ADMIN LOGIN */}
        <Modal visible={adminModalVisible} transparent animationType="fade" onRequestClose={() => setAdminModalVisible(false)}>
            <View style={m.backdrop}>
                <View style={[m.card, { height: 'auto', maxHeight: 300 }]}>
                    <Text style={[m.title, {color: '#E65100'}]}>🔐 Log Masuk Admin</Text>
                    <Text style={{fontFamily: 'Sniglet_400Regular', marginBottom: 10, color: '#555'}}>Masukkan Kod Keselamatan</Text>
                    
                    <TextInput
                        placeholder="****"
                        style={[m.input, { fontSize: 30, letterSpacing: 5, fontWeight: 'bold' }]}
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="numeric"
                        secureTextEntry
                        maxLength={4}
                        placeholderTextColor="#CCC"
                    />

                    <View style={m.btnRow}>
                        <TouchableOpacity style={m.btnCancel} onPress={() => setAdminModalVisible(false)}>
                            <Text style={m.btnText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[m.btnSave, {backgroundColor: '#FF9800'}]} onPress={checkAdminPin}>
                            <Text style={[m.btnText, {color: '#fff'}]}>Masuk</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

      </View>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');
const cardSize = width > 800 ? 180 : 140;

const s = StyleSheet.create({
  bg: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  appTitle: { fontSize: 60, fontFamily: 'LuckiestGuy_400Regular', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 10 },
  subTitle: { fontSize: 22, fontFamily: 'Sniglet_400Regular', color: '#E0F2F1' },

  gridContainer: { height: '60%', minWidth: '70%' },
  listContent: { alignItems: 'center', paddingBottom: 50 },

  cardWrapper: { margin: 15, width: cardSize, alignItems: 'center' },
  avatarContainer: { alignItems: 'center', width: '100%' },
  avatarGradient: {
    width: cardSize - 20, height: cardSize - 20,
    borderRadius: (cardSize - 20) / 2,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    borderWidth: 4, 
    elevation: 8, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:5
  },
  emoji: { fontSize: cardSize / 2.5 },
  
  nameText: { 
      fontSize: 20, fontFamily: 'Sniglet_800ExtraBold', color: '#fff', 
      textAlign: 'center', textShadowColor:'rgba(0,0,0,0.5)', textShadowRadius:3, width: '100%', paddingHorizontal: 2 
  },
  
  addBtnContainer: { opacity: 0.9 },
  addIcon: { fontSize: 60, color: '#fff', marginTop: -5 },

  deleteBadge: {
    position: 'absolute', top: 0, right: 10,
    backgroundColor: '#FF5252', width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },
  deleteX: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

const m = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    
    card: { width: '90%', maxWidth: 450, maxHeight: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center', elevation: 10 },
    
    title: { fontSize: 28, fontFamily: 'Sniglet_800ExtraBold', color: '#00695C', marginBottom: 15 },
    emojiSelector: { height: 250, width: '100%', marginBottom: 20, backgroundColor: '#FAFAFA', borderRadius: 15, padding: 5 },
    
    emojiItem: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', margin: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    
    emojiSelected: { borderWidth: 3, borderColor: '#26A69A', backgroundColor: '#E0F2F1' },
    input: { width: '100%', backgroundColor: '#F0F0F0', borderRadius: 15, padding: 15, fontSize: 18, fontFamily: 'Sniglet_400Regular', marginBottom: 20, textAlign: 'center' },
    btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    btnCancel: { flex: 1, backgroundColor: '#CFD8DC', padding: 15, borderRadius: 15, marginRight: 10, alignItems: 'center' },
    btnSave: { flex: 1, backgroundColor: '#26A69A', padding: 15, borderRadius: 15, marginLeft: 10, alignItems: 'center' },
    btnText: { fontFamily: 'Sniglet_800ExtraBold', fontSize: 18, color: '#455A64' }
});