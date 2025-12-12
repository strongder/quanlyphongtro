import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TenantRegisterScreen from '../screens/auth/TenantRegisterScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TenantDashboardScreen from '../screens/main/TenantDashboardScreen';
// Tenant approval tab now reuses Tenants screen for account management
import RoomsScreen from '../screens/main/RoomsScreen';
import TenantsScreen from '../screens/main/TenantsScreen';
import MeterReadingsScreen from '../screens/main/MeterReadingsScreen';
import InvoicesScreen from '../screens/main/InvoicesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import PaymentsScreen from '../screens/main/PaymentsScreen';
import TenantPaymentHistoryScreen from '../screens/main/TenantPaymentHistoryScreen';

// Detail Screens
import RoomDetailScreen from '../screens/detail/RoomDetailScreen';
import TenantDetailScreen from '../screens/detail/TenantDetailScreen';
import InvoiceDetailScreen from '../screens/detail/InvoiceDetailScreen';
import MeterDetailScreen from '../screens/detail/MeterDetailScreen';
import AccountScreen from '../screens/main/AccountScreen';
import PaymentDetailScreen from '../screens/detail/PaymentDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const tabs = [
    { name: 'Dashboard', label: 'Trang chủ', icon: 'home' },
    { name: 'Rooms', label: 'Phòng', icon: 'business' },
    { name: 'Tenants', label: 'Khách thuê', icon: 'people' },
    { name: 'TenantApproval', label: 'Tài khoản', icon: 'people' },
    { name: 'Meter', label: 'Chỉ số', icon: 'speedometer' },
    { name: 'Invoices', label: 'Hóa đơn', icon: 'receipt' },
    { name: 'Payments', label: 'Thanh toán', icon: 'wallet' },
    { name: 'Reports', label: 'Báo cáo', icon: 'bar-chart' },
    { name: 'Notifications', label: 'Thông báo', icon: 'notifications' },
    { name: 'Settings', label: 'Cài đặt', icon: 'settings' },
  ];

  return (
    <View style={styles.tabBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemFocused]}
            >
              <Ionicons
                name={isFocused ? tab.icon : `${tab.icon}-outline`}
                size={20}
                color={isFocused ? '#007AFF' : 'gray'}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const ManagerTabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: true }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Trang chủ' }} />
    <Tab.Screen name="Rooms" component={RoomsScreen} options={{ title: 'Quản lý phòng' }} />
    <Tab.Screen name="Tenants" component={TenantsScreen} options={{ title: 'Quản lý khách' }} />
    <Tab.Screen name="TenantApproval" component={AccountScreen} options={{ title: 'Quản lý tài khoản' }} />
    <Tab.Screen name="Meter" component={MeterReadingsScreen} options={{ title: 'Chỉ số điện nước' }} />
    <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Hóa đơn' }} />
    <Tab.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Thanh toán' }} />
    <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Báo cáo thống kê' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
  </Tab.Navigator>
);

const TenantTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;
        if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Invoices') iconName = focused ? 'receipt' : 'receipt-outline';
        else if (route.name === 'PaymentHistory') iconName = focused ? 'wallet' : 'wallet-outline';
        else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
        else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
        else iconName = 'help-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#34C759',
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
    })}
  >
    <Tab.Screen name="Dashboard" component={TenantDashboardScreen} options={{ title: 'Trang chủ' }} />
    <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Hóa đơn của tôi' }} />
    <Tab.Screen name="PaymentHistory" component={TenantPaymentHistoryScreen} options={{ title: 'Lịch sử thanh toán' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <NavigationContainer fallback={<View style={{ flex: 1, backgroundColor: '#fff' }} />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={user.role === 'MANAGER' ? ManagerTabNavigator : TenantTabNavigator} 
            />
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: 'Chi tiết phòng', headerShown: true }} />
            <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={{ title: 'Chi tiết khách thuê', headerShown: true }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: 'Chi tiết hóa đơn', headerShown: true }} />
            <Stack.Screen name="MeterDetail" component={MeterDetailScreen} options={{ title: 'Chi tiết chỉ số', headerShown: true }} />
            <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ title: 'Chi tiết thanh toán', headerShown: true }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="TenantRegister" component={TenantRegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 60,
    borderTopWidth: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    height: 60,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'gray',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: '#007AFF',
  },
});

export default AppNavigator;
