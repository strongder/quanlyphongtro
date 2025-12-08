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
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/api';

const SettingsScreen = () => {
  const { user, logout, updateProfile } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    expoPushToken: user?.expoPushToken || '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'MANAGER') {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [user?.role]);

  const handleSaveSettings = async () => {
    try {
      await settingsService.updateSettings(settings);
      Alert.alert('Thành công', 'Đã cập nhật cài đặt');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật cài đặt');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profile);
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]
    );
  };

  const settingItems = [
    {
      key: 'donGiaDien',
      label: 'Đơn giá điện (VNĐ/kWh)',
      value: settings.donGiaDien || '3500',
      type: 'number',
    },
    {
      key: 'donGiaNuoc',
      label: 'Đơn giá nước (VNĐ/m³)',
      value: settings.donGiaNuoc || '15000',
      type: 'number',
    },
    {
      key: 'ngayNhapSo',
      label: 'Ngày nhắc nhập chỉ số',
      value: settings.ngayNhapSo || '30',
      type: 'number',
    },
    {
      key: 'ngayNhapTien',
      label: 'Ngày nhắc thanh toán',
      value: settings.ngayNhapTien || '5',
      type: 'number',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadSettings} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Cài đặt</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons 
              name={isEditing ? "close-outline" : "pencil-outline"} 
              size={20} 
              color="#007AFF" 
            />
            <Text style={styles.editButtonText}>
              {isEditing ? 'Hủy' : 'Chỉnh sửa'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Tên đăng nhập:</Text>
            <Text style={styles.profileValue}>{user?.username || 'N/A'}</Text>
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Họ tên:</Text>
            {isEditing ? (
              <TextInput
                style={styles.profileInput}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder="Nhập họ tên"
              />
            ) : (
              <Text style={styles.profileValue}>{user?.name || 'N/A'}</Text>
            )}
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Số điện thoại:</Text>
            {isEditing ? (
              <TextInput
                style={styles.profileInput}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.profileValue}>{user?.phone || 'Chưa cập nhật'}</Text>
            )}
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Vai trò:</Text>
            <Text style={styles.profileValue}>
              {user?.role === 'MANAGER' ? 'Quản lý' : 'Khách thuê'}
            </Text>
          </View>

          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Ngày tạo:</Text>
            <Text style={styles.profileValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </Text>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* System Settings - chỉ dành cho quản lý */}
      {user?.role === 'MANAGER' && (
        <View className="section" style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt hệ thống</Text>
          
          <View style={styles.settingsCard}>
            {settingItems.map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <TextInput
                  style={styles.settingInput}
                  value={settings[item.key] ?? ''}
                  onChangeText={(text) => setSettings({ ...settings, [item.key]: text })}
                  keyboardType={item.type === 'number' ? 'numeric' : 'default'}
                  placeholder={item.value}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.saveSettingsButton}
              onPress={handleSaveSettings}
            >
              <Text style={styles.saveSettingsButtonText}>Lưu cài đặt</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phiên bản:</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="build-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Trạng thái:</Text>
              <Text style={styles.infoValue}>Đang phát triển</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="server-outline" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>API:</Text>
              <Text style={styles.infoValue}>localhost:3000</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hành động</Text>
        
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={loadSettings}
          >
            <Ionicons name="refresh-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Làm mới dữ liệu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Đăng xuất
            </Text>
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  profileCard: {
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
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  profileInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    flex: 1,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCard: {
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
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveSettingsButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveSettingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  infoItem: {
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
  actionsCard: {
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
});

export default SettingsScreen;
