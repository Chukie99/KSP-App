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

export default function PinjamanScreen() {
  const [pinjaman, setPinjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPinjaman = async () => {
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

      // Get all pinjaman
      const { data } = await supabase
        .from('pinjaman')
        .select('*')
        .eq('anggota_id', anggota.id)
        .order('created_at', { ascending: false });

      setPinjaman(data || []);
    } catch (error) {
      console.error('Pinjaman error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPinjaman();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPinjaman();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktif': return '#0078D4';
      case 'lunas': return '#0e7a0d';
      case 'macet': return '#c42b1c';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aktif': return 'Aktif';
      case 'lunas': return 'Lunas';
      case 'macet': return 'Macet';
      default: return status;
    }
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
      {pinjaman.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Tidak Ada Pinjaman</Text>
          <Text style={styles.emptySubtitle}>Anda belum memiliki pinjaman aktif</Text>
        </View>
      ) : (
        pinjaman.map((item, index) => {
          const progress = ((item.jumlah + (item.jumlah * item.bunga_persen / 100) - item.sisa_pinjaman) /
            (item.jumlah + (item.jumlah * item.bunga_persen / 100))) * 100;

          return (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.noPinjaman}>{item.no_pinjaman}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Jumlah Pinjaman</Text>
                  <Text style={styles.infoValue}>
                    Rp {item.jumlah.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bunga</Text>
                  <Text style={styles.infoValue}>{item.bunga_persen}% / tahun</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tenor</Text>
                  <Text style={styles.infoValue}>{item.tenor} bulan</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cicilan/Bulan</Text>
                  <Text style={styles.infoValue}>
                    Rp {item.cicilan_per_bulan.toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tanggal Mulai</Text>
                  <Text style={styles.infoValue}>
                    {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              {item.status === 'aktif' && (
                <View style={styles.cardFooter}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Progress Pembayaran</Text>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(progress, 100)}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressDetail}>
                    <Text style={styles.progressDetailText}>
                      Sisa: Rp {item.sisa_pinjaman.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9e9e9e',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  noPinjaman: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0078D4',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#616161',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cardFooter: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#616161',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0078D4',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0078D4',
    borderRadius: 3,
  },
  progressDetail: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  progressDetailText: {
    fontSize: 12,
    color: '#c42b1c',
    fontWeight: '500',
  },
});
