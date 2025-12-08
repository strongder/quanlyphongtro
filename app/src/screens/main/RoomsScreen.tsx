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
import { Room } from '../../types';
import { roomService } from '../../services/api';

const RoomsScreen = ({ navigation }: any) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'TRONG' | 'CO_KHACH'>('all');

  const loadRooms = async () => {
    try {
      const data = await roomService.getRooms(filter === 'all' ? undefined : filter);
      setRooms(data);
    } catch (error) {
      console.log('Error loading rooms:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phòng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [filter]);

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa phòng ${room.maPhong}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await roomService.deleteRoom(room.id);
              loadRooms();
              Alert.alert('Thành công', 'Đã xóa phòng');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa phòng');
            }
          },
        },
      ]
    );
  };

  const renderRoomItem = ({ item }: { item: Room }) => {
    // Parse taiSan nếu là string JSON
    const parsedTaiSan = (() => {
      if (!item.taiSan) return null;
      if (typeof item.taiSan === 'string') {
        try {
          return JSON.parse(item.taiSan);
        } catch (e) {
          return null;
        }
      }
      return item.taiSan;
    })();

    return (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => navigation.navigate('RoomDetail', { room: item })}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomCode}>{item.maPhong}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.trangThai === 'CO_KHACH' ? '#34C759' : '#FF9500' }
        ]}>
          <Text style={styles.statusText}>
            {item.trangThai === 'CO_KHACH' ? 'Có khách' : 'Trống'}
          </Text>
        </View>
      </View>
      
      <View style={styles.roomInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.giaThue.toLocaleString()}đ/tháng</Text>
        </View>
        
        {item.dienTich && (
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.dienTich}m²</Text>
          </View>
        )}
        
        {parsedTaiSan && Object.keys(parsedTaiSan).length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.infoText} numberOfLines={2}>
              {Object.entries(parsedTaiSan).map(([name, qty]) => `${name} (${qty})`).join(', ')}
            </Text>
          </View>
        )}
        
        {item.note && (
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.note}</Text>
          </View>
        )}

        {item.currentTenants && item.currentTenants.length > 0 && (
          <View style={styles.tenantsBlock}>
            <View style={styles.tenantsHeader}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.tenantsTitle}>Khách đang ở:</Text>
            </View>
            {item.currentTenants.map((t) => (
              <View key={t.id} style={styles.tenantRow}>
                <Text style={styles.tenantName}>
                  {t.hoTen} {t.isPrimaryTenant ? '(Chính)' : ''}
                </Text>
                {!!t.soDienThoai && (
                  <Text style={styles.tenantPhone}>{t.soDienThoai}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.roomActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RoomDetail', { room: item })}
        >
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Xem</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteRoom(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.actionText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    );
  };

  const filterButtons = [
    { key: 'all', label: 'Tất cả' },
    { key: 'TRONG', label: 'Trống' },
    { key: 'CO_KHACH', label: 'Có khách' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý phòng</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('RoomDetail', { room: null })}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
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

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadRooms} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có phòng nào</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('RoomDetail', { room: null })}
            >
              <Text style={styles.emptyButtonText}>Thêm phòng đầu tiên</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  roomCard: {
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
  roomHeader: {
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
  roomInfo: {
    marginBottom: 12,
  },
  tenantsBlock: {
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 8,
  },
  tenantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  tenantsTitle: {
    marginLeft: 6,
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  tenantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 14,
    color: '#333',
  },
  tenantPhone: {
    fontSize: 13,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  roomActions: {
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
    backgroundColor: '#007AFF',
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

export default RoomsScreen;
