import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { vnpayService } from '../services/api';
import { PaymentResponse } from '../types';

interface VNPayModalProps {
  visible: boolean;
  invoiceId: number;
  invoiceAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailed: () => void;
}

export const VNPayModal: React.FC<VNPayModalProps> = ({
  visible,
  invoiceId,
  invoiceAmount,
  onClose,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Gọi API BE tạo payment URL
      const paymentResponse: PaymentResponse = await vnpayService.createPaymentUrl(invoiceId);

      if (paymentResponse.code === '00' && paymentResponse.paymentUrl) {
        console.log('Opening payment URL');
        
        // Mở browser VNPay
        const result = await WebBrowser.openBrowserAsync(paymentResponse.paymentUrl);
        
        // Khi browser đóng, App.tsx sẽ xử lý Deep Link từ VNPay
        // Không cần polling ở đây nữa
        setIsLoading(false);
      } else {
        setIsLoading(false);
        Alert.alert('Lỗi', paymentResponse.message || 'Không thể tạo link thanh toán');
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Payment error:', err);
      Alert.alert('Lỗi', err.message || 'Không thể thực hiện thanh toán');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>Thanh toán VNPay</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Info */}
          <View style={styles.invoiceInfo}>
            <Text style={styles.label}>Số tiền cần thanh toán:</Text>
            <Text style={styles.amount}>{invoiceAmount.toLocaleString()}đ</Text>
            <Text style={styles.note}>Bạn sẽ được chuyển đến trang thanh toán của VNPay.</Text>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.payButton, isLoading && styles.disabled]}
              onPress={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={styles.payText}>Thanh toán ngay</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  invoiceInfo: { padding: 16, backgroundColor: '#f7f7f7' },
  label: { fontSize: 14, color: '#666' },
  amount: { fontSize: 26, fontWeight: 'bold', color: '#007AFF', marginTop: 4 },
  note: { fontSize: 12, color: '#888', marginTop: 6 },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  cancelButton: { backgroundColor: '#eee' },
  cancelText: { color: '#333', fontSize: 16, fontWeight: '600' },
  payButton: { backgroundColor: '#007AFF' },
  payText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 }
});
