import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: anggota } = await supabase
        .from('anggota')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(anggota);
    } catch (error) {
      console.error('Profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Profil tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile.nama.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.nama}</Text>
        <Text style={styles.memberNo}>{profile.no_anggota}</Text>
        <View style={[styles.statusBadge, { backgroundColor: profile.status === 'aktif' ? '#0e7a0d' : '#c42b1c' }]}>
          <Text style={styles.statusText}>{profile.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Text>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informasi Pribadi</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NIK</Text>
          <Text style={styles.infoValue}>{profile.nik}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telepon</Text>
          <Text style={styles.infoValue}>{profile.telepon || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile.email || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tanggal Lahir</Text>
          <Text style={styles.infoValue}>
            {profile.tanggal_lahir
              ? new Date(profile.tanggal_lahir).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '-'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Pekerjaan</Text>
          <Text style={styles.infoValue}>{profile.pekerjaan || '-'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Alamat</Text>
          <Text style={[styles.infoValue, { maxWidth: '60%', textAlign: 'right' }]}>
            {profile.alamat || '-'}
          </Text>
        </View>
      </View>

      {/* Simpanan Pokok Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simpanan Pokok</Text>
        <View style={styles.pokokStatus}>
          <View style={[
            styles.pokokBadge,
            { backgroundColor: profile.simpanan_pokok_bayar ? '#0e7a0d' : '#9d5d00' }
          ]}>
            <Text style={styles.pokokText}>
              {profile.simpanan_pokok_bayar ? 'Sudah Dibayar' : 'Belum Dibayar'}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#616161',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0078D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  memberNo: {
    fontSize: 14,
    color: '#0078D4',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#616161',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  pokokStatus: {
    alignItems: 'center',
    padding: 12,
  },
  pokokBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  pokokText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#c42b1c',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
