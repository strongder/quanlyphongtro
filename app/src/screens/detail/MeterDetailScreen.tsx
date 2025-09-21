import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeterReading, Room } from '../../types';
import { meterService, roomService } from '../../services/api';

const MeterDetailScreen = ({ route, navigation }: any) => {
  const { reading, room } = route.params || {};
  const [meterReading, setMeterReading] = useState<MeterReading | null>(reading);
  const [roomInfo, setRoomInfo] = useState<Room | null>(room);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dienSoCu: '',
    dienSoMoi: '',
    nuocSoCu: '',
    nuocSoMoi: '',
  });

  useEffect(() => {
    if (reading && room) {
      setMeterReading(reading);
      setRoomInfo(room);
      setFormData({
        dienSoCu: reading.dienSoCu?.toString() || '',
        dienSoMoi: reading.dienSoMoi?.toString() || '',
        nuocSoCu: reading.nuocSoCu?.toString() || '',
        nuocSoMoi: reading.nuocSoMoi?.toString() || '',
      });
    } else {
      // Nếu không có dữ liệu, quay lại màn hình trước
      navigation.goBack();
    }
  }, [reading, room]);

  const handleSave = async () => {
    if (!meterReading) return;

    try {
      setIsLoading(true);
      
      const updatedData = {
        dienSoCu: parseInt(formData.dienSoCu),
        dienSoMoi: parseInt(formData.dienSoMoi),
        nuocSoCu: parseInt(formData.nuocSoCu),
        nuocSoMoi: parseInt(formData.nuocSoMoi),
      };

      const updatedReading = await meterService.updateMeterReading(
        meterReading.id,
        updatedData
      );

      setMeterReading(updatedReading);
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật chỉ số điện nước');
    } catch (error) {
      console.log('Error updating meter reading:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật chỉ số điện nước');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    if (!meterReading) return;

    try {
      setIsLoading(true);
      const updatedReading = await meterService.lockMeterReading(meterReading.id);
      setMeterReading(updatedReading);
      Alert.alert('Thành công', 'Đã khóa chỉ số điện nước');
    } catch (error) {
      console.log('Error locking meter reading:', error);
      Alert.alert('Lỗi', 'Không thể khóa chỉ số điện nước');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateConsumption = (oldValue: number, newValue: number) => {
    return Math.max(0, newValue - oldValue);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  if (!meterReading || !roomInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết chỉ số</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Không tìm thấy dữ liệu</Text>
        </View>
      </View>
    );
  }

  const dienTieuThu = calculateConsumption(meterReading.dienSoCu, meterReading.dienSoMoi);
  const nuocTieuThu = calculateConsumption(meterReading.nuocSoCu, meterReading.nuocSoMoi);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết chỉ số</Text>
        {!meterReading.locked && (
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => {}} />
        }
      >
        {/* Thông tin phòng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã phòng:</Text>
              <Text style={styles.infoValue}>{roomInfo.maPhong}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá thuê:</Text>
              <Text style={styles.infoValue}>{formatNumber(roomInfo.giaThue)}đ/tháng</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kỳ:</Text>
              <Text style={styles.infoValue}>{meterReading.ky}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: meterReading.locked ? '#34C759' : '#FF9500' }
                ]} />
                <Text style={styles.statusText}>
                  {meterReading.locked ? 'Đã khóa' : 'Chưa khóa'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chỉ số điện */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số điện</Text>
          <View style={styles.meterCard}>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số cũ:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.dienSoCu}
                  onChangeText={(text) => setFormData({...formData, dienSoCu: text})}
                  keyboardType="numeric"
                  placeholder="Nhập số cũ"
                />
              ) : (
                <Text style={styles.meterValue}>{formatNumber(meterReading.dienSoCu)} kWh</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số mới:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.dienSoMoi}
                  onChangeText={(text) => setFormData({...formData, dienSoMoi: text})}
                  keyboardType="numeric"
                  placeholder="Nhập số mới"
                />
              ) : (
                <Text style={styles.meterValue}>{formatNumber(meterReading.dienSoMoi)} kWh</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Tiêu thụ:</Text>
              <Text style={[styles.meterValue, styles.consumptionValue]}>
                {formatNumber(dienTieuThu)} kWh
              </Text>
            </View>
          </View>
        </View>

        {/* Chỉ số nước */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số nước</Text>
          <View style={styles.meterCard}>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số cũ:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.nuocSoCu}
                  onChangeText={(text) => setFormData({...formData, nuocSoCu: text})}
                  keyboardType="numeric"
                  placeholder="Nhập số cũ"
                />
              ) : (
                <Text style={styles.meterValue}>{formatNumber(meterReading.nuocSoCu)} m³</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Số mới:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.nuocSoMoi}
                  onChangeText={(text) => setFormData({...formData, nuocSoMoi: text})}
                  keyboardType="numeric"
                  placeholder="Nhập số mới"
                />
              ) : (
                <Text style={styles.meterValue}>{formatNumber(meterReading.nuocSoMoi)} m³</Text>
              )}
            </View>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Tiêu thụ:</Text>
              <Text style={[styles.meterValue, styles.consumptionValue]}>
                {formatNumber(nuocTieuThu)} m³
              </Text>
            </View>
          </View>
        </View>

        {/* Thông tin bổ sung */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin bổ sung</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày tạo:</Text>
              <Text style={styles.infoValue}>
                {new Date(meterReading.createdAt).toLocaleString('vi-VN')}
              </Text>
            </View>
            {meterReading.locked && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày khóa:</Text>
                <Text style={styles.infoValue}>
                  {new Date(meterReading.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Nút hành động */}
      {isEditing ? (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              setIsEditing(false);
              setFormData({
                dienSoCu: meterReading.dienSoCu?.toString() || '',
                dienSoMoi: meterReading.dienSoMoi?.toString() || '',
                nuocSoCu: meterReading.nuocSoCu?.toString() || '',
                nuocSoMoi: meterReading.nuocSoMoi?.toString() || '',
              });
            }}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        !meterReading.locked && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.lockButton]}
              onPress={handleLock}
              disabled={isLoading}
            >
              <Ionicons name="lock-closed" size={20} color="white" />
              <Text style={styles.lockButtonText}>
                {isLoading ? 'Đang khóa...' : 'Khóa chỉ số'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  meterCard: {
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
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  meterLabel: {
    fontSize: 16,
    color: '#666',
  },
  meterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  consumptionValue: {
    color: '#007AFF',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  lockButton: {
    backgroundColor: '#FF9500',
  },
  lockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 16,
  },
});

export default MeterDetailScreen;