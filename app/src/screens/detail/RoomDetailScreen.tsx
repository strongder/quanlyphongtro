import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../../types';
import { roomService } from '../../services/api';

const RoomDetailScreen = ({ navigation, route }: any) => {
  const { room } = route.params;
  const isEdit = room !== null;
  
  // Parse taiSan nếu là string JSON
  const parseTaiSan = (taiSanData: any): Record<string, number> => {
    if (!taiSanData) return {};
    if (typeof taiSanData === 'string') {
      try {
        return JSON.parse(taiSanData);
      } catch (e) {
        console.log('Error parsing taiSan:', e);
        return {};
      }
    }
    return taiSanData;
  };
  
  const [formData, setFormData] = useState({
    maPhong: room?.maPhong || '',
    giaThue: room?.giaThue?.toString() || '',
    dienTich: room?.dienTich?.toString() || '',
    trangThai: room?.trangThai || 'TRONG',
    note: room?.note || '',
  });
  const [taiSan, setTaiSan] = useState<Record<string, number>>(parseTaiSan(room?.taiSan));
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetQuantity, setNewAssetQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.maPhong.trim() || !formData.giaThue.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    const giaThue = parseFloat(formData.giaThue);
    if (isNaN(giaThue) || giaThue <= 0) {
      Alert.alert('Lỗi', 'Giá thuê phải là số dương');
      return;
    }

    const dienTich = formData.dienTich ? parseFloat(formData.dienTich) : undefined;
    if (dienTich !== undefined && (isNaN(dienTich) || dienTich <= 0)) {
      Alert.alert('Lỗi', 'Diện tích phải là số dương');
      return;
    }

    setIsLoading(true);
    try {
      const roomData = {
        maPhong: formData.maPhong.trim(),
        giaThue,
        dienTich,
        taiSan: Object.keys(taiSan).length > 0 ? taiSan : undefined,
        trangThai: formData.trangThai,
        note: formData.note.trim() || undefined,
      };

      if (isEdit) {
        await roomService.updateRoom(room.id, roomData);
        Alert.alert('Thành công', 'Đã cập nhật phòng');
      } else {
        await roomService.createRoom(roomData);
        Alert.alert('Thành công', 'Đã tạo phòng mới');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu phòng');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mã phòng *</Text>
            <TextInput
              style={styles.input}
              value={formData.maPhong}
              onChangeText={(text) => setFormData({ ...formData, maPhong: text })}
              placeholder="Nhập mã phòng (VD: P001)"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Giá thuê (VNĐ) *</Text>
            <TextInput
              style={styles.input}
              value={formData.giaThue}
              onChangeText={(text) => setFormData({ ...formData, giaThue: text })}
              placeholder="Nhập giá thuê"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Diện tích (m²)</Text>
            <TextInput
              style={styles.input}
              value={formData.dienTich}
              onChangeText={(text) => setFormData({ ...formData, dienTich: text })}
              placeholder="Nhập diện tích (tùy chọn)"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tài sản</Text>
            <View style={styles.assetContainer}>
              {Object.entries(taiSan).map(([name, quantity]) => (
                <View key={name} style={styles.assetItem}>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetName}>{name}</Text>
                    <Text style={styles.assetQuantity}>x{quantity}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const newAssets = { ...taiSan };
                      delete newAssets[name];
                      setTaiSan(newAssets);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addAssetRow}>
              <TextInput
                style={[styles.input, styles.assetNameInput]}
                value={newAssetName}
                onChangeText={setNewAssetName}
                placeholder="Tên tài sản"
              />
              <TextInput
                style={[styles.input, styles.assetQuantityInput]}
                value={newAssetQuantity}
                onChangeText={setNewAssetQuantity}
                placeholder="SL"
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.addAssetButton}
                onPress={() => {
                  if (newAssetName.trim() && newAssetQuantity) {
                    const qty = parseInt(newAssetQuantity);
                    if (!isNaN(qty) && qty > 0) {
                      setTaiSan({ ...taiSan, [newAssetName.trim()]: qty });
                      setNewAssetName('');
                      setNewAssetQuantity('');
                    }
                  }
                }}
              >
                <Ionicons name="add-circle" size={32} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.trangThai === 'TRONG' && styles.statusButtonActive
                ]}
                onPress={() => setFormData({ ...formData, trangThai: 'TRONG' })}
              >
                <Text style={[
                  styles.statusButtonText,
                  formData.trangThai === 'TRONG' && styles.statusButtonTextActive
                ]}>
                  Trống
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.trangThai === 'CO_KHACH' && styles.statusButtonActive
                ]}
                onPress={() => setFormData({ ...formData, trangThai: 'CO_KHACH' })}
              >
                <Text style={[
                  styles.statusButtonText,
                  formData.trangThai === 'CO_KHACH' && styles.statusButtonTextActive
                ]}>
                  Có khách
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.note}
              onChangeText={(text) => setFormData({ ...formData, note: text })}
              placeholder="Nhập ghi chú (tùy chọn)"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
              </Text>
            </TouchableOpacity>

            {isEdit && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#666',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  assetContainer: {
    marginBottom: 12,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assetInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  assetName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  assetQuantity: {
    fontSize: 16,
    color: '#666',
  },
  addAssetRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  assetNameInput: {
    flex: 2,
  },
  assetQuantityInput: {
    flex: 1,
  },
  addAssetButton: {
    padding: 4,
  },
});

export default RoomDetailScreen;
