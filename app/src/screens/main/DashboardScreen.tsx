import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { reportService, settingsService } from '../../services/api';

const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ empty: 0, occupied: 0, total: 0 });
  const [revenue, setRevenue] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [todayReminders, setTodayReminders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [roomsSummary, revenueData, settingsData] = await Promise.all([
        reportService.getRoomsSummary(),
        reportService.getRevenue(),
        settingsService.getSettings()
      ]);
      
      setStats({
        empty: roomsSummary.empty,
        occupied: roomsSummary.occupied,
        total: roomsSummary.empty + roomsSummary.occupied
      });
      setRevenue(revenueData.total);
      setSettings(settingsData);
      
      // Kiểm tra nhắc nhở hôm nay
      const reminders = checkTodayReminders(settingsData);
      setTodayReminders(reminders);
    } catch (error) {
      console.log('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTodayReminders = (settings: Record<string, string>): string[] => {
    const reminders: string[] = [];
    const today = new Date();
    const currentDay = today.getDate();

    const ngayNhapSo = parseInt(settings.ngayNhapSo || '30');
    const ngayNhapTien = parseInt(settings.ngayNhapTien || '5');

    if (currentDay === ngayNhapSo) {
      reminders.push('📊 Hôm nay là ngày nhập chỉ số điện nước!');
    }

    if (currentDay === ngayNhapTien) {
      reminders.push('💰 Hôm nay là ngày thu tiền phòng!');
    }

    return reminders;
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const quickActions = [
    {
      title: 'Quản lý phòng',
      icon: 'business-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('Rooms'),
    },
    {
      title: 'Khách thuê',
      icon: 'people-outline',
      color: '#34C759',
      onPress: () => navigation.navigate('Tenants'),
    },
    {
      title: 'Chỉ số điện nước',
      icon: 'speedometer-outline',
      color: '#FF9500',
      onPress: () => navigation.navigate('Meter'),
    },
    {
      title: 'Hóa đơn',
      icon: 'receipt-outline',
      color: '#FF3B30',
      onPress: () => navigation.navigate('Invoices'),
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadDashboardData} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.name || 'Quản lý'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color="#007AFF" />
            {todayReminders.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{todayReminders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hiển thị nhắc nhở hôm nay */}
      {todayReminders.length > 0 && (
        <View style={styles.remindersContainer}>
          <Text style={styles.reminderTitle}>🔔 Nhắc nhở hôm nay</Text>
          {todayReminders.map((reminder, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reminderCard}
              onPress={() => {
                if (reminder.includes('chỉ số')) {
                  navigation.navigate('Meter');
                } else if (reminder.includes('tiền')) {
                  navigation.navigate('Invoices');
                }
              }}
            >
              <Text style={styles.reminderText}>{reminder}</Text>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Thống kê tổng quan</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng phòng</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.occupied}</Text>
            <Text style={styles.statLabel}>Đang thuê</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.empty}</Text>
            <Text style={styles.statLabel}>Trống</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{revenue.toLocaleString()}đ</Text>
            <Text style={styles.statLabel}>Doanh thu</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.onPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Thông tin hệ thống</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Vai trò:</Text>
          <Text style={styles.infoValue}>{user?.role === 'MANAGER' ? 'Quản lý' : 'Khách thuê'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tên đăng nhập:</Text>
          <Text style={styles.infoValue}>{user?.username}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Chưa cập nhật'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày nhắc nhập chỉ số:</Text>
          <Text style={styles.infoValue}>Ngày {settings.ngayNhapSo || '30'} hàng tháng</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày nhắc thanh toán:</Text>
          <Text style={styles.infoValue}>Ngày {settings.ngayNhapTien || '5'} hàng tháng</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  remindersContainer: {
    backgroundColor: '#FFF3CD',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 12,
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 20,
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
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});

export default DashboardScreen;
