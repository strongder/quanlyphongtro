import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Payment } from '../../types';

interface PaymentDetailScreenProps {
  route: {
    params: {
      payment: Payment & { ky?: string; roomId?: number; tenantName?: string; soDienThoai?: string };
    };
  };
  navigation: any;
}

const PaymentDetailScreen = ({ route, navigation }: PaymentDetailScreenProps) => {
  const { payment } = route.params;

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Thành công';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      default:
        return 'Không xác định';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MOMO':
        return 'wallet';
      case 'VNPAY':
        return 'card';
      case 'CASH':
        return 'cash';
      case 'BANK':
        return 'card-outline';
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
      second: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: getStatusColor(payment.status) }]}>
          <Ionicons name={getStatusIcon(payment.status) as any} size={64} color="white" />
          <Text style={styles.statusText}>{getStatusLabel(payment.status)}</Text>
          <Text style={styles.amountText}>{formatCurrency(payment.amount)}</Text>
        </View>

        {/* Transaction Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin giao dịch</Text>
          
          {payment.transactionId && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="receipt-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Mã giao dịch</Text>
              </View>
              <Text style={styles.infoValue}>{payment.transactionId}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name={getMethodIcon(payment.paymentMethod) as any} size={20} color="#6b7280" />
              <Text style={styles.labelText}>Phương thức</Text>
            </View>
            <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.labelText}>Thời gian tạo</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(payment.createdAt)}</Text>
          </View>

          {payment.paidAt && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="checkmark-done-outline" size={20} color="#10b981" />
                <Text style={styles.labelText}>Thanh toán lúc</Text>
              </View>
              <Text style={[styles.infoValue, { color: '#10b981' }]}>
                {formatDate(payment.paidAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin hóa đơn</Text>
          
          {(payment as any).roomId && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="business-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Phòng</Text>
              </View>
              <Text style={styles.infoValue}>Phòng {(payment as any).roomId}</Text>
            </View>
          )}

          {((payment as any).ky || payment.invoice?.ky) && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Kỳ thanh toán</Text>
              </View>
              <Text style={styles.infoValue}>
                {(payment as any).ky || payment.invoice?.ky}
              </Text>
            </View>
          )}

          {((payment as any).invoiceAmount || payment.invoice?.tongCong) && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="document-text-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Tổng hóa đơn</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatCurrency((payment as any).invoiceAmount || payment.invoice?.tongCong)}
              </Text>
            </View>
          )}
        </View>

        {/* Tenant Info */}
        {((payment as any).tenantName || payment.tenant?.hoTen) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <Text style={styles.labelText}>Tên khách hàng</Text>
              </View>
              <Text style={styles.infoValue}>
                {(payment as any).tenantName || payment.tenant?.hoTen}
              </Text>
            </View>

            {((payment as any).soDienThoai || payment.tenant?.soDienThoai) && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="call-outline" size={20} color="#6b7280" />
                  <Text style={styles.labelText}>Số điện thoại</Text>
                </View>
                <Text style={styles.infoValue}>
                  {(payment as any).soDienThoai || payment.tenant?.soDienThoai}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  statusHeader: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentDetailScreen;
