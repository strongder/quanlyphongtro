import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vnpayService, momoService } from '../services/api';
import WebView, { WebViewNavigation } from 'react-native-webview';

interface PaymentModalProps {
  visible: boolean;
  invoiceId: number;
  invoiceAmount: number;
  onClose: () => void;
}

type PaymentMethod = 'VNPAY' | 'MOMO';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  invoiceId,
  invoiceAmount,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!visible) {
      setPaymentUrl(null);
      setSelectedMethod(null);
      return;
    }
  }, [visible]);

  const handleSelectMethod = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsLoading(true);
    
    try {
      let paymentResponse;
      
      if (method === 'VNPAY') {
        paymentResponse = await vnpayService.createPaymentUrl(invoiceId);
      } else if (method === 'MOMO') {
        paymentResponse = await momoService.createPaymentUrl(invoiceId);
      }

      if (paymentResponse?.code !== '00' || !paymentResponse?.paymentUrl) {
        Alert.alert('Lỗi', paymentResponse?.message || 'Không thể tạo link thanh toán');
        setSelectedMethod(null);
        return;
      }

      setPaymentUrl(paymentResponse.paymentUrl);
    } catch (err: any) {
      console.error('Payment error:', err);
      Alert.alert('Lỗi', err.message || 'Không thể thực hiện thanh toán');
      setSelectedMethod(null);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatusWithRetry = async (invoiceId: number, method: PaymentMethod, attempts = 3, delayMs = 1000) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const statusResp = method === 'VNPAY' 
          ? await vnpayService.checkPaymentStatus(invoiceId)
          : await momoService.checkPaymentStatus(invoiceId);
          
        const invoiceStatus = statusResp.invoiceStatus?.toUpperCase();
        const paymentStatus = statusResp.payment?.status?.toUpperCase();

        if (invoiceStatus === 'PAID' || paymentStatus === 'SUCCESS') {
          Alert.alert('✅ Thanh toán thành công', `Số tiền: ${invoiceAmount.toLocaleString()}đ`);
          return;
        }

        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          Alert.alert('❌ Thanh toán thất bại', `Mã lỗi: ${statusResp.payment?.responseCode || 'N/A'}`);
          return;
        }

        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        console.error('Check payment status error:', error);
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    Alert.alert('⚠️ Thanh toán chưa hoàn tất', 'Vui lòng kiểm tra lại trạng thái thanh toán sau.');
  };

  const handleResult = async (url: string) => {
    if (!selectedMethod) return;
    
    try {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const status = (params.get('status') || '').toLowerCase();
      const vnpayCode = (params.get('vnp_ResponseCode') || '').toUpperCase();
      const resultCode = params.get('resultCode') || '';

      if (status === 'success' || vnpayCode === '00' || resultCode === '0') {
        await checkPaymentStatusWithRetry(invoiceId, selectedMethod);
      } else if (status || vnpayCode || resultCode) {
        await checkPaymentStatusWithRetry(invoiceId, selectedMethod);
      }
    } catch (err: any) {
      console.error('Handle result error:', err);
    } finally {
      onClose();
    }
  };

  const handleShouldStart = (request: WebViewNavigation) => {
    const url: string = request.url || '';
    if (
      url.includes('payment-callback') ||
      url.includes('vnpay-return') ||
      url.includes('momo-return')
    ) {
      handleResult(url);
      return false;
    }
    return true;
  };

  const handleBack = () => {
    if (paymentUrl) {
      setPaymentUrl(null);
      setSelectedMethod(null);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleBack}>
      <View style={styles.container}>
        <View style={[styles.content, selectedMethod ? styles.contentLarge : styles.contentCompact]}>
          {!selectedMethod ? (
            // Màn hình chọn phương thức thanh toán
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Chọn phương thức thanh toán</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.invoiceInfo}>
                <Text style={styles.label}>Số tiền thanh toán:</Text>
                <Text style={styles.amount}>{invoiceAmount.toLocaleString()}đ</Text>
              </View>

              <View style={styles.methodsContainer}>
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => handleSelectMethod('VNPAY')}
                  disabled={isLoading}
                >
                  <View style={[styles.methodIcon, { backgroundColor: '#1a5490' }]}>
                    <Ionicons name="card" size={32} color="#fff" />
                  </View>
                  <Text style={styles.methodName}>VNPay</Text>
                  <Text style={styles.methodDesc}>Thanh toán qua ngân hàng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => handleSelectMethod('MOMO')}
                  disabled={isLoading}
                >
                  <View style={[styles.methodIcon, { backgroundColor: '#a50064' }]}>
                    <Ionicons name="wallet" size={32} color="#fff" />
                  </View>
                  <Text style={styles.methodName}>MoMo</Text>
                  <Text style={styles.methodDesc}>Ví điện tử MoMo</Text>
                </TouchableOpacity>
              </View>

              {/* {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={styles.loadingText}>Đang tạo link thanh toán...</Text>
                </View>
              )} */}
            </>
          ) : (
            // Màn hình WebView thanh toán
            <>
              <View style={styles.webviewHeader}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                  <Text style={styles.backText}>Quay lại</Text>
                </TouchableOpacity>
                <View style={styles.methodBadge}>
                  <Ionicons 
                    name={selectedMethod === 'MOMO' ? 'wallet' : 'card'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.methodBadgeText}>{selectedMethod}</Text>
                </View>
              </View>

              <View style={styles.webviewContainer}>
                {isLoading && <ActivityIndicator style={styles.loading} />}
                {paymentUrl ? (
                  <WebView
                    source={{ uri: paymentUrl }}
                    onShouldStartLoadWithRequest={handleShouldStart}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(e: any) => console.warn('WebView error', e.nativeEvent)}
                    onHttpError={(e: any) => console.warn('HTTP Error', e.nativeEvent)}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text>Đang chuẩn bị trang thanh toán...</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleBack}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  content: { 
    backgroundColor: '#fff', 
 
    alignSelf: 'stretch',
  },
  contentCompact: {
    maxHeight: '70%',
  },
  contentLarge: {
    maxHeight: '100%',
    height: '100%',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  invoiceInfo: { 
    padding: 16, 
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  label: { 
    fontSize: 14, 
    color: '#6b7280',
    marginBottom: 8,
  },
  amount: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#10b981',
  },
  methodsContainer: {
    flexDirection: 'column',
    padding: 16,
    gap: 10,
  },
  methodCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  methodDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  methodBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webviewContainer: { 
    flex: 1, 
    overflow: 'hidden', 
    backgroundColor: '#fff' 
  },
  loading: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    zIndex: 10 
  },
  emptyState: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16 
  },
  actions: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 12 
  },
  button: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 6 
  },
  cancelButton: { 
    backgroundColor: '#eee' 
  },
  cancelText: { 
    color: '#333', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
