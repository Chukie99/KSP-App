import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function RiwayatScreen() {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRiwayat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get anggota id
      const { data: anggota } = await supabase
        .from('anggota')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!anggota) return;

      // Get simpanan
      const { data: simpanan } = await supabase
        .from('simpanan')
        .select('*')
        .eq('anggota_id', anggota.id)
        .order('created_at', { ascending: false });

      // Get pembayaran (angsuran)
      const { data: pembayaran } = await supabase
        .from('pembayaran')
        .select('*')
        .eq('anggota_id', anggota.id)
        .order('created_at', { ascending: false });

      // Gabungkan dan urutkan berdasarkan tanggal
      const allRiwayat = [
        ...(simpanan || []).map((s: any) => ({
          ...s,
          tipe: 'simpanan',
          deskripsi: `Simpanan ${s.jenis === 'pokok' ? 'Pokok' : s.jenis === 'wajib' ? 'Wajib' : 'Sukarela'}`,
        })),
        ...(pembayaran || []).map((p: any) => ({
          ...p,
          tipe: p.jenis,
          deskripsi: p.jenis === 'angsuran' ? 'Angsuran Pinjaman' : 'Simpanan via Pembayaran',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRiwayat(allRiwayat);
    } catch (error) {
      console.error('Riwayat error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRiwayat();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRiwayat();
  };

  const getIcon = (item: any) => {
    if (item.tipe === 'simpanan') return '💰';
    if (item.tipe === 'angsuran') return '📋';
    return '💳';
  };

  const getColor = (item: any) => {
    if (item.tipe === 'simpanan') return '#0e7a0d';
    if (item.tipe === 'angsuran') return '#0078D4';
    return '#616161';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.listCard}>
        {riwayat.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
        ) : (
          riwayat.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.iconContainer, { backgroundColor: getColor(item) + '15' }]}>
                <Text style={styles.icon}>{getIcon(item)}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.deskripsi}</Text>
                <Text style={styles.listDate}>
                  {new Date(item.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[styles.listAmount, { color: getColor(item) }]}>
                +Rp {item.nominal.toLocaleString('id-ID')}
              </Text>
            </View>
          ))
        )}
      </View>
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
  listCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    color: '#9e9e9e',
    fontSize: 13,
    textAlign: 'center',
    padding: 40,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  listDate: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  listAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
