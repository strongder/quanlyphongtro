import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { roomService, invoiceService } from '../../services/api';
import { Room, Invoice } from '../../types';

const TenantDashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [roomsData, invoicesData] = await Promise.all([
        roomService.getRooms(),
        invoiceService.getInvoices()
      ]);
      
      setRoom(roomsData[0] || null); // Khách thuê chỉ có 1 phòng
      setInvoices(invoicesData);
    } catch (error) {
      console.log('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: logout },
      ]
    );
  };

  const getCurrentKy = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentKy = getCurrentKy();
  const currentInvoice = invoices.find(inv => inv.ky === currentKy);
  const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Thông tin phòng */}
      {room ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Thông tin phòng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã phòng:</Text>
            <Text style={styles.value}>{room.maPhong}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Giá thuê:</Text>
            <Text style={styles.value}>{room.giaThue.toLocaleString()}đ/tháng</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={[styles.value, styles.occupiedText]}>Có khách</Text>
          </View>
          {room.note && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ghi chú:</Text>
              <Text style={styles.value}>{room.note}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Thông tin phòng</Text>
          <Text style={styles.noRoomText}>Chưa có thông tin phòng</Text>
        </View>
      )}

      {/* Hóa đơn hiện tại */}
      {currentInvoice && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Hóa đơn tháng {currentKy}</Text>
          <View style={styles.invoiceInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tiền phòng:</Text>
              <Text style={styles.value}>{currentInvoice.tienPhong.toLocaleString()}đ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Điện tiêu thụ:</Text>
              <Text style={styles.value}>{currentInvoice.dienTieuThu} kWh</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nước tiêu thụ:</Text>
              <Text style={styles.value}>{currentInvoice.nuocTieuThu} m³</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tổng cộng:</Text>
              <Text style={[styles.value, styles.totalAmount]}>
                {currentInvoice.tongCong.toLocaleString()}đ
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[
                styles.value,
                currentInvoice.status === 'PAID' ? styles.paidText : styles.unpaidText
              ]}>
                {currentInvoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Hóa đơn chưa thanh toán */}
      {unpaidInvoices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ Hóa đơn chưa thanh toán</Text>
          {unpaidInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceItem}>
              <Text style={styles.invoiceKy}>Tháng {invoice.ky}</Text>
              <Text style={styles.invoiceAmount}>{invoice.tongCong.toLocaleString()}đ</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Thao tác nhanh</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Invoices')}
          >
            <Ionicons name="receipt-outline" size={24} color="#007AFF" />
            <Text style={styles.actionText}>Xem hóa đơn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Meter')}
          >
            <Ionicons name="speedometer-outline" size={24} color="#34C759" />
            <Text style={styles.actionText}>Chỉ số điện nước</Text>
          </TouchableOpacity>
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
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  occupiedText: {
    color: '#34C759',
  },
  noRoomText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  invoiceInfo: {
    marginTop: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paidText: {
    color: '#34C759',
  },
  unpaidText: {
    color: '#FF3B30',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  invoiceKy: {
    fontSize: 16,
    color: '#333',
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    minWidth: 120,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TenantDashboardScreen;
