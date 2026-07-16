import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SimpananScreen from './src/screens/SimpananScreen';
import PinjamanScreen from './src/screens/PinjamanScreen';
import RiwayatScreen from './src/screens/RiwayatScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0078D4" />
        <Text style={{ marginTop: 10, color: '#616161' }}>Memuat...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#0078D4',
          tabBarInactiveTintColor: '#9e9e9e',
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerTitleStyle: { color: '#1a1a1a', fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Beranda', tabBarLabel: 'Beranda' }}
        />
        <Tab.Screen
          name="Simpanan"
          component={SimpananScreen}
          options={{ title: 'Simpanan Saya' }}
        />
        <Tab.Screen
          name="Pinjaman"
          component={PinjamanScreen}
          options={{ title: 'Pinjaman Saya' }}
        />
        <Tab.Screen
          name="Riwayat"
          component={RiwayatScreen}
          options={{ title: 'Riwayat Transaksi' }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfileScreen}
          options={{ title: 'Profil Saya' }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
