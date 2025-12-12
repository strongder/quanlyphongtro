import React, { useState } from 'react';
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
import { Tenant } from '../../types';
import { tenantService } from '../../services/api';

const TenantDetailScreen = ({ navigation, route }: any) => {
  const { tenant } = route.params;
  const isEdit = tenant !== null;
  
  const [formData, setFormData] = useState({
    hoTen: tenant?.hoTen || '',
    soDienThoai: tenant?.soDienThoai || '',
    cccd: tenant?.cccd || '',
    email: tenant?.email || '',
    diaChi: tenant?.diaChi || '',
    ngaySinh: tenant?.ngaySinh || '',
    gioiTinh: tenant?.gioiTinh || 'KHAC',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.hoTen.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    setIsLoading(true);
    try {
      const tenantData = {
        hoTen: formData.hoTen.trim(),
        soDienThoai: formData.soDienThoai.trim() || undefined,
        cccd: formData.cccd.trim() || undefined,
        email: formData.email.trim() || undefined,
        diaChi: formData.diaChi.trim() || undefined,
        ngaySinh: formData.ngaySinh.trim() || undefined,
        gioiTinh: formData.gioiTinh as 'NAM' | 'NU' | 'KHAC',
      };

      if (isEdit) {
        await tenantService.updateTenant(tenant.id, tenantData);
        Alert.alert('Thành công', 'Đã cập nhật thông tin khách thuê');
      } else {
        await tenantService.createTenant(tenantData);
        Alert.alert('Thành công', 'Đã tạo khách thuê mới');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu thông tin khách thuê');
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
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={formData.hoTen}
              onChangeText={(text) => setFormData({ ...formData, hoTen: text })}
              placeholder="Nhập họ và tên"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.soDienThoai}
              onChangeText={(text) => setFormData({ ...formData, soDienThoai: text })}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CCCD/CMND</Text>
            <TextInput
              style={styles.input}
              value={formData.cccd}
              onChangeText={(text) => setFormData({ ...formData, cccd: text })}
              placeholder="Nhập số CCCD/CMND"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              value={formData.diaChi}
              onChangeText={(text) => setFormData({ ...formData, diaChi: text })}
              placeholder="Nhập địa chỉ"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TextInput
              style={styles.input}
              value={formData.ngaySinh}
              onChangeText={(text) => setFormData({ ...formData, ngaySinh: text })}
              placeholder="DD/MM/YYYY"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderContainer}>
              {['NAM', 'NU', 'KHAC'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gioiTinh === gender && styles.genderButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, gioiTinh: gender as 'NAM' | 'NU' | 'KHAC' })}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gioiTinh === gender && styles.genderButtonTextActive,
                    ]}
                  >
                    {gender === 'NAM' ? 'Nam' : gender === 'NU' ? 'Nữ' : 'Khác'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
  },
  genderButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default TenantDetailScreen;
