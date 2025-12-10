import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tenant } from '../../types';
import { tenantService } from '../../services/api';

const TenantsScreen = ({ navigation }: any) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTenants = async () => {
    try {
      const data = await tenantService.getTenants(searchQuery || undefined);
      setTenants(data);
    } catch (error) {
      console.log('Error loading tenants:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khách thuê');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [searchQuery, navigation]);

  const handleDeleteTenant = (tenant: Tenant) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa khách thuê ${tenant.hoTen}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await tenantService.deleteTenant(tenant.id);
              loadTenants();
              Alert.alert('Thành công', 'Đã xóa khách thuê');
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa khách thuê');
            }
          },
        },
      ]
    );
  };

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <TouchableOpacity
      style={styles.tenantCard}
      onPress={() => navigation.navigate('TenantDetail', { tenant: item })}
    >
      <View style={styles.tenantHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.hoTen.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>{item.hoTen}</Text>
          {item.soDienThoai && (
            <Text style={styles.tenantPhone}>{item.soDienThoai}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.tenantDetails}>
        {item.cccd && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.detailText}>CCCD: {item.cccd}</Text>
          </View>
        )}
        
        {item.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        
        {item.diaChi && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.diaChi}</Text>
          </View>
        )}
        
        {item.ngaySinh && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>SN: {item.ngaySinh}</Text>
          </View>
        )}
        
        {item.gioiTinh && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.gioiTinh === 'NAM' ? 'Nam' : item.gioiTinh === 'NU' ? 'Nữ' : 'Khác'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tenantActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TenantDetail', { tenant: item })}
        >
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Xem</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteTenant(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.actionText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            placeholderTextColor="#999"
          />
        </View> 
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('TenantDetail', { tenant: null })}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tenants}
        renderItem={renderTenantItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadTenants} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy khách thuê' : 'Chưa có khách thuê nào'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('TenantDetail', { tenant: null })}
              >
                <Text style={styles.emptyButtonText}>Thêm khách thuê đầu tiên</Text>
              </TouchableOpacity>
            )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  tenantCard: {
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
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tenantPhone: {
    fontSize: 14,
    color: '#666',
  },
  tenantDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  tenantActions: {
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

export default TenantsScreen;
