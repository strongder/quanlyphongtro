import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Invoice, Room } from '../../types';
import { invoiceService } from '../../services/api';

const InvoiceDetailScreen = ({ navigation, route }: any) => {
  const { invoice, room } = route.params;

  const handlePayInvoice = () => {
    Alert.alert(
      'Xác nhận thanh toán',
      `Bạn có chắc muốn đánh dấu hóa đơn này đã thanh toán?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thanh toán',
          onPress: async () => {
            try {
              await invoiceService.payInvoice(invoice.id);
              Alert.alert('Thành công', 'Đã đánh dấu thanh toán');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.roomCode}>{room?.maPhong || 'N/A'}</Text>
          <Text style={styles.ky}>Kỳ: {invoice.ky}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: invoice.status === 'PAID' ? '#34C759' : '#FF9500' }
        ]}>
          <Text style={styles.statusText}>
            {invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
        
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tiền phòng:</Text>
            <Text style={styles.detailValue}>{invoice.tienPhong.toLocaleString()}đ</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Điện tiêu thụ:</Text>
            <Text style={styles.detailValue}>{invoice.dienTieuThu} kWh</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đơn giá điện:</Text>
            <Text style={styles.detailValue}>{invoice.donGiaDien.toLocaleString()}đ/kWh</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tiền điện:</Text>
            <Text style={styles.detailValue}>
              {(invoice.dienTieuThu * invoice.donGiaDien).toLocaleString()}đ
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nước tiêu thụ:</Text>
            <Text style={styles.detailValue}>{invoice.nuocTieuThu} m³</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đơn giá nước:</Text>
            <Text style={styles.detailValue}>{invoice.donGiaNuoc.toLocaleString()}đ/m³</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tiền nước:</Text>
            <Text style={styles.detailValue}>
              {(invoice.nuocTieuThu * invoice.donGiaNuoc).toLocaleString()}đ
            </Text>
          </View>
          
          {invoice.phuPhi > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phụ phí:</Text>
              <Text style={styles.detailValue}>{invoice.phuPhi.toLocaleString()}đ</Text>
            </View>
          )}
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{invoice.tongCong.toLocaleString()}đ</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Thông tin khác</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Ngày tạo:</Text>
              <Text style={styles.infoValue}>
                {new Date(invoice.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
          
          {invoice.paidAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
                <Text style={styles.infoValue}>
                  {new Date(invoice.paidAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    flex: 1,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ky: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionContainer: {
    padding: 20,
  },
  payButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InvoiceDetailScreen;
