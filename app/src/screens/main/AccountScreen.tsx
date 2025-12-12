import React, { useEffect, useMemo, useState } from 'react';
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
import { tenantApprovalService, tenantService, roomService, authService } from '../../services/api';
import { Account, User } from '../../types';

const AccountScreen = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await authService.getAllUsers();
      console.log('All users:', response);
      const allUsers = (response as any).data || response;
      // Loại bỏ các users đã bị xóa
      const activeUsers = allUsers.filter((u: Account) => u.status !== 'DELETED');
      console.log('Number of users:', activeUsers?.length);
      setAccounts(activeUsers as Account[]);
    } catch (error) {
      console.error('Error loading account data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    console.log('Filtering accounts, total:', accounts?.length);
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.trim().toLowerCase();
    const filtered = accounts.filter(
      (a) =>
        a.username?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
    );
    console.log('Filtered result:', filtered?.length);
    return filtered;
  }, [accounts, searchQuery]);

  const handleApprove = async (acct: Account) => {
    try {
      setSelectedAccount(acct as any);
      setSelectedRoomId(null);
      const rooms = await roomService.getRooms('TRONG');
      setAvailableRooms(rooms);
      setShowApproveModal(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phòng');
    }
  };

  const confirmApprove = async () => {
    if (!selectedAccount || !selectedRoomId) {
      Alert.alert('Lỗi', 'Vui lòng chọn phòng để duyệt');
      return;
    }
    try {
      await tenantApprovalService.approveTenant(selectedAccount.id, selectedRoomId);
      Alert.alert('Thành công', 'Đã duyệt tài khoản');
      setShowApproveModal(false);
      setSelectedAccount(null);
      setSelectedRoomId(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể duyệt');
    }
  };

  const handleReject = (acct: Account) => {
    setSelectedAccount(acct as any);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedAccount) return;
    if (!rejectReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do');
      return;
    }
    try {
      await tenantApprovalService.rejectTenant(selectedAccount.id, rejectReason.trim());
      Alert.alert('Đã từ chối', 'Tài khoản bị từ chối');
      setShowRejectModal(false);
      setSelectedAccount(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể từ chối');
    }
  };

  const handleEdit = (acct: Account) => {
    setSelectedAccount(acct as any);
    setEditName(acct.name || '');
    setEditPhone(acct.phone || '');
    setEditPassword('');
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!selectedAccount) return;
    try {
      const updateData: any = {
        name: editName,
        phone: editPhone,
      };
      if (editPassword.trim()) {
        updateData.password = editPassword;
      }
      await authService.updateProfileForAdmin(selectedAccount.id, updateData);
      Alert.alert('Đã lưu', 'Thông tin tài khoản đã được cập nhật');
      setShowEditModal(false);
      setSelectedAccount(null);
      setEditPassword('');
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu thay đổi');
    }
  };

  const handleDelete = (acct: Account) => {
    Alert.alert(
      'Xóa tài khoản',
      `Bạn có chắc chắn muốn xóa tài khoản "${acct.name || acct.username}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteUser(acct.id);
              Alert.alert('Thành công', 'Tài khoản đã được xóa');
              loadData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.error || 'Không thể xóa tài khoản');
            }
          },
        },
      ]
    );
  };

  const renderAccountCard = ({ item }: { item: Account }) => (
    <View style={styles.tenantCard}>
      <View style={styles.tenantHeader}>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>Họ tên: {item.name || 'Chưa có tên'}</Text>
          <Text style={styles.tenantUsername}>Tên đăng nhập: {item.username}</Text>
          <Text style={styles.tenantPhone}>Số điện thoại: {item.phone || 'Chưa có SĐT'}</Text>
        </View>
        <View style={item.status === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgePending}>
          <Text style={item.status === 'ACTIVE' ? styles.statusTextActive : styles.statusText}>
            {item.status === 'ACTIVE' ? 'Đã duyệt' : 'Chờ duyệt'}
          </Text>
        </View>
      </View>

      <View style={styles.tenantDetails}>
        {item.createdAt && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
        )}
      </View>

      <View style={styles.tenantActions}>
        {item.status === 'PENDING' && (
          <>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleApprove(item)}>
              <Ionicons name="checkmark" size={18} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleReject(item)}>
              <Ionicons name="close" size={18} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Từ chối</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={18} color="#3b82f6" />
          <Text style={[styles.actionText, { color: '#3b82f6' }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
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
            placeholder="Tìm tên, username, số điện thoại"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <FlatList
        data={filteredAccounts}
        renderItem={renderAccountCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không có tài khoản</Text>
          </View>
        }
      />

      {/* Approve Modal */}
      <Modal visible={showApproveModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowApproveModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Duyệt & gán phòng</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {selectedAccount?.name} (@{selectedAccount?.username})
            </Text>

            {availableRooms.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Không có phòng trống</Text>
              </View>
            ) : (
              <ScrollView>
                {availableRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[styles.roomItem, selectedRoomId === room.id && styles.roomItemSelected]}
                    onPress={() => setSelectedRoomId(room.id)}
                  >
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomCode}>{room.maPhong}</Text>
                      <Text style={styles.roomPrice}>{room.giaThue?.toLocaleString('vi-VN')} đ</Text>
                    </View>
                    {selectedRoomId === room.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowApproveModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmApproveButton]}
              onPress={confirmApprove}
            >
              <Text style={styles.confirmButtonText}>Duyệt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRejectModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Từ chối tài khoản</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {selectedAccount?.name} (@{selectedAccount?.username})
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lý do từ chối *</Text>
              <TextInput
                style={styles.textArea}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowRejectModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={confirmReject}
            >
              <Text style={styles.confirmButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa thông tin</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ tên</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ tên"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu (tùy chọn)</Text>
              <TextInput
                style={styles.textInput}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmApproveButton]}
              onPress={confirmEdit}
            >
              <Text style={styles.confirmButtonText}>Lưu</Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tenantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tenantInfo: {
    flex: 1,
    gap: 2,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tenantUsername: {
    fontSize: 14,
    color: '#666',
  },
  tenantPhone: {
    fontSize: 14,
    color: '#444',
  },
  statusBadgePending: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  tenantDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  tenantActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  modalSubtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
  },
  roomItemSelected: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  roomInfo: {
    flexDirection: 'column',  
  },
  roomCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roomPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  confirmApproveButton: {
    backgroundColor: '#34C759',
  },
});

export default AccountScreen;
