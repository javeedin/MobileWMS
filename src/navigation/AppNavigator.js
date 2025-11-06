import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import ShipScreen from '../screens/ShipScreen';

import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main screens
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarIcon: () => '🏠',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: () => '📦',
          tabBarLabel: 'Inventory',
          title: 'Inventory Onhand',
        }}
      />
      <Tab.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{
          tabBarIcon: () => '📥',
          tabBarLabel: 'Receive',
          title: 'Receive Goods',
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: () => '📷',
          tabBarLabel: 'Scan',
          title: 'Scan Barcode',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {!user ? (
        // Auth Stack
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        // Main App with Tabs and Stack Navigation
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{ title: 'Item Details' }}
          />
          <Stack.Screen
            name="Ship"
            component={ShipScreen}
            options={{ title: 'Ship Orders' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
