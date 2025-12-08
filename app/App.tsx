// import React from 'react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { StatusBar } from 'expo-status-bar';
// import { AuthProvider } from './src/contexts/AuthContext';
// import AppNavigator from './src/navigation/AppNavigator';

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 5 * 60 * 1000, // 5 minutes
//     },
//   },
// });

// export default function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <StatusBar style="auto" />
//         <AppNavigator />
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { vnpayService } from './src/services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  useEffect(() => {
    // Xử lý Deep Link khi app đang mở
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Xử lý Deep Link khi mở app từ link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    console.log('Deep Link received:', url);

    // Parse URL: quanlyphongtro://payment-callback?invoiceId=15&responseCode=00
    const parsed = Linking.parse(url);
    
    if (parsed.path === 'payment-callback') {
      const invoiceId = parsed.queryParams?.invoiceId as string;
      const responseCode = parsed.queryParams?.responseCode as string;

      if (!invoiceId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin hóa đơn');
        return;
      }

      try {
        // Kiểm tra trạng thái thanh toán từ backend
        const statusResponse = await vnpayService.checkPaymentStatus(parseInt(invoiceId));
        
        if (statusResponse.invoiceStatus === 'PAID') {
          Alert.alert('Thành công', 'Thanh toán thành công!', [
            { text: 'OK', onPress: () => {
              // Trigger refetch danh sách hóa đơn
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
            }}
          ]);
        } else if (responseCode === '24') {
          Alert.alert('Thông báo', 'Bạn đã hủy thanh toán');
        } else {
          Alert.alert('Thất bại', 'Thanh toán không thành công');
        }
      } catch (error) {
        console.error('Check payment error:', error);
        Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái thanh toán');
      }
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}