// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Modal,
//   TouchableOpacity,
//   Alert,
//   ActivityIndicator,
//   ScrollView,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as WebBrowser from 'expo-web-browser';
// import { vnpayService } from '../services/api';
// import { PaymentResponse } from '../types';

// interface VNPayModalProps {
//   visible: boolean;
//   invoiceId: number;
//   invoiceAmount: number;
//   onClose: () => void;
//   onPaymentSuccess: () => void;
//   onPaymentFailed: () => void;
// }

// export const VNPayModal: React.FC<VNPayModalProps> = ({
//   visible,
//   invoiceId,
//   invoiceAmount,
//   onClose,
//   onPaymentSuccess,
//   onPaymentFailed,
// }) => {
//   const [isLoading, setIsLoading] = useState(false);

//   const handlePayment = async () => {
//     setIsLoading(true);
//     try {
//       // Gọi API BE tạo payment URL
//       const paymentResponse: PaymentResponse = await vnpayService.createPaymentUrl(invoiceId);

//       if (paymentResponse.code === '00' && paymentResponse.paymentUrl) {
//         console.log('Opening payment URL');
        
//         // Mở browser VNPay
//         const result = await WebBrowser.openBrowserAsync(paymentResponse.paymentUrl);
        
//         // Khi browser đóng, App.tsx sẽ xử lý Deep Link từ VNPay
//         // Không cần polling ở đây nữa
//         setIsLoading(false);
//       } else {
//         setIsLoading(false);
//         Alert.alert('Lỗi', paymentResponse.message || 'Không thể tạo link thanh toán');
//       }
//     } catch (err: any) {
//       setIsLoading(false);
//       console.error('Payment error:', err);
//       Alert.alert('Lỗi', err.message || 'Không thể thực hiện thanh toán');
//     }
//   };

//   return (
//     <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
//       <View style={styles.container}>
//         <View style={styles.content}>
          
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity onPress={onClose}>
//               <Ionicons name="close" size={24} color="#333" />
//             </TouchableOpacity>

//             <Text style={styles.title}>Thanh toán VNPay</Text>
//             <View style={{ width: 24 }} />
//           </View>

//           {/* Info */}
//           <View style={styles.invoiceInfo}>
//             <Text style={styles.label}>Số tiền cần thanh toán:</Text>
//             <Text style={styles.amount}>{invoiceAmount.toLocaleString()}đ</Text>
//             <Text style={styles.note}>Bạn sẽ được chuyển đến trang thanh toán của VNPay.</Text>
//           </View>

//           {/* Buttons */}
//           <View style={styles.actions}>
//             <TouchableOpacity
//               style={[styles.button, styles.cancelButton]}
//               onPress={onClose}
//               disabled={isLoading}
//             >
//               <Text style={styles.cancelText}>Hủy</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, styles.payButton, isLoading && styles.disabled]}
//               onPress={handlePayment}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <>
//                   <Ionicons name="card-outline" size={18} color="#fff" />
//                   <Text style={styles.payText}>Thanh toán ngay</Text>
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>

//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
//   content: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
//   title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
//   invoiceInfo: { padding: 16, backgroundColor: '#f7f7f7' },
//   label: { fontSize: 14, color: '#666' },
//   amount: { fontSize: 26, fontWeight: 'bold', color: '#007AFF', marginTop: 4 },
//   note: { fontSize: 12, color: '#888', marginTop: 6 },
//   actions: { flexDirection: 'row', padding: 16, gap: 12 },
//   button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
//   cancelButton: { backgroundColor: '#eee' },
//   cancelText: { color: '#333', fontSize: 16, fontWeight: '600' },
//   payButton: { backgroundColor: '#007AFF' },
//   payText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   disabled: { opacity: 0.6 }
// });
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
import { vnpayService } from '../services/api';
import WebView, { WebViewNavigation } from 'react-native-webview';


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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPaymentUrl(null);
      return;
    }

    const fetchPaymentUrl = async () => {
      setIsLoading(true);
      try {
        const paymentResponse = await vnpayService.createPaymentUrl(invoiceId);

        if (paymentResponse.code !== '00' || !paymentResponse.paymentUrl) {
          Alert.alert('Lỗi', paymentResponse.message || 'Không thể tạo link thanh toán');
          onClose();
          return;
        }

        setPaymentUrl(paymentResponse.paymentUrl);
      } catch (err: any) {
        console.error('Payment error:', err);
        Alert.alert('Lỗi', err.message || 'Không thể thực hiện thanh toán');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentUrl();
  }, [visible, invoiceId, onClose]);

  const checkPaymentStatusWithRetry = async (invoiceId: number, attempts = 3, delayMs = 1000) => {
    for (let i = 0; i < attempts; i++) {
      try {
        const statusResp = await vnpayService.checkPaymentStatus(invoiceId);
        const invoiceStatus = statusResp.invoiceStatus?.toUpperCase();
        const paymentStatus = statusResp.payment?.status?.toUpperCase();

        if (invoiceStatus === 'PAID' || paymentStatus === 'SUCCESS') {
          onPaymentSuccess();
          Alert.alert('✅ Thanh toán thành công', `Số tiền: ${invoiceAmount.toLocaleString()}đ`);
          return;
        }

        if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          onPaymentFailed();
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

    onPaymentFailed();
    Alert.alert('⚠️ Chưa xác định trạng thái', 'Vui lòng thử lại hoặc kiểm tra lịch sử thanh toán.');
  };

  const handleResult = async (url: string) => {
    try {
      const query = url.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const status = (params.get('status') || '').toLowerCase();
      const responseCode = (params.get('vnp_ResponseCode') || '').toUpperCase();

      if (status === 'success' || responseCode === '00') {
        await checkPaymentStatusWithRetry(invoiceId);
      } else if (status || responseCode) {
        await checkPaymentStatusWithRetry(invoiceId);
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
      url.startsWith('quanlyphongtro://') ||
      url.includes('payment-callback') ||
      url.includes('vnpay-return')
    ) {
      handleResult(url);
      return false; // chặn WebView tiếp tục tải, quay lại app
    }
    return true;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Thanh toán VNPay</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.invoiceInfo}>
            <Text style={styles.label}>Số tiền cần thanh toán:</Text>
            <Text style={styles.amount}>{invoiceAmount.toLocaleString()}đ</Text>
            <Text style={styles.note}>Bạn sẽ được chuyển đến trang thanh toán của VNPay.</Text>
          </View> */}

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
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  invoiceInfo: { padding: 16, backgroundColor: '#f7f7f7' },
  label: { fontSize: 14, color: '#666' },
  amount: { fontSize: 26, fontWeight: 'bold', color: '#007AFF', marginTop: 4 },
  note: { fontSize: 12, color: '#888', marginTop: 6 },
  webviewContainer: { flex: 1, minHeight: 620, marginHorizontal: 12, marginTop: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  loading: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  cancelButton: { backgroundColor: '#eee' },
  cancelText: { color: '#333', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 }
});
