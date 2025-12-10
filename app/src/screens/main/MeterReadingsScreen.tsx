import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeterReading, Room } from '../../types';
import { meterService, roomService } from '../../services/api';

const MeterReadingsScreen = ({ navigation }: any) => {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKy, setSelectedKy] = useState(getCurrentKy());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    dienSoCu: '',
    dienSoMoi: '',
    nuocSoCu: '',
    nuocSoMoi: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getCurrentKy() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const loadData = async () => {
    try {
      const [readingsData, roomsData] = await Promise.all([
        meterService.getMeterReadings(undefined, selectedKy),
        roomService.getRooms()
      ]);
      setReadings(readingsData);
      setRooms(roomsData);
    } catch (error) {
      console.log('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };
  const handleFetchLatestMeterReading = async (roomId: number): Promise<MeterReading | null> => {
    try {
      const readingsData = await meterService.fetchLatestMeterReading(roomId);
      return readingsData || null;
    } catch (error) {
      console.log('Error fetching nearest meter reading:', error);
      return null;
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedKy]);

  const getRoomInfo = (roomId: number) => {
    return rooms.find(room => room.id === roomId);
  };

  const handleLockReading = (reading: MeterReading) => {
    Alert.alert(
      'Xác nhận khóa',
      `Bạn có chắc muốn khóa chỉ số phòng ${getRoomInfo(reading.roomId)?.maPhong}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khóa',
          onPress: async () => {
            try {
              await meterService.lockMeterReading(reading.id);
              loadData();
              Alert.alert('Thành công', 'Đã khóa chỉ số');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể khóa chỉ số');
            }
          },
        },
      ]
    );
  };

  const handleAddReading = () => {
    setShowAddModal(true);
    setSelectedRoom(null);
    setFormData({
      dienSoCu: '',
      dienSoMoi: '',
      nuocSoCu: '',
      nuocSoMoi: '',
    });
  };

  const handleRoomSelect = (room: Room) => {
    // Tự động điền chỉ số cũ từ chỉ số của kỳ trước nếu có
    handleFetchLatestMeterReading(room.id).then((lastReading) => {
      if (lastReading) {
        setFormData({
          dienSoCu: lastReading.dienSoMoi?.toString() || '',
          dienSoMoi: '',
          nuocSoCu: lastReading.nuocSoMoi?.toString() || '',
          nuocSoMoi: '',
        });
      } else {
        setFormData({
          dienSoCu: '0',
          dienSoMoi: ``,
          nuocSoCu: '0',
          nuocSoMoi: '',
        });
      }
    });
    setSelectedRoom(room);
  };

  const handleSubmitReading = async () => {
    if (!selectedRoom) {
      Alert.alert('Lỗi', 'Vui lòng chọn phòng');
      return;
    }

    if (!formData.dienSoMoi || !formData.nuocSoMoi) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ chỉ số mới');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const readingData = {
        roomId: selectedRoom.id,
        ky: selectedKy,
        dienSoCu: parseInt(formData.dienSoCu) || 0,
        dienSoMoi: parseInt(formData.dienSoMoi),
        nuocSoCu: parseInt(formData.nuocSoCu) || 0,
        nuocSoMoi: parseInt(formData.nuocSoMoi),
      };

      await meterService.createMeterReading(readingData);
      setShowAddModal(false);
      loadData();
      Alert.alert('Thành công', 'Đã thêm chỉ số điện nước');
    } catch (error) {
      console.log('Error creating meter reading:', error);
      Alert.alert('Lỗi', 'Không thể thêm chỉ số điện nước');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableRooms = () => {
    // Lấy danh sách phòng có khách và chưa có chỉ số trong kỳ hiện tại
    const roomsWithReadings = readings.map(r => r.roomId);
    return rooms.filter(room => 
      room.trangThai === 'CO_KHACH' && !roomsWithReadings.includes(room.id)
    );
  };

  const renderReadingItem = ({ item }: { item: MeterReading }) => {
    const room = getRoomInfo(item.roomId);
    const dienTieuThu = (item.dienSoMoi || 0) - (item.dienSoCu || 0);
    const nuocTieuThu = (item.nuocSoMoi || 0) - (item.nuocSoCu || 0);

    return (
      <View style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <Text style={styles.roomCode}>{room?.maPhong || 'N/A'}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.locked ? '#FF3B30' : '#34C759' }
          ]}>
            <Text style={styles.statusText}>
              {item.locked ? 'Đã khóa' : 'Chưa khóa'}
            </Text>
          </View>
        </View>
        
        <View style={styles.readingInfo}>
          <View style={styles.meterRow}>
            <Text style={styles.meterLabel}>Điện:</Text>
            <Text style={styles.meterValue}>
              {item.dienSoCu || 0} → {item.dienSoMoi || 0} ({dienTieuThu} kWh)
            </Text>
          </View>
          
          <View style={styles.meterRow}>
            <Text style={styles.meterLabel}>Nước:</Text>
            <Text style={styles.meterValue}>
              {item.nuocSoCu || 0} → {item.nuocSoMoi || 0} ({nuocTieuThu} m³)
            </Text>
          </View>
          
          <View style={styles.meterRow}>
            <Text style={styles.meterLabel}>Kỳ:</Text>
            <Text style={styles.meterValue}>{item.ky}</Text>
          </View>
        </View>

        <View style={styles.readingActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MeterDetail', { reading: item, room })}
          >
            <Ionicons name="eye-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Xem</Text>
          </TouchableOpacity>
          
          {!item.locked && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLockReading(item)}
            >
              <Ionicons name="lock-closed-outline" size={20} color="#FF9500" />
              <Text style={styles.actionText}>Khóa</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterLabel}>Kỳ:</Text>
          {getAvailableRooms().length > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddReading}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
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

      <FlatList
        data={readings}
        renderItem={renderReadingItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="speedometer-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Chưa có chỉ số nào cho kỳ {selectedKy}
            </Text>
            {getAvailableRooms().length > 0 ? (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddReading}
              >
                <Text style={styles.emptyButtonText}>Nhập chỉ số đầu tiên</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyInfoContainer}>
                <Text style={styles.emptyInfoText}>
                  Không có phòng nào cần nhập chỉ số
                </Text>
                <Text style={styles.emptyInfoSubtext}>
                  Tất cả phòng có khách đã có chỉ số trong kỳ này
                </Text>
              </View>
            )}
          </View>
        }
      />

      {/* Modal nhập chỉ số */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nhập chỉ số điện nước</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn phòng có khách</Text>
              <Text style={styles.sectionSubtitle}>
                Chỉ hiển thị các phòng đang có khách thuê và chưa có chỉ số trong kỳ {selectedKy}
              </Text>
              <View style={styles.roomList}>
                {getAvailableRooms().map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomItem,
                      selectedRoom?.id === room.id && styles.roomItemSelected
                    ]}
                    onPress={() => handleRoomSelect(room)}
                  >
                    <Text style={styles.roomCode}>{room.maPhong}</Text>
                    <Text style={styles.roomPrice}>{room.giaThue.toLocaleString()}đ/tháng</Text>
                    <Text style={styles.roomStatus}>
                      {room.trangThai === 'CO_KHACH' ? 'Có khách' : 'Trống'}
                    </Text>
                  </TouchableOpacity>
                ))}
                {getAvailableRooms().length === 0 && (
                  <View style={styles.emptyRoomsContainer}>
                    <Ionicons name="home-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyRoomsText}>
                      Không có phòng nào cần nhập chỉ số
                    </Text>
                    <Text style={styles.emptyRoomsSubtext}>
                      Tất cả phòng có khách đã có chỉ số trong kỳ này
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {selectedRoom && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chỉ số điện</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số cũ (kWh):</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.dienSoCu}
                    editable={false}
                    keyboardType="numeric"
                    placeholder="Nhập chỉ số cũ"
                  
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số mới (kWh):</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.dienSoMoi}
                    onChangeText={(text) => setFormData({...formData, dienSoMoi: text})}
                    keyboardType="numeric"
                    placeholder="Nhập chỉ số mới"
                  />
                </View>
              </View>
            )}

            {selectedRoom && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chỉ số nước</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số cũ (m³):</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nuocSoCu}
                    editable={false}
                    // onChangeText={(text) => setFormData({...formData, nuocSoCu: text})}
                    keyboardType="numeric"
                    placeholder="Nhập chỉ số cũ"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số mới (m³):</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nuocSoMoi}
                    onChangeText={(text) => setFormData({...formData, nuocSoMoi: text})}
                    keyboardType="numeric"
                    placeholder="Nhập chỉ số mới"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !selectedRoom && styles.submitButtonDisabled]}
              onPress={handleSubmitReading}
              disabled={!selectedRoom || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  listContainer: {
    padding: 16,
  },
  readingCard: {
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
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  readingInfo: {
    marginBottom: 12,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  meterLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  meterValue: {
    fontSize: 14,
    color: '#333',
  },
  readingActions: {
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
  emptyInfoContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyInfoSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  roomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roomItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  roomCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyRoomsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyRoomsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRoomsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MeterReadingsScreen;
