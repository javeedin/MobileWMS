import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import ShipScreen from '../screens/ShipScreen';
import LocatorTransfersScreen from '../screens/LocatorTransfersScreen';
import ItemTransferDetailScreen from '../screens/ItemTransferDetailScreen';
import StockAdjustmentsScreen from '../screens/StockAdjustmentsScreen';

import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

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
        // Main App Stack
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
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{ title: 'Inventory' }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ title: 'Scan Barcode' }}
          />
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{ title: 'Item Details' }}
          />
          <Stack.Screen
            name="Receive"
            component={ReceiveScreen}
            options={{ title: 'Receive Goods' }}
          />
          <Stack.Screen
            name="Ship"
            component={ShipScreen}
            options={{ title: 'Ship Orders' }}
          />
          <Stack.Screen
            name="LocatorTransfers"
            component={LocatorTransfersScreen}
            options={{ title: 'Locator Transfers' }}
          />
          <Stack.Screen
            name="ItemTransferDetail"
            component={ItemTransferDetailScreen}
            options={{ title: 'Transfer Item' }}
          />
          <Stack.Screen
            name="StockAdjustments"
            component={StockAdjustmentsScreen}
            options={{ title: 'Stock Adjustments' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
