import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tenantApprovalService, roomService } from '../../services/api';

interface PendingTenant {
  id: number;
  username: string;
  name: string;
  phone?: string;
  status: string;
  createdAt: string;
  tenantId: number;
  hoTen: string;
  soDienThoai?: string;
  cccd?: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const TenantApprovalScreen = () => {
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<PendingTenant | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tenantsData, statsData] = await Promise.all([
        tenantApprovalService.getPendingTenants(),
        tenantApprovalService.getApprovalStats()
      ]);
      setPendingTenants(tenantsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading approval data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu duyệt tenant');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (tenant: PendingTenant) => {
    try {
      setSelectedTenant(tenant);
      setSelectedRoomId(null);
      // Lấy danh sách phòng trống
      const rooms = await roomService.getRooms('TRONG');
      setAvailableRooms(rooms);
      setShowApproveModal(true);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phòng trống');
    }
  };

  const handleReject = (tenant: PendingTenant) => {
    setSelectedTenant(tenant);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedTenant) return;
    if (!selectedRoomId) {
      Alert.alert('Lỗi', 'Vui lòng chọn phòng để gán cho tenant');
      return;
    }

    try {
      await tenantApprovalService.approveTenant(selectedTenant.id, selectedRoomId);
      Alert.alert('Thành công', 'Đã duyệt và gán phòng cho tenant');
      setShowApproveModal(false);
      setSelectedTenant(null);
      setSelectedRoomId(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể duyệt tenant');
    }
  };

  const confirmReject = async () => {
    if (!selectedTenant) return;
    
    if (!rejectReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await tenantApprovalService.rejectTenant(selectedTenant.id, rejectReason.trim());
      Alert.alert('Thành công', 'Tenant đã bị từ chối');
      setShowRejectModal(false);
      setSelectedTenant(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể từ chối tenant');
    }
  };

  const renderTenantCard = (tenant: PendingTenant) => (
    <View key={tenant.id} style={styles.tenantCard}>
      <View style={styles.tenantHeader}>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>{tenant.name}</Text>
          <Text style={styles.tenantUsername}>@{tenant.username}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Chờ duyệt</Text>
        </View>
      </View>

      <View style={styles.tenantDetails}>
        {tenant.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{tenant.phone}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Đăng ký: {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      <View style={styles.tenantActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(tenant)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.actionButtonText}>Duyệt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(tenant)}
        >
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.actionButtonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Chờ duyệt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Đã duyệt</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Từ chối</Text>
          </View>
        </View>

        {/* Pending Tenants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh sách chờ duyệt</Text>
          {pendingTenants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không có tenant nào chờ duyệt</Text>
            </View>
          ) : (
            pendingTenants.map(renderTenantCard)
          )}
        </View>
      </ScrollView>

      {/* Approve Modal (choose room) */}
      <Modal
        visible={showApproveModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowApproveModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn phòng để gán</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Tenant: {selectedTenant?.name} (@{selectedTenant?.username})
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
              <Text style={styles.confirmButtonText}>Duyệt & Gán phòng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowRejectModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Từ chối tenant</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Tenant: {selectedTenant?.name} (@{selectedTenant?.username})
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lý do từ chối *</Text>
              <TextInput
                style={styles.textArea}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối tenant..."
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tenantCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
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
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tenantUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
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
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
});

export default TenantApprovalScreen;
