import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../../services/api';
import { Payment, PaymentFilters } from '../../types';

export default function PaymentsScreen({ navigation }: any) {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 30,
  });
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | 'MOMO' | 'VNPAY'>('ALL');

  // Fetch payments
  const {
    data: paymentsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => paymentService.getAllPayments(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentService.getPaymentStats(),
  });

  const handleFilterChange = (status: 'ALL' | 'SUCCESS' | 'FAILED') => {
    setSelectedFilter(status);
    setFilters((prev) => ({
      ...prev,
      status: status === 'ALL' ? undefined : status,
      page: 1,
    }));
  };

  const handleMethodChange = (method: 'ALL' | 'MOMO' | 'VNPAY') => {
    setSelectedMethod(method);
    setFilters((prev) => ({
      ...prev,
      paymentMethod: method === 'ALL' ? undefined : method,
      page: 1,
    }));
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#10b981'
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'checkmark-circle';
      case 'FAILED':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MOMO':
        return 'wallet';
      case 'VNPAY':
        return 'card';
      default:
        return 'help-circle';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPaymentItem = ({ item }: { item: Payment & { ky?: string; roomId?: number; tenantName?: string; soDienThoai?: string } }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetail', { payment: item })}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.roomInfo}>
          <Ionicons name="business" size={20} color="#3b82f6" />
          <Text style={styles.roomText}>Phòng {(item as any).roomId || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{(item as any).tenantName || item.tenant?.hoTen || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Kỳ: {(item as any).ky || item.invoice?.ky || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name={getMethodIcon(item.paymentMethod) as any} size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.paymentMethod}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStats = () => {
    if (!stats || stats.length === 0) return null;

    // Backend returns array of { paymentMethod, totalPayments, totalSuccessAmount, successCount, failedCount, pendingCount }
    const totalAmount = stats.reduce((sum, stat) => sum + (stat.totalSuccessAmount || 0), 0);
    const totalCount = stats.reduce((sum, stat) => sum + (stat.totalPayments || 0), 0);

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng giao dịch</Text>
          <Text style={styles.statValue}>{totalCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng tiền</Text>
          <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        {stats.map((stat) => (
          <View key={stat.paymentMethod} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.paymentMethod}</Text>
            <Text style={styles.statValue}>{formatCurrency(stat.totalSuccessAmount || 0)}</Text>
            <Text style={styles.statCount}>{stat.totalPayments || 0} GD</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats */}
      {renderStats()}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Trạng thái:</Text>
        <View style={styles.filterButtons}>
          {(['ALL', 'SUCCESS', 'FAILED'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, selectedFilter === status && styles.filterButtonActive]}
              onPress={() => handleFilterChange(status)}
            >
              <Text style={[styles.filterButtonText, selectedFilter === status && styles.filterButtonTextActive]}>
                {status === 'ALL' ? 'Tất cả' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterLabel}>Phương thức:</Text>
        <View style={styles.filterButtons}>
          {(['ALL', 'MOMO', 'VNPAY'] as const).map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.filterButton, selectedMethod === method && styles.filterButtonActive]}
              onPress={() => handleMethodChange(method)}
            >
              <Text style={[styles.filterButtonText, selectedMethod === method && styles.filterButtonTextActive]}>
                {method === 'ALL' ? 'Tất cả' : method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment List */}
      {isLoading && !isRefetching ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={paymentsData?.payments || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Không có giao dịch nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statCount: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
    overviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  roomText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
});
