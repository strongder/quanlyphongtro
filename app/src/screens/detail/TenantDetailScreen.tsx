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

export default TenantDetailScreen;
