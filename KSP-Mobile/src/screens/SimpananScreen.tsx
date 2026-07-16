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

export default function SimpananScreen() {
  const [simpanan, setSimpanan] = useState<any[]>([]);
  const [summary, setSummary] = useState({ pokok: 0, wajib: 0, sukarela: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSimpanan = async () => {
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

      // Get all simpanan
      const { data } = await supabase
        .from('simpanan')
        .select('*')
        .eq('anggota_id', anggota.id)
        .order('created_at', { ascending: false });

      setSimpanan(data || []);

      // Calculate summary
      const sum = { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
      data?.forEach((s: any) => {
        if (s.jenis === 'pokok') sum.pokok += s.nominal;
        else if (s.jenis === 'wajib') sum.wajib += s.nominal;
        else if (s.jenis === 'sukarela') sum.sukarela += s.nominal;
        sum.total += s.nominal;
      });
      setSummary(sum);
    } catch (error) {
      console.error('Simpanan error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSimpanan();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSimpanan();
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
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Simpanan</Text>
        <Text style={styles.summaryTotal}>
          Rp {summary.total.toLocaleString('id-ID')}
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: '#0078D4' }]} />
            <View>
              <Text style={styles.summaryLabel}>Pokok</Text>
              <Text style={styles.summaryValue}>
                Rp {summary.pokok.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: '#0e7a0d' }]} />
            <View>
              <Text style={styles.summaryLabel}>Wajib</Text>
              <Text style={styles.summaryValue}>
                Rp {summary.wajib.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: '#9d5d00' }]} />
            <View>
              <Text style={styles.summaryLabel}>Sukarela</Text>
              <Text style={styles.summaryValue}>
                Rp {summary.sukarela.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Riwayat Simpanan */}
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>Riwayat Simpanan</Text>
        {simpanan.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada simpanan</Text>
        ) : (
          simpanan.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[
                  styles.jenisBadge,
                  item.jenis === 'pokok' && { backgroundColor: '#0078D4' },
                  item.jenis === 'wajib' && { backgroundColor: '#0e7a0d' },
                  item.jenis === 'sukarela' && { backgroundColor: '#9d5d00' },
                ]}>
                  <Text style={styles.jenisText}>
                    {item.jenis === 'pokok' ? 'Pokok' : item.jenis === 'wajib' ? 'Wajib' : 'Sukarela'}
                  </Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.listDate}>
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  {item.keterangan ? (
                    <Text style={styles.listNote}>{item.keterangan}</Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.listAmount}>
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
  summaryCard: {
    backgroundColor: '#0078D4',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  listCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    color: '#9e9e9e',
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jenisBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jenisText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  listDate: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  listNote: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  listAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e7a0d',
  },
});
