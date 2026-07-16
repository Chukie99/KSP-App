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

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get anggota data
      const { data: anggota } = await supabase
        .from('anggota')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!anggota) return;

      // Get simpanan summary
      const { data: simpanan } = await supabase
        .from('simpanan')
        .select('jenis, nominal')
        .eq('anggota_id', anggota.id);

      const summary = {
        pokok: 0,
        wajib: 0,
        sukarela: 0,
        total: 0,
      };

      simpanan?.forEach((s: any) => {
        if (s.jenis === 'pokok') summary.pokok += s.nominal;
        else if (s.jenis === 'wajib') summary.wajib += s.nominal;
        else if (s.jenis === 'sukarela') summary.sukarela += s.nominal;
        summary.total += s.nominal;
      });

      // Get pinjaman aktif
      const { data: pinjaman } = await supabase
        .from('pinjaman')
        .select('sisa_pinjaman, status')
        .eq('anggota_id', anggota.id)
        .eq('status', 'aktif');

      const totalPinjaman = pinjaman?.reduce((sum: number, p: any) => sum + p.sisa_pinjaman, 0) || 0;

      // Get riwayat terakhir
      const { data: riwayat } = await supabase
        .from('simpanan')
        .select('*')
        .eq('anggota_id', anggota.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setDashboard({
        anggota,
        summary,
        pinjamanAktif: pinjaman?.length || 0,
        totalPinjaman,
        riwayat: riwayat || [],
      });
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0078D4" />
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Selamat datang,</Text>
        <Text style={styles.name}>{dashboard.anggota.nama}</Text>
        <Text style={styles.memberNo}>{dashboard.anggota.no_anggota}</Text>
      </View>

      {/* Saldo Simpanan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saldo Simpanan</Text>
        <Text style={styles.totalAmount}>
          Rp {dashboard.summary.total.toLocaleString('id-ID')}
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pokok</Text>
            <Text style={styles.summaryValue}>
              Rp {dashboard.summary.pokok.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Wajib</Text>
            <Text style={styles.summaryValue}>
              Rp {dashboard.summary.wajib.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sukarela</Text>
            <Text style={styles.summaryValue}>
              Rp {dashboard.summary.sukarela.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* Pinjaman */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pinjaman Aktif</Text>
        <View style={styles.pinjamanRow}>
          <View>
            <Text style={styles.pinjamanLabel}>Jumlah Pinjaman</Text>
            <Text style={styles.pinjamanValue}>{dashboard.pinjamanAktif} pinjaman</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.pinjamanLabel}>Total Sisa</Text>
            <Text style={[styles.pinjamanValue, { color: '#c42b1c' }]}>
              Rp {dashboard.totalPinjaman.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* Riwayat Terakhir */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Riwayat Terakhir</Text>
        {dashboard.riwayat.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada transaksi</Text>
        ) : (
          dashboard.riwayat.map((item: any, index: number) => (
            <View key={index} style={styles.riwayatItem}>
              <View>
                <Text style={styles.riwayatJenis}>
                  Simpanan {item.jenis === 'pokok' ? 'Pokok' : item.jenis === 'wajib' ? 'Wajib' : 'Sukarela'}
                </Text>
                <Text style={styles.riwayatDate}>
                  {new Date(item.created_at).toLocaleDateString('id-ID')}
                </Text>
              </View>
              <Text style={styles.riwayatAmount}>
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
  errorText: {
    color: '#616161',
    fontSize: 14,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#616161',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 2,
  },
  memberNo: {
    fontSize: 13,
    color: '#0078D4',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0078D4',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pinjamanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pinjamanLabel: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 4,
  },
  pinjamanValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  emptyText: {
    color: '#9e9e9e',
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  riwayatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  riwayatJenis: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  riwayatDate: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  riwayatAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e7a0d',
  },
});
