import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportService } from '../../services/api';

const ReportsScreen = () => {
  const [revenue, setRevenue] = useState(0);
  const [roomsSummary, setRoomsSummary] = useState({ empty: 0, occupied: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const loadReports = async () => {
    try {
      const [revenueData, roomsData] = await Promise.all([
        reportService.getRevenue(),
        reportService.getRoomsSummary()
      ]);
      setRevenue(revenueData.total);
      setRoomsSummary(roomsData);
    } catch (error) {
      console.log('Error loading reports:', error);
      Alert.alert('Lỗi', 'Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrentYear = () => {
    return new Date().getFullYear().toString();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('vi-VN');
  };

  const reportCards = [
    {
      title: 'Tổng doanh thu',
      value: `${revenue.toLocaleString()}đ`,
      icon: 'cash-outline',
      color: '#34C759',
      description: 'Tổng thu nhập từ tất cả hóa đơn đã thanh toán',
    },
    {
      title: 'Phòng đang thuê',
      value: roomsSummary.occupied.toString(),
      icon: 'business-outline',
      color: '#007AFF',
      description: 'Số phòng hiện đang có khách thuê',
    },
    {
      title: 'Phòng trống',
      value: roomsSummary.empty.toString(),
      icon: 'home-outline',
      color: '#FF9500',
      description: 'Số phòng hiện đang trống',
    },
    {
      title: 'Tổng phòng',
      value: (roomsSummary.occupied + roomsSummary.empty).toString(),
      icon: 'grid-outline',
      color: '#8E8E93',
      description: 'Tổng số phòng trong hệ thống',
    },
  ];

  const occupancyRate = roomsSummary.occupied + roomsSummary.empty > 0 
    ? Math.round((roomsSummary.occupied / (roomsSummary.occupied + roomsSummary.empty)) * 100)
    : 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadReports} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo tổng quan</Text>
        <Text style={styles.subtitle}>Cập nhật lần cuối: {getCurrentDate()}</Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Tóm tắt nhanh</Text>
        <View style={styles.summaryGrid}>
          {reportCards.map((card, index) => (
            <View key={index} style={styles.summaryCard}>
              <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                <Ionicons name={card.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Tỷ lệ lấp đầy</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Tỷ lệ phòng đang thuê</Text>
            <Text style={styles.chartPercentage}>{occupancyRate}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${occupancyRate}%` }
              ]} 
            />
          </View>
          
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
              <Text style={styles.legendText}>Đang thuê ({roomsSummary.occupied})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Trống ({roomsSummary.empty})</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Phân tích</Text>
        <View style={styles.insightsCard}>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up-outline" size={20} color="#34C759" />
            <Text style={styles.insightText}>
              {occupancyRate >= 80 
                ? 'Tỷ lệ lấp đầy cao, hiệu quả quản lý tốt'
                : occupancyRate >= 50
                ? 'Tỷ lệ lấp đầy trung bình, có thể cải thiện'
                : 'Tỷ lệ lấp đầy thấp, cần xem xét chiến lược'
              }
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Ionicons name="calculator-outline" size={20} color="#007AFF" />
            <Text style={styles.insightText}>
              Doanh thu trung bình mỗi phòng: {roomsSummary.occupied > 0 
                ? Math.round(revenue / roomsSummary.occupied).toLocaleString() 
                : 0}đ
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Ionicons name="calendar-outline" size={20} color="#FF9500" />
            <Text style={styles.insightText}>
              Báo cáo được cập nhật theo thời gian thực
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.periodContainer}>
        <Text style={styles.sectionTitle}>Thời gian báo cáo</Text>
        <View style={styles.periodCard}>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Tháng hiện tại:</Text>
            <Text style={styles.periodValue}>{getCurrentMonth()}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Năm hiện tại:</Text>
            <Text style={styles.periodValue}>{getCurrentYear()}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Ngày cập nhật:</Text>
            <Text style={styles.periodValue}>{getCurrentDate()}</Text>
          </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  chartContainer: {
    padding: 20,
    paddingTop: 0,
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  insightsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  insightsCard: {
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
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  periodContainer: {
    padding: 20,
    paddingTop: 0,
  },
  periodCard: {
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
  periodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
  },
  periodValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default ReportsScreen;
