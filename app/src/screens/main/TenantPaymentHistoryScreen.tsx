import React from 'react';
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
import { Payment } from '../../types';

export default function TenantPaymentHistoryScreen({ navigation }: any) {
  // Fetch tenant's payment history
  const {
    data: payments,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tenant-payments'],
    queryFn: () => paymentService.getTenantPayments(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
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
      case 'PENDING':
        return 'time';
      case 'FAILED':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'cash';
      case 'BANK':
        return 'card';
      case 'VNPAY':
        return 'wallet';
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

  const renderPaymentItem = ({ item }: { item: Payment & { ky?: string; roomId?: number; tenantName?: string } }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => navigation.navigate('PaymentDetail', { payment: item })}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.roomInfo}>
            <Ionicons name="business" size={20} color="#3b82f6" />
            <Text style={styles.roomText}>Phòng {(item as any).roomId || 'N/A'}</Text>
          </View>
          <Text style={styles.period}>Kỳ: {(item as any).ky || item.invoice?.ky || 'N/A'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          {item.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.paymentDetails}>
        {item.paymentMethod && (
          <View style={styles.detailRow}>
            <Ionicons name={getMethodIcon(item.paymentMethod) as any} size={18} color="#3b82f6" />
            <Text style={styles.detailLabel}>Phương thức:</Text>
            <Text style={styles.detailValue}>{item.paymentMethod}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time" size={18} color="#6b7280" />
          <Text style={styles.detailLabel}>Thời gian:</Text>
          <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
        </View>
        {item.transactionId && (
          <View style={styles.detailRow}>
            <Ionicons name="receipt" size={18} color="#6b7280" />
            <Text style={styles.detailLabel}>Mã GD:</Text>
            <Text style={styles.detailValue}>{item.transactionId}</Text>
          </View>
        )}
        {item.paidAt && (
          <View style={styles.detailRow}>
            <Ionicons name="checkmark-done" size={18} color="#10b981" />
            <Text style={styles.detailLabel}>Đã thanh toán:</Text>
            <Text style={styles.detailValue}>{formatDate(item.paidAt)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSummary = () => {
    if (!payments || !Array.isArray(payments) || payments.length === 0) return null;

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
    const failedCount = payments.filter((p) => p.status === 'FAILED').length;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng giao dịch</Text>
          <Text style={styles.summaryValue}>{payments.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng tiền</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        {failedCount > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: '#ef4444' + '15' }]}>
            <Text style={[styles.summaryLabel, { color: '#ef4444' }]}>Thất bại</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{failedCount}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary */}
      {renderSummary()}

      {/* Payment List */}
      {isLoading && !isRefetching ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={payments || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Chưa có lịch sử thanh toán</Text>
              <Text style={styles.emptySubText}>Các giao dịch của bạn sẽ hiển thị ở đây</Text>
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
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryCard: {
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
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  period: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 28,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
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
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  paymentDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});
