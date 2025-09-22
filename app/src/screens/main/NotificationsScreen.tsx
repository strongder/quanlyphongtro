import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService, invoiceService } from '../../services/api';
import { Invoice } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  type: 'meter_reading' | 'payment' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: string;
  actionText?: string;
  onAction?: () => void;
}

const NotificationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadData = async () => {
    try {
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);
      
      // Lấy hóa đơn để tạo thông báo đúng vai trò
      let invoicesData: Invoice[] = [];
      if (user?.role === 'MANAGER') {
        invoicesData = await invoiceService.getInvoices('PENDING');
      } else if (user?.role === 'TENANT') {
        invoicesData = await invoiceService.getInvoices();
      }
      setInvoices(invoicesData);

      const currentNotifications = generateNotifications(settingsData, invoicesData);
      setNotifications(currentNotifications);
    } catch (error) {
      console.log('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotifications = (settings: Record<string, string>, invoicesList: Invoice[]): Notification[] => {
    const notifications: Notification[] = [];
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Nếu là khách thuê, KHÔNG hiển thị các nhắc nhở nhập chỉ số
    const ngayNhapSo = parseInt(settings.ngayNhapSo || '30');
    if (user?.role === 'MANAGER') {
      if (currentDay === ngayNhapSo) {
        notifications.push({
          id: 'meter-reading-reminder',
          type: 'meter_reading',
          title: '📊 Nhắc nhập chỉ số điện nước',
          message: `Hôm nay (${currentDay}/${currentMonth}/${currentYear}) là ngày nhập chỉ số điện nước. Hãy nhập chỉ số cho tất cả các phòng.`,
          priority: 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Nhập chỉ số',
          onAction: () => navigation.navigate('Meter'),
        });
      }
    }

    // Kiểm tra ngày nhắc thanh toán (role-specific)
    const ngayNhapTien = parseInt(settings.ngayNhapTien || '5');
    if (currentDay === ngayNhapTien) {
      if (user?.role === 'MANAGER') {
        notifications.push({
          id: 'payment-reminder-manager',
          type: 'payment',
          title: '💰 Nhắc thu tiền phòng',
          message: `Hôm nay (${currentDay}/${currentMonth}/${currentYear}) là ngày thu tiền phòng. Hãy kiểm tra hóa đơn và thu tiền từ khách thuê.`,
          priority: 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      } else if (user?.role === 'TENANT') {
        notifications.push({
          id: 'payment-reminder-tenant',
          type: 'payment',
          title: '💰 Đến hạn thanh toán tiền phòng',
          message: `Hôm nay (${currentDay}/${currentMonth}/${currentYear}) là hạn thanh toán. Vui lòng kiểm tra hóa đơn và gửi yêu cầu xác nhận thanh toán cho quản lý.`,
          priority: 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      }
    }

    // Thông báo gần đến hạn nhập chỉ số (3 ngày trước) — chỉ cho quản lý
    const daysBefore = 3;
    if (user?.role === 'MANAGER') {
      if (currentDay === ngayNhapSo - daysBefore || (currentDay + daysBefore) % 30 === ngayNhapSo) {
        notifications.push({
          id: 'meter-reading-upcoming',
          type: 'meter_reading',
          title: '⏰ Sắp đến hạn nhập chỉ số',
          message: `Còn ${daysBefore} ngày nữa (ngày ${ngayNhapSo}) sẽ đến hạn nhập chỉ số điện nước.`,
          priority: 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem chi tiết',
          onAction: () => navigation.navigate('Meter'),
        });
      }
    }

    // Thông báo gần đến hạn thanh toán (2 ngày trước) — role-specific
    if (currentDay === ngayNhapTien - 2 || (currentDay + 2) % 30 === ngayNhapTien) {
      if (user?.role === 'MANAGER') {
        notifications.push({
          id: 'payment-upcoming-manager',
          type: 'payment',
          title: '⏰ Sắp đến hạn thu tiền',
          message: `Còn 2 ngày nữa (ngày ${ngayNhapTien}) sẽ đến hạn thu tiền phòng. Chuẩn bị kế hoạch thu tiền.`,
          priority: 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      } else if (user?.role === 'TENANT') {
        notifications.push({
          id: 'payment-upcoming-tenant',
          type: 'payment',
          title: '⏰ Sắp đến hạn thanh toán',
          message: `Còn 2 ngày nữa (ngày ${ngayNhapTien}) sẽ đến hạn thanh toán tiền phòng. Vui lòng chuẩn bị và kiểm tra hóa đơn.`,
          priority: 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      }
    }

    // Thông báo hóa đơn đang chờ xác nhận
    if (user?.role === 'MANAGER') {
      const pendingCount = invoicesList.filter(inv => inv.status === 'PENDING').length;
      if (pendingCount > 0) {
        notifications.push({
          id: 'payment-approval-pending',
          type: 'payment',
          title: '🟠 Hóa đơn chờ xác nhận',
          message: `Hiện có ${pendingCount} hóa đơn đang chờ bạn xác nhận thanh toán.`,
          priority: 'high',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      }
    } else if (user?.role === 'TENANT') {
      const hasPending = invoicesList.some(inv => inv.status === 'PENDING');
      if (hasPending) {
        notifications.push({
          id: 'payment-awaiting-approval',
          type: 'payment',
          title: '🟠 Đang chờ quản lý xác nhận',
          message: 'Yêu cầu xác nhận thanh toán của bạn đang được quản lý xử lý.',
          priority: 'medium',
          isRead: false,
          createdAt: new Date().toISOString(),
          actionText: 'Xem hóa đơn',
          onAction: () => navigation.navigate('Invoices'),
        });
      }
    }

    // Thêm thông báo hệ thống
    notifications.push({
      id: 'system-info',
      type: 'system',
      title: '🏠 Hệ thống hoạt động bình thường',
      message: user?.role === 'TENANT'
        ? 'Bạn có thể xem hóa đơn và gửi yêu cầu xác nhận thanh toán khi cần.'
        : 'Tất cả chức năng đang hoạt động. Bạn có thể nhập chỉ số và duyệt thanh toán.',
      priority: 'low',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Thông báo cài đặt ngày nhắc
    if (!settings.ngayNhapSo || !settings.ngayNhapTien) {
      notifications.push({
        id: 'settings-warning',
        type: 'system',
        title: '⚙️ Cần cài đặt ngày nhắc nhở',
        message: 'Bạn chưa cài đặt đầy đủ ngày nhắc nhập chỉ số và thanh toán. Hãy vào Cài đặt để thiết lập.',
        priority: 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionText: 'Cài đặt',
        onAction: () => navigation.navigate('Settings'),
      });
    }

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#007AFF';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meter_reading': return 'speedometer-outline';
      case 'payment': return 'card-outline';
      case 'system': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (notification.onAction) {
      notification.onAction();
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Đánh dấu tất cả đã đọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={20} color="#FF3B30" />
          <Text style={styles.unreadText}>
            Bạn có {unreadCount} thông báo chưa đọc
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard
              ]}
              onPress={() => {
                markAsRead(notification.id);
                handleNotificationPress(notification);
              }}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.typeContainer}>
                  <Ionicons 
                    name={getTypeIcon(notification.type) as any} 
                    size={24} 
                    color={getPriorityColor(notification.priority)} 
                  />
                  <View style={[
                    styles.priorityIndicator, 
                    { backgroundColor: getPriorityColor(notification.priority) }
                  ]} />
                </View>
                <Text style={styles.timestamp}>
                  {new Date(notification.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>

              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>

              {notification.actionText && (
                <View style={styles.actionContainer}>
                  <Text style={[styles.actionText, { color: getPriorityColor(notification.priority) }]}>
                    {notification.actionText} →
                  </Text>
                </View>
              )}

              {!notification.isRead && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFE5E5',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  unreadText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  notificationCard: {
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
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
});

export default NotificationsScreen;
