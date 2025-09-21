import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Invoice, Room } from '../../types';
import { invoiceService, roomService } from '../../services/api';

const InvoicesScreen = ({ navigation }: any) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PAID' | 'UNPAID'>('all');
  const [selectedKy, setSelectedKy] = useState(getCurrentKy());

  function getCurrentKy() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const loadData = async () => {
    try {
      const [invoicesData, roomsData] = await Promise.all([
        invoiceService.getInvoices(filter === 'all' ? undefined : filter, undefined, selectedKy),
        roomService.getRooms()
      ]);
      setInvoices(invoicesData);
      setRooms(roomsData);
    } catch (error) {
      console.log('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, selectedKy]);

  const getRoomInfo = (roomId: number) => {
    return rooms.find(room => room.id === roomId);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Xác nhận thanh toán',
      `Bạn có chắc muốn đánh dấu hóa đơn phòng ${getRoomInfo(invoice.roomId)?.maPhong} đã thanh toán?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thanh toán',
          onPress: async () => {
            try {
              await invoiceService.payInvoice(invoice.id);
              loadData();
              Alert.alert('Thành công', 'Đã đánh dấu thanh toán');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
            }
          },
        },
      ]
    );
  };

  const handleGenerateInvoices = () => {
    Alert.alert(
      'Tạo hóa đơn',
      `Tạo hóa đơn cho kỳ ${selectedKy}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo',
          onPress: async () => {
            try {
              await invoiceService.generateInvoices(selectedKy);
              loadData();
              Alert.alert('Thành công', 'Đã tạo hóa đơn cho kỳ này');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể tạo hóa đơn');
            }
          },
        },
      ]
    );
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const room = getRoomInfo(item.roomId);

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        onPress={() => navigation.navigate('InvoiceDetail', { invoice: item, room })}
      >
        <View style={styles.invoiceHeader}>
          <Text style={styles.roomCode}>{room?.maPhong || 'N/A'}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'PAID' ? '#34C759' : '#FF9500' }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Text>
          </View>
        </View>
        
        <View style={styles.invoiceInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kỳ:</Text>
            <Text style={styles.infoValue}>{item.ky}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tiền phòng:</Text>
            <Text style={styles.infoValue}>{item.tienPhong.toLocaleString()}đ</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Điện ({item.dienTieuThu} kWh):</Text>
            <Text style={styles.infoValue}>{(item.dienTieuThu * item.donGiaDien).toLocaleString()}đ</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nước ({item.nuocTieuThu} m³):</Text>
            <Text style={styles.infoValue}>{(item.nuocTieuThu * item.donGiaNuoc).toLocaleString()}đ</Text>
          </View>
          
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>{item.tongCong.toLocaleString()}đ</Text>
          </View>
        </View>

        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('InvoiceDetail', { invoice: item, room })}
          >
            <Ionicons name="eye-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Xem</Text>
          </TouchableOpacity>
          
          {item.status === 'UNPAID' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePayInvoice(item)}
            >
              <Ionicons name="checkmark-outline" size={20} color="#34C759" />
              <Text style={styles.actionText}>Thanh toán</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const generateKyOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ky = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      options.push(ky);
    }
    return options;
  };

  const filterButtons = [
    { key: 'all', label: 'Tất cả' },
    { key: 'UNPAID', label: 'Chưa thanh toán' },
    { key: 'PAID', label: 'Đã thanh toán' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hóa đơn</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateInvoices}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.kyFilter}>
          <Text style={styles.filterLabel}>Kỳ:</Text>
          <FlatList
            horizontal
            data={generateKyOptions()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.kyButton,
                  selectedKy === item && styles.kyButtonActive
                ]}
                onPress={() => setSelectedKy(item)}
              >
                <Text style={[
                  styles.kyButtonText,
                  selectedKy === item && styles.kyButtonTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        
        <View style={styles.statusFilter}>
          {filterButtons.map((button) => (
            <TouchableOpacity
              key={button.key}
              style={[
                styles.filterButton,
                filter === button.key && styles.filterButtonActive
              ]}
              onPress={() => setFilter(button.key as any)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === button.key && styles.filterButtonTextActive
              ]}>
                {button.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={invoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có hóa đơn nào cho kỳ {selectedKy}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleGenerateInvoices}
            >
              <Text style={styles.emptyButtonText}>Tạo hóa đơn</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#34C759',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kyFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  kyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  kyButtonActive: {
    backgroundColor: '#007AFF',
  },
  kyButtonText: {
    fontSize: 14,
    color: '#666',
  },
  kyButtonTextActive: {
    color: 'white',
  },
  statusFilter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  invoiceInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InvoicesScreen;
