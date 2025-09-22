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
import TenantApprovalScreen from '../screens/main/TenantApprovalScreen';
import RoomsScreen from '../screens/main/RoomsScreen';
import TenantsScreen from '../screens/main/TenantsScreen';
import MeterReadingsScreen from '../screens/main/MeterReadingsScreen';
import InvoicesScreen from '../screens/main/InvoicesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';

// Detail Screens
import RoomDetailScreen from '../screens/detail/RoomDetailScreen';
import TenantDetailScreen from '../screens/detail/TenantDetailScreen';
import InvoiceDetailScreen from '../screens/detail/InvoiceDetailScreen';
import MeterDetailScreen from '../screens/detail/MeterDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const tabs = [
    { name: 'Dashboard', label: 'Trang chủ', icon: 'home' },
    { name: 'Rooms', label: 'Phòng', icon: 'business' },
    { name: 'Tenants', label: 'Khách thuê', icon: 'people' },
    { name: 'TenantApproval', label: 'Duyệt', icon: 'checkmark-circle' },
    { name: 'Meter', label: 'Chỉ số', icon: 'speedometer' },
    { name: 'Invoices', label: 'Hóa đơn', icon: 'receipt' },
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

const ManagerTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Rooms" component={RoomsScreen} />
      <Tab.Screen name="Tenants" component={TenantsScreen} />
      <Tab.Screen name="TenantApproval" component={TenantApprovalScreen} />
      <Tab.Screen name="Meter" component={MeterReadingsScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const TenantTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Invoices') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={TenantDashboardScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Hóa đơn' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Thông báo' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Hoặc loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={user.role === 'MANAGER' ? ManagerTabNavigator : TenantTabNavigator} 
            />
            <Stack.Screen 
              name="RoomDetail" 
              component={RoomDetailScreen} 
              options={{ title: 'Chi tiết phòng', headerShown: true }} 
            />
            <Stack.Screen 
              name="TenantDetail" 
              component={TenantDetailScreen} 
              options={{ title: 'Chi tiết khách thuê', headerShown: true }} 
            />
            <Stack.Screen 
              name="InvoiceDetail" 
              component={InvoiceDetailScreen} 
              options={{ title: 'Chi tiết hóa đơn', headerShown: true }} 
            />
            <Stack.Screen 
              name="MeterDetail" 
              component={MeterDetailScreen} 
              options={{ title: 'Chi tiết chỉ số', headerShown: true }} 
            />
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
