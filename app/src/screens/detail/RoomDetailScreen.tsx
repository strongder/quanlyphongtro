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
  
  const [formData, setFormData] = useState({
    maPhong: room?.maPhong || '',
    giaThue: room?.giaThue?.toString() || '',
    trangThai: room?.trangThai || 'TRONG',
    note: room?.note || '',
  });
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

    setIsLoading(true);
    try {
      const roomData = {
        maPhong: formData.maPhong.trim(),
        giaThue,
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
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
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default RoomDetailScreen;
