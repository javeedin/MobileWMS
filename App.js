import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  Vibration,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Oracle Redwood Design System Constants
const COLORS = {
  // Primary Brand Colors
  primary: '#C74634',           // Oracle Red
  primaryHover: '#A33B2C',      // Darker Oracle Red
  primaryLight: '#FEF1EF',      // Light red tint

  // Secondary/Neutral Colors
  secondary: '#312D2A',         // Charcoal
  secondaryLight: '#4A4541',    // Lighter charcoal

  // Semantic Colors
  success: '#107F47',           // Redwood Green
  successLight: '#E8F5ED',      // Light green background
  warning: '#D4820A',           // Redwood Amber
  warningLight: '#FEF6E7',      // Light amber background
  danger: '#C74634',            // Redwood Red
  dangerLight: '#FEF1EF',       // Light red background
  info: '#0572CE',              // Redwood Blue
  infoLight: '#E8F4FC',         // Light blue background

  // Neutral Colors
  neutral900: '#201E1C',        // Darkest text
  neutral700: '#403B36',        // Dark text
  neutral600: '#524C47',        // Medium-dark text
  neutral500: '#6B6560',        // Secondary text
  neutral400: '#8C8680',        // Placeholder text
  neutral300: '#B8B3AE',        // Disabled text
  neutral200: '#D9D5D2',        // Borders
  neutral100: '#E8E5E2',        // Light borders
  neutral50: '#F4F2F0',         // Light background

  // Background Colors
  background: '#FAF9F8',        // Warm off-white (main background)
  surface: '#FFFFFF',           // White surface (cards)
  surfaceHover: '#F7F5F3',      // Hover state for surfaces

  // Legacy mappings for compatibility
  dark: '#312D2A',
  light: '#F4F2F0',
  white: '#FFFFFF',
  text: '#201E1C',
  textSecondary: '#6B6560',
  border: '#E8E5E2',
  backgroundSecondary: '#F4F2F0',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 34,
};

// Redwood border radius
const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Redwood shadows
const SHADOWS = {
  sm: {
    shadowColor: '#201E1C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#201E1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#201E1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

// API Configuration
const API_URL = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/PUTAWAYDETAILS?PICKER_NAME=PICKER1';

export default function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [user, setUser] = useState(null);

  // Organization state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const organizations = ['AMS', 'MLCECLAIM'];

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [menuOpen, setMenuOpen] = useState(false);

  // Purchase Orders state
  const [poData, setPoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Scanner state
  const [scanningForItem, setScanningForItem] = useState(null);
  const [scanningForInventory, setScanningForInventory] = useState(false);
  const [scannedLocator, setScannedLocator] = useState('');
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Camera permission hook
  const [permission, requestPermission] = useCameraPermissions();

  // Inventory Onhand state
  const [onhandData, setOnhandData] = useState([]);
  const [onhandLoading, setOnhandLoading] = useState(false);
  const [searchOrgCode, setSearchOrgCode] = useState('');
  const [searchSubinventory, setSearchSubinventory] = useState('');
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Onhand by Lots state
  const [lotsData, setLotsData] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [groupedLotsData, setGroupedLotsData] = useState([]);
  const [selectedLotItem, setSelectedLotItem] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [serialLoading, setSerialLoading] = useState(false);
  const [lotsSearchQuery, setLotsSearchQuery] = useState('');

  // Ship Orders state
  const [shipOrdersData, setShipOrdersData] = useState([]);
  const [shipOrdersLoading, setShipOrdersLoading] = useState(false);
  const [groupedShipOrders, setGroupedShipOrders] = useState([]);
  const [selectedShipOrder, setSelectedShipOrder] = useState(null);
  const [shipSearchQuery, setShipSearchQuery] = useState('');
  const [shippingLine, setShippingLine] = useState(null);

  // Pick Modal state
  const [showPickModal, setShowPickModal] = useState(false);
  const [pickingLine, setPickingLine] = useState(null);
  const [pickedQty, setPickedQty] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Handle Login
  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setUser({ name: username, username: username });
      setIsLoggedIn(true);
      setShowOrgModal(true); // Show organization selection after login
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  // Handle Organization Selection
  const handleOrgSelection = (org) => {
    setSelectedOrg(org);
    setShowOrgModal(false);
    setCurrentScreen('Dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setSelectedOrg(null);
    setCurrentScreen('Login');
    setUsername('admin');
    setPassword('admin123');
  };

  // Fetch Purchase Orders
  const fetchPOData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      // Transform data
      const transformedData = data.items.map((item, index) => ({
        ...item,
        id: index.toString(),
        actualLocator: item.locator || '',
        putawayQty: item.transactionquantity || 0,
        remarks: '',
      }));

      setPoData(transformedData);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data: ' + error.message);
      setLoading(false);
    }
  };

  // Fetch Inventory Onhand
  const fetchOnhandData = async () => {
    if (!searchOrgCode) {
      Alert.alert('Error', 'Please enter Organization Code');
      return;
    }

    setOnhandLoading(true);
    try {
      // Note: Using the typo from user's URL "orgainzation_code"
      let url = `https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/getonhand?orgainzation_code=${searchOrgCode}`;

      if (searchSubinventory) {
        url += `&subinventory=${searchSubinventory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Transform data
      const transformedData = (data.items || []).map((item, index) => ({
        ...item,
        id: index.toString(),
      }));

      setOnhandData(transformedData);
      setOnhandLoading(false);
      setShowParameterModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch onhand data: ' + error.message);
      setOnhandLoading(false);
    }
  };

  // Fetch Onhand by Lots
  const fetchLotsData = async () => {
    setLotsLoading(true);
    try {
      const response = await fetch(
        'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/getonhandbylots'
      );
      const data = await response.json();

      const items = data.items || [];
      setLotsData(items);

      // Group by item (organization_code, sub_inventory_code, item_number, item_description)
      const grouped = items.reduce((acc, item) => {
        const key = `${item.organization_code}-${item.sub_inventory_code}-${item.item_number}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            organization_code: item.organization_code,
            sub_inventory_code: item.sub_inventory_code,
            item_number: item.item_number,
            item_description: item.item_description,
            totalQuantity: 0,
            lots: [],
          };
        }
        acc[key].totalQuantity += item.primaryquantity || 0;
        acc[key].lots.push({
          ...item,
          id: `${key}-${item.lotnumber}-${item.lid}`,
        });
        return acc;
      }, {});

      setGroupedLotsData(Object.values(grouped));
      setLotsLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch lots data: ' + error.message);
      setLotsLoading(false);
    }
  };

  // Fetch Serial Numbers with authentication
  const fetchSerialNumbers = async (srnoLink) => {
    if (!srnoLink) {
      Alert.alert('Info', 'No serial numbers available for this lot');
      return;
    }

    setSerialLoading(true);
    try {
      const credentials = btoa('javeed:Fusion@1234');
      const response = await fetch(srnoLink, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSerialNumbers(data.items || []);
      setSerialLoading(false);
      setCurrentScreen('SerialNumbers');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch serial numbers: ' + error.message);
      setSerialLoading(false);
    }
  };

  // Fetch Ship Orders (Pending Picking Details)
  const fetchShipOrders = async () => {
    setShipOrdersLoading(true);
    try {
      const response = await fetch(
        'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/pendingpickingdetails'
      );
      const data = await response.json();

      const items = data.items || [];
      setShipOrdersData(items);

      // Group by source_order_number, account_name, pick_release_date, organization_name
      const grouped = items.reduce((acc, item) => {
        const key = `${item.source_order_number}-${item.organization_name}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            source_order_number: item.source_order_number,
            account_name: item.account_name,
            pick_release_date: item.pick_release_date,
            organization_name: item.organization_name,
            salesrep_name: item.salesrep_name,
            picker_name: item.picker_name,
            lines: [],
            totalQty: 0,
          };
        }
        acc[key].lines.push({
          ...item,
          lineId: `${key}-${item.id}-${item.delivery_detail_id}`,
        });
        acc[key].totalQty += item.qty || 0;
        return acc;
      }, {});

      setGroupedShipOrders(Object.values(grouped));
      setShipOrdersLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch ship orders: ' + error.message);
      setShipOrdersLoading(false);
    }
  };

  // Handle pick line - open modal
  const handlePickLine = (line) => {
    setPickingLine(line);
    setPickedQty(String(line.qty || ''));
    setSerialNumber('');
    setShowPickModal(true);
  };

  // Handle confirm pick
  const handleConfirmPick = () => {
    if (!pickedQty || parseInt(pickedQty) <= 0) {
      Alert.alert('Error', 'Please enter a valid picked quantity');
      return;
    }

    Alert.alert(
      'Success',
      `Pick confirmed!\n\nItem: ${pickingLine.item_number}\nLot: ${pickingLine.lot_number || 'N/A'}\nPicked Qty: ${pickedQty}\nSerial: ${serialNumber || 'N/A'}`,
      [{ text: 'OK', onPress: () => setShowPickModal(false) }]
    );
  };

  // Handle scan serial for pick
  const handleScanSerialForPick = () => {
    // Open scanner for serial number
    setShowPickModal(false);
    setScanningForInventory(false);
    setScanningForItem(null);
    setScanned(false);
    // We'll use a special flag to know we're scanning for pick serial
    setPickingLine(pickingLine);
    setCurrentScreen('PickSerialScanner');
  };

  // Handle ship all lines
  const handleShipAllLines = (order) => {
    Alert.alert(
      'Ship All Lines',
      `Ship all ${order.lines.length} lines for order ${order.source_order_number}?\n\nTotal Qty: ${order.totalQty}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ship All',
          style: 'default',
          onPress: () => {
            Alert.alert('Success', `All ${order.lines.length} lines shipped successfully!`);
            setSelectedShipOrder(null);
            setCurrentScreen('Ship');
          },
        },
      ]
    );
  };

  // Handle unified search with autocomplete (Amazon-style)
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length > 1 && onhandData.length > 0) {
      // Search both item code and description
      const suggestions = [];
      const seen = new Set();

      onhandData.forEach(item => {
        // Add item code matches
        if (item.itemnumber && item.itemnumber.toLowerCase().includes(text.toLowerCase()) && !seen.has(item.itemnumber)) {
          suggestions.push({
            type: 'code',
            value: item.itemnumber,
            display: `${item.itemnumber} - ${item.itemdescription || 'No description'}`
          });
          seen.add(item.itemnumber);
        }
        // Add description matches
        else if (item.itemdescription && item.itemdescription.toLowerCase().includes(text.toLowerCase()) && !seen.has(item.itemdescription)) {
          suggestions.push({
            type: 'description',
            value: item.itemdescription,
            display: `${item.itemnumber || 'N/A'} - ${item.itemdescription}`
          });
          seen.add(item.itemdescription);
        }
      });

      setItemSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Select autocomplete suggestion
  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
  };

  // Filter onhand data (searches both item code and description)
  const filteredOnhandData = onhandData.filter(item => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const matchesItemCode = item.itemnumber && item.itemnumber.toLowerCase().includes(query);
    const matchesDescription = item.itemdescription && item.itemdescription.toLowerCase().includes(query);

    return matchesItemCode || matchesDescription;
  });

  // Group PO data by document number
  const groupedPOs = poData.reduce((acc, item) => {
    const docNum = item.documentnumber || 'Unknown';
    if (!acc[docNum]) {
      acc[docNum] = {
        items: [],
        vendorname: item.vendorname || 'Unknown Vendor',
      };
    }
    acc[docNum].items.push(item);
    return acc;
  }, {});

  const poList = Object.keys(groupedPOs).map(docNum => ({
    documentnumber: docNum,
    items: groupedPOs[docNum].items,
    itemCount: groupedPOs[docNum].items.length,
    vendorname: groupedPOs[docNum].vendorname,
  }));

  // Handle barcode scan - navigate to scanner
  const handleScanLocator = (item) => {
    setScanningForItem(item);
    setScanned(false); // Reset scan state
    setCurrentScreen('BarcodeScanner');
  };

  // Handle actual barcode scanned event
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return; // Prevent multiple scans

    setScanned(true);
    Vibration.vibrate(100); // Haptic feedback
    setScannedLocator(data);

    // Handle inventory search scanning
    if (scanningForInventory) {
      Alert.alert(
        'Scan Successful!',
        `Item Code: ${data}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Search',
            style: 'default',
            onPress: () => {
              setSearchQuery(data);
              setShowSuggestions(false);
              setScanningForInventory(false);
              setScanned(false);
              setCurrentScreen('Inventory');
            },
          },
        ]
      );
      return;
    }

    // Update item with scanned locator
    if (scanningForItem) {
      const updatedItem = { ...scanningForItem, actualLocator: data };
      setSelectedItem(updatedItem);

      // Update the item in poData as well
      const updatedPoData = poData.map(item =>
        item.id === scanningForItem.id ? { ...item, actualLocator: data } : item
      );
      setPoData(updatedPoData);
    }

    Alert.alert(
      'Scan Successful!',
      `Barcode Type: ${type}\nLocator: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            setCurrentScreen(scanningForItem ? 'ItemDetail' : 'Dashboard');
            setScanningForItem(null);
          },
        },
      ]
    );
  };

  // Simulate scan for testing (when camera not available)
  const simulateScan = () => {
    const mockLocator = `LOC-${Math.floor(Math.random() * 1000)}`;
    handleBarCodeScanned({ type: 'SIMULATED', data: mockLocator });
  };

  // ============= SCREENS =============

  // Organization Selection Modal
  const renderOrgModal = () => (
    <Modal
      visible={showOrgModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Organization</Text>
          <Text style={styles.modalSubtitle}>Choose your organization</Text>

          <ScrollView style={styles.orgScrollView} showsVerticalScrollIndicator={true}>
            {organizations.map((org) => (
              <TouchableOpacity
                key={org}
                style={styles.orgButton}
                onPress={() => handleOrgSelection(org)}
              >
                <Text style={styles.orgButtonText}>{org}</Text>
                <Text style={styles.orgButtonArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Login Screen
  if (!isLoggedIn || currentScreen === 'Login') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Curved Header */}
        <View style={styles.loginTopSection}>
          <View style={styles.loginLogoContainer}>
            <Text style={styles.loginLogoIcon}>📦</Text>
          </View>
          <Text style={styles.loginTitle}>MobileWMS</Text>
          <Text style={styles.loginSubtitle}>Warehouse Management System</Text>
        </View>

        {/* Login Card */}
        <View style={styles.loginFormContainer}>
          <View style={styles.loginCard}>
            <Text style={styles.loginCardTitle}>Welcome Back</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.loginHint}>Use admin/admin123 to login</Text>
          </View>
        </View>

        {renderOrgModal()}
      </View>
    );
  }

  // Dashboard Screen
  if (currentScreen === 'Dashboard') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.dashboardGreeting}>Welcome back,</Text>
              <Text style={styles.dashboardUserName}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Hamburger Menu */}
        {menuOpen && (
          <View style={styles.hamburgerMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuUserName}>{user?.name || 'User'}</Text>
              <Text style={styles.menuUserRole}>Warehouse Staff</Text>
              {selectedOrg && <Text style={styles.menuOrgText}>Org: {selectedOrg}</Text>}
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setCurrentScreen('Dashboard'); }}>
              <Text style={styles.menuItemText}>🏠 Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setCurrentScreen('Inventory'); }}>
              <Text style={styles.menuItemText}>📦 Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setCurrentScreen('OnhandByLots'); fetchLotsData(); }}>
              <Text style={styles.menuItemText}>🏷️ Onhand by Lots</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, { color: COLORS.danger }]}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.dashboardContent}>
          {/* Organization Display */}
          {selectedOrg && (
            <View style={styles.orgDisplayContainer}>
              <Text style={styles.orgDisplayLabel}>Organization:</Text>
              <Text style={styles.orgDisplayValue}>{selectedOrg}</Text>
            </View>
          )}

          <View style={styles.cardGrid}>
            {/* Inventory Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                setSearchOrgCode(selectedOrg || '');
                setCurrentScreen('Inventory');
              }}
            >
              <Text style={styles.cardIcon}>📦</Text>
              <Text style={styles.cardTitle}>Inventory</Text>
              <Text style={styles.cardDescription}>View and manage inventory</Text>
            </TouchableOpacity>

            {/* Scanner Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => setCurrentScreen('Scanner')}
            >
              <Text style={styles.cardIcon}>📷</Text>
              <Text style={styles.cardTitle}>Scan Item</Text>
              <Text style={styles.cardDescription}>Scan barcode to view item</Text>
            </TouchableOpacity>

            {/* Receive Goods Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                setCurrentScreen('ReceiveGoods');
                fetchPOData();
              }}
            >
              <Text style={styles.cardIcon}>📥</Text>
              <Text style={styles.cardTitle}>Receive Goods</Text>
              <Text style={styles.cardDescription}>Process incoming shipments</Text>
            </TouchableOpacity>

            {/* Ship Orders Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                setCurrentScreen('Ship');
                fetchShipOrders();
              }}
            >
              <Text style={styles.cardIcon}>📤</Text>
              <Text style={styles.cardTitle}>Ship Orders</Text>
              <Text style={styles.cardDescription}>Process outgoing orders</Text>
            </TouchableOpacity>

            {/* Onhand by Lots Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                setCurrentScreen('OnhandByLots');
                fetchLotsData();
              }}
            >
              <Text style={styles.cardIcon}>🏷️</Text>
              <Text style={styles.cardTitle}>Onhand by Lots</Text>
              <Text style={styles.cardDescription}>View inventory by lot numbers</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Dashboard')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setSearchOrgCode(selectedOrg || ''); setCurrentScreen('Inventory'); }}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navText}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => { setCurrentScreen('ReceiveGoods'); fetchPOData(); }}>
            <Text style={styles.navIcon}>📥</Text>
            <Text style={styles.navText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Scanner')}>
            <Text style={styles.navIcon}>📷</Text>
            <Text style={styles.navText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Receive Goods / Purchase Orders Screen
  if (currentScreen === 'ReceiveGoods' && !selectedPO) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('Dashboard')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Purchase Orders</Text>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            {selectedOrg && <Text style={styles.headerOrgText}>{selectedOrg}</Text>}
            <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
              <Text style={styles.notificationIconSmall}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchPOData}>
              <Text style={styles.refreshButton}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{poList.length}</Text>
            <Text style={styles.statLabel}>Total POs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{poData.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading Purchase Orders...</Text>
          </View>
        ) : (
          <FlatList
            data={poList}
            keyExtractor={(item) => item.documentnumber}
            contentContainerStyle={styles.poList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.poCard}
                onPress={() => {
                  setSelectedPO(item);
                  setCurrentScreen('POItems');
                }}
              >
                <View style={styles.poCardHeader}>
                  <Text style={styles.poNumber}>PO: {item.documentnumber}</Text>
                  <View style={styles.itemCountBadge}>
                    <Text style={styles.itemCountText}>{item.itemCount} items</Text>
                  </View>
                </View>
                <Text style={styles.poCardSubtext}>Vendor: {item.vendorname}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No purchase orders found</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchPOData}>
                  <Text style={styles.retryButtonText}>Fetch Purchase Orders</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    );
  }

  // PO Items Screen
  if (currentScreen === 'POItems' && selectedPO) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => { setSelectedPO(null); setCurrentScreen('ReceiveGoods'); }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>PO Items</Text>
            <Text style={styles.screenSubtitle}>PO: {selectedPO.documentnumber}</Text>
          </View>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            {selectedOrg && <Text style={styles.headerOrgText}>{selectedOrg}</Text>}
            <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
              <Text style={styles.notificationIconSmall}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        <FlatList
          data={selectedPO.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.itemsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => {
                setSelectedItem(item);
                setCurrentScreen('ItemDetail');
              }}
            >
              <View style={styles.itemCardHeader}>
                <Text style={styles.itemName}>{item.itemnumber || 'Unknown Item'}</Text>
                <Text style={styles.itemQty}>Qty: {item.transactionquantity || 0}</Text>
              </View>
              {item.itemdescription && (
                <Text style={styles.itemDescription}>{item.itemdescription}</Text>
              )}
              <Text style={styles.itemDetail}>Line No: {item.documentlinenumber || 'N/A'}</Text>
              <Text style={styles.itemDetail}>SKU: {item.itemnumber || 'N/A'}</Text>
              <Text style={styles.itemDetail}>Locator: {item.locator || 'Not assigned'}</Text>
              <Text style={styles.itemDetail}>Org: {item.organizationcode || 'N/A'}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // Item Detail Screen
  if (currentScreen === 'ItemDetail' && selectedItem) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('POItems')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Item Details</Text>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={styles.notificationIconSmall}>🔔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailContainer}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{selectedItem.itemnumber || 'Unknown Item'}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PO Number:</Text>
              <Text style={styles.detailValue}>{selectedItem.documentnumber || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item Number:</Text>
              <Text style={styles.detailValue}>{selectedItem.itemnumber || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Line No:</Text>
              <Text style={styles.detailValue}>{selectedItem.documentlinenumber || 'N/A'}</Text>
            </View>

            {selectedItem.itemdescription && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{selectedItem.itemdescription}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{selectedItem.transactionquantity || 0}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Original Locator:</Text>
              <Text style={styles.detailValue}>{selectedItem.locator || 'N/A'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scanned Locator:</Text>
              <Text style={styles.detailValue}>{selectedItem.actualLocator || 'Not scanned'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Organization:</Text>
              <Text style={styles.detailValue}>{selectedItem.organizationcode || 'N/A'}</Text>
            </View>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => handleScanLocator(selectedItem)}
            >
              <Text style={styles.scanButtonText}>📷 Scan Pallet Locator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                Alert.alert(
                  'Confirm Receipt',
                  `Confirm receipt of ${selectedItem.itemnumber}?\n\nQuantity: ${selectedItem.transactionquantity}\nLocator: ${selectedItem.actualLocator || selectedItem.locator}`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Confirm',
                      onPress: () => {
                        Alert.alert('Success', 'Receipt confirmed successfully!');
                        setCurrentScreen('POItems');
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.confirmButtonText}>✓ Confirm Receipt</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Barcode Scanner Screen
  if (currentScreen === 'BarcodeScanner') {
    // Check permission status
    if (!permission) {
      return (
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.scannerInstructions}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
          <Text style={styles.scannerIcon}>📷</Text>
          <Text style={styles.scannerInstructions}>Camera Permission Required</Text>
          <Text style={styles.permissionHint}>
            We need camera access to scan barcodes and QR codes.
          </Text>

          {/* Request Permission Button */}
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>

          {/* Fallback to simulation */}
          <TouchableOpacity style={styles.simulateButton} onPress={simulateScan}>
            <Text style={styles.simulateButtonText}>🎲 Use Simulated Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelScanButton}
            onPress={() => {
              setScanningForItem(null);
              setCurrentScreen(selectedItem ? 'ItemDetail' : 'Dashboard');
            }}
          >
            <Text style={styles.cancelScanButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Full Screen Camera */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr',
              'code128',
              'code39',
              'ean13',
              'ean8',
              'upc_a',
              'upc_e',
              'datamatrix',
              'pdf417',
            ],
          }}
          onBarcodeScanned={scanned ? undefined : (result) => {
            handleBarCodeScanned({ type: result.type, data: result.data });
          }}
        />

        {/* Overlay */}
        <View style={styles.scannerOverlay}>
          {/* Top Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerBackButton}
              onPress={() => {
                setScanningForItem(null);
                setScanningForInventory(false);
                setScanned(false);
                setCurrentScreen(
                  scanningForInventory ? 'Inventory' :
                  selectedItem ? 'ItemDetail' : 'Dashboard'
                );
              }}
            >
              <Text style={styles.scannerBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>
              {scanningForInventory ? 'Scan Item Code' :
               scanningForItem ? 'Scan Pallet Locator' : 'Scan Barcode'}
            </Text>
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Text style={styles.torchButtonText}>{torchOn ? '🔦' : '💡'}</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerFrameContainer}>
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCornerTL} />
              <View style={styles.scannerCornerTR} />
              <View style={styles.scannerCornerBL} />
              <View style={styles.scannerCornerBR} />
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <Text style={styles.scannedCheckmark}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.scannerHint}>
              {scanned ? 'Barcode scanned!' :
               scanningForInventory ? 'Scan item barcode to search' :
               'Position barcode within the frame'}
            </Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.scannerControls}>
            {scanningForInventory && (
              <View style={styles.scannerItemInfo}>
                <Text style={styles.scannerItemLabel}>Mode:</Text>
                <Text style={styles.scannerItemValue}>Inventory Search</Text>
              </View>
            )}
            {scanningForItem && (
              <View style={styles.scannerItemInfo}>
                <Text style={styles.scannerItemLabel}>Scanning for:</Text>
                <Text style={styles.scannerItemValue}>{scanningForItem.itemnumber}</Text>
              </View>
            )}

            {scanned && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>🔄 Scan Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.simulateButton} onPress={simulateScan}>
              <Text style={styles.simulateButtonText}>🎲 Simulate Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Inventory Onhand Screen
  if (currentScreen === 'Inventory') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setCurrentScreen('Dashboard');
            setOnhandData([]);
            setSearchOrgCode('');
            setSearchSubinventory('');
            setSearchQuery('');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Inventory Onhand</Text>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => {
              setScanningForInventory(true);
              setScanned(false);
              setCurrentScreen('BarcodeScanner');
            }}>
              <Text style={styles.notificationIconSmall}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
              <Text style={styles.notificationIconSmall}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items by code or description..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.scanSearchButton}
              onPress={() => {
                setScanningForInventory(true);
                setScanned(false);
                setCurrentScreen('BarcodeScanner');
              }}
            >
              <Text style={styles.scanSearchButtonText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fetchButton}
              onPress={() => setShowParameterModal(true)}
            >
              <Text style={styles.fetchButtonText}>📥 Fetch</Text>
            </TouchableOpacity>
          </View>

          {/* Autocomplete Suggestions */}
          {showSuggestions && itemSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {itemSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion.display}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Parameter Modal */}
        <Modal
          visible={showParameterModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.parameterModalContainer}>
              <Text style={styles.modalTitle}>Fetch Parameters</Text>
              <Text style={styles.modalSubtitle}>Enter search parameters</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Organization Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Organization Code (e.g., AMS)"
                  value={searchOrgCode}
                  onChangeText={setSearchOrgCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subinventory (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Subinventory"
                  value={searchSubinventory}
                  onChangeText={setSearchSubinventory}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowParameterModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalFetchButton}
                  onPress={fetchOnhandData}
                >
                  <Text style={styles.modalFetchText}>Fetch Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Results */}
        {onhandLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading inventory data...</Text>
          </View>
        ) : onhandData.length > 0 ? (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Results ({filteredOnhandData.length} of {onhandData.length} items)
              </Text>
            </View>

            <FlatList
              data={filteredOnhandData}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.onhandList}
              renderItem={({ item }) => (
                <View style={styles.onhandCard}>
                  <View style={styles.onhandCardHeader}>
                    <Text style={styles.onhandItemNumber}>{item.itemnumber || 'N/A'}</Text>
                    <View style={styles.qohBadge}>
                      <Text style={styles.qohText}>{item.qoh || 0} {item.uom || ''}</Text>
                    </View>
                  </View>

                  {item.itemdescription && (
                    <Text style={styles.onhandDescription}>{item.itemdescription}</Text>
                  )}

                  <View style={styles.onhandDetailsRow}>
                    <View style={styles.onhandDetailItem}>
                      <Text style={styles.onhandDetailLabel}>Org:</Text>
                      <Text style={styles.onhandDetailValue}>{item.organizationcode || 'N/A'}</Text>
                    </View>
                    <View style={styles.onhandDetailItem}>
                      <Text style={styles.onhandDetailLabel}>Subinventory:</Text>
                      <Text style={styles.onhandDetailValue}>{item.subinventorycode || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateText}>No data found</Text>
            <Text style={styles.emptyStateHint}>Enter search parameters above and tap Search</Text>
          </View>
        )}
      </View>
    );
  }

  // Scanner Screen
  if (currentScreen === 'Scanner') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('Dashboard')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Scanner</Text>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={styles.notificationIconSmall}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentCenter}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderTitle}>Barcode Scanner</Text>
          <Text style={styles.placeholderText}>Coming soon...</Text>
        </View>
      </View>
    );
  }

  // Filter grouped ship orders
  const filteredShipOrders = groupedShipOrders.filter(order => {
    if (!shipSearchQuery) return true;
    const query = shipSearchQuery.toLowerCase();
    return (
      (order.source_order_number && order.source_order_number.toLowerCase().includes(query)) ||
      (order.account_name && order.account_name.toLowerCase().includes(query)) ||
      (order.organization_name && order.organization_name.toLowerCase().includes(query))
    );
  });

  // Ship Orders Screen (Grouped Orders List)
  if (currentScreen === 'Ship') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setCurrentScreen('Dashboard');
            setShipOrdersData([]);
            setGroupedShipOrders([]);
            setShipSearchQuery('');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Ship Orders</Text>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={fetchShipOrders}>
              <Text style={styles.refreshButton}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.shipSearchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by order, account or org..."
              value={shipSearchQuery}
              onChangeText={setShipSearchQuery}
              autoCapitalize="none"
            />
            {shipSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setShipSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.shipStatsContainer}>
          <View style={styles.shipStatBox}>
            <Text style={styles.shipStatValue}>{filteredShipOrders.length}</Text>
            <Text style={styles.shipStatLabel}>Orders</Text>
          </View>
          <View style={styles.shipStatBox}>
            <Text style={styles.shipStatValue}>
              {filteredShipOrders.reduce((sum, o) => sum + o.lines.length, 0)}
            </Text>
            <Text style={styles.shipStatLabel}>Lines</Text>
          </View>
          <View style={styles.shipStatBox}>
            <Text style={styles.shipStatValue}>
              {filteredShipOrders.reduce((sum, o) => sum + o.totalQty, 0).toLocaleString()}
            </Text>
            <Text style={styles.shipStatLabel}>Total Qty</Text>
          </View>
        </View>

        {shipOrdersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : filteredShipOrders.length > 0 ? (
          <FlatList
            data={filteredShipOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.shipOrdersList}
            renderItem={({ item: order }) => (
              <TouchableOpacity
                style={styles.shipOrderCard}
                onPress={() => {
                  setSelectedShipOrder(order);
                  setCurrentScreen('ShipOrderLines');
                }}
              >
                <View style={styles.shipOrderHeader}>
                  <View style={styles.shipOrderInfo}>
                    <Text style={styles.shipOrderNumber}>{order.source_order_number}</Text>
                    <View style={styles.shipBadgeRow}>
                      <View style={styles.orgBadgeSmall}>
                        <Text style={styles.orgBadgeSmallText}>{order.organization_name}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.shipQtyContainer}>
                    <Text style={styles.shipTotalQty}>{order.totalQty}</Text>
                    <Text style={styles.shipQtyLabel}>Qty</Text>
                  </View>
                </View>

                <View style={styles.shipAccountRow}>
                  <Text style={styles.shipAccountIcon}>🏢</Text>
                  <Text style={styles.shipAccountName} numberOfLines={1}>{order.account_name}</Text>
                </View>

                <View style={styles.shipOrderDetails}>
                  <View style={styles.shipDetailItem}>
                    <Text style={styles.shipDetailLabel}>Pick Date</Text>
                    <Text style={styles.shipDetailValue}>
                      {order.pick_release_date ? new Date(order.pick_release_date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.shipDetailItem}>
                    <Text style={styles.shipDetailLabel}>Picker</Text>
                    <Text style={styles.shipDetailValue}>{order.picker_name || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.shipOrderFooter}>
                  <View style={styles.shipLineCountBadge}>
                    <Text style={styles.shipLineCountText}>{order.lines.length} line{order.lines.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={styles.drillDownHint}>Tap to view lines →</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>📤</Text>
            <Text style={styles.emptyStateText}>No pending orders</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchShipOrders}>
              <Text style={styles.retryButtonText}>Refresh Orders</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Ship Order Lines Screen
  if (currentScreen === 'ShipOrderLines' && selectedShipOrder) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setSelectedShipOrder(null);
            setCurrentScreen('Ship');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>Order Lines</Text>
            <Text style={styles.screenSubtitle}>{selectedShipOrder.source_order_number}</Text>
          </View>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            style={styles.shipAllButton}
            onPress={() => handleShipAllLines(selectedShipOrder)}
          >
            <Text style={styles.shipAllButtonText}>📦 Ship All</Text>
          </TouchableOpacity>
        </View>

        {/* Order Summary Card */}
        <View style={styles.shipSummaryCard}>
          <View style={styles.shipSummaryHeader}>
            <Text style={styles.shipSummaryAccount}>{selectedShipOrder.account_name}</Text>
            <View style={styles.orgBadgeSmall}>
              <Text style={styles.orgBadgeSmallText}>{selectedShipOrder.organization_name}</Text>
            </View>
          </View>
          <View style={styles.shipSummaryRow}>
            <View style={styles.shipSummaryItem}>
              <Text style={styles.shipSummaryLabel}>Pick Date</Text>
              <Text style={styles.shipSummaryValue}>
                {selectedShipOrder.pick_release_date ? new Date(selectedShipOrder.pick_release_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={styles.shipSummaryItem}>
              <Text style={styles.shipSummaryLabel}>Picker</Text>
              <Text style={styles.shipSummaryValue}>{selectedShipOrder.picker_name || 'N/A'}</Text>
            </View>
            <View style={styles.shipSummaryItem}>
              <Text style={styles.shipSummaryLabel}>Total Qty</Text>
              <Text style={[styles.shipSummaryValue, { color: COLORS.info }]}>
                {selectedShipOrder.totalQty}
              </Text>
            </View>
          </View>
        </View>

        {/* Lines List Header */}
        <View style={styles.linesListHeader}>
          <Text style={styles.linesListTitle}>Lines ({selectedShipOrder.lines.length})</Text>
        </View>

        {/* Lines List */}
        <FlatList
          data={selectedShipOrder.lines}
          keyExtractor={(item) => item.lineId}
          contentContainerStyle={styles.shipLinesList}
          renderItem={({ item: line }) => (
            <View style={styles.shipLineCard}>
              <View style={styles.shipLineHeader}>
                <View style={styles.shipLineInfo}>
                  <Text style={styles.shipLineItemNumber}>{line.item_number}</Text>
                  <Text style={styles.shipLineDescription} numberOfLines={2}>
                    {line.description}
                  </Text>
                </View>
                <View style={styles.shipLineQtyBox}>
                  <Text style={styles.shipLineQty}>{line.qty}</Text>
                  <Text style={styles.shipLineUom}>{line.ordered_uom}</Text>
                </View>
              </View>

              <View style={styles.shipLineDetails}>
                <View style={styles.shipLineDetailItem}>
                  <Text style={styles.shipLineDetailLabel}>Lot</Text>
                  <Text style={styles.shipLineDetailValue}>{line.lot_number || 'N/A'}</Text>
                </View>
                <View style={styles.shipLineDetailItem}>
                  <Text style={styles.shipLineDetailLabel}>Locator</Text>
                  <Text style={styles.shipLineDetailValue}>{line.locator || 'N/A'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.pickLineButton}
                onPress={() => handlePickLine(line)}
              >
                <Text style={styles.pickLineButtonText}>📋 Pick</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Pick Modal */}
        <Modal
          visible={showPickModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPickModal(false)}
        >
          <View style={styles.pickModalOverlay}>
            <View style={styles.pickModalContainer}>
              <View style={styles.pickModalHeader}>
                <Text style={styles.pickModalTitle}>Pick Item</Text>
                <TouchableOpacity onPress={() => setShowPickModal(false)}>
                  <Text style={styles.pickModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {pickingLine && (
                <View style={styles.pickModalContent}>
                  {/* Item Info */}
                  <View style={styles.pickItemInfo}>
                    <Text style={styles.pickItemNumber}>{pickingLine.item_number}</Text>
                    <Text style={styles.pickItemDesc} numberOfLines={2}>{pickingLine.description}</Text>
                  </View>

                  {/* Lot Number */}
                  <View style={styles.pickFieldRow}>
                    <Text style={styles.pickFieldLabel}>Lot Number</Text>
                    <View style={styles.pickFieldValueBox}>
                      <Text style={styles.pickFieldValue}>{pickingLine.lot_number || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* Requested Qty */}
                  <View style={styles.pickFieldRow}>
                    <Text style={styles.pickFieldLabel}>Requested Qty</Text>
                    <View style={styles.pickFieldValueBox}>
                      <Text style={styles.pickFieldValue}>{pickingLine.qty} {pickingLine.ordered_uom}</Text>
                    </View>
                  </View>

                  {/* Picked Qty */}
                  <View style={styles.pickFieldRow}>
                    <Text style={styles.pickFieldLabel}>Picked Qty</Text>
                    <TextInput
                      style={styles.pickQtyInput}
                      value={pickedQty}
                      onChangeText={setPickedQty}
                      keyboardType="numeric"
                      placeholder="Enter qty"
                    />
                  </View>

                  {/* Serial Number */}
                  <View style={styles.pickFieldRow}>
                    <Text style={styles.pickFieldLabel}>Serial Number</Text>
                    <View style={styles.pickSerialRow}>
                      <TextInput
                        style={styles.pickSerialInput}
                        value={serialNumber}
                        onChangeText={setSerialNumber}
                        placeholder="Enter or scan serial"
                      />
                      <TouchableOpacity
                        style={styles.pickScanButton}
                        onPress={handleScanSerialForPick}
                      >
                        <Text style={styles.pickScanButtonText}>📷</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Buttons */}
                  <View style={styles.pickModalButtons}>
                    <TouchableOpacity
                      style={styles.pickCancelButton}
                      onPress={() => setShowPickModal(false)}
                    >
                      <Text style={styles.pickCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickConfirmButton}
                      onPress={handleConfirmPick}
                    >
                      <Text style={styles.pickConfirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Pick Serial Scanner Screen
  if (currentScreen === 'PickSerialScanner' && pickingLine) {
    if (!permission) {
      return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.screenHeader}>
            <TouchableOpacity onPress={() => {
              setShowPickModal(true);
              setCurrentScreen('ShipOrderLines');
            }}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Scan Serial</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.contentCenter}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderTitle}>Camera Permission Required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" />

        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'datamatrix', 'pdf417'],
          }}
          onBarcodeScanned={scanned ? undefined : (result) => {
            setScanned(true);
            Vibration.vibrate(100);
            setSerialNumber(result.data);
            Alert.alert(
              'Serial Scanned',
              `Serial: ${result.data}`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowPickModal(true);
                    setCurrentScreen('ShipOrderLines');
                  }
                }
              ]
            );
          }}
        />

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerBackButton}
              onPress={() => {
                setShowPickModal(true);
                setCurrentScreen('ShipOrderLines');
              }}
            >
              <Text style={styles.scannerBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Serial Number</Text>
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Text style={styles.torchButtonText}>{torchOn ? '🔦' : '💡'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scannerFrameContainer}>
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCornerTL} />
              <View style={styles.scannerCornerTR} />
              <View style={styles.scannerCornerBL} />
              <View style={styles.scannerCornerBR} />
            </View>
            <Text style={styles.scannerHint}>
              Scan serial number for {pickingLine.item_number}
            </Text>
          </View>

          <View style={styles.scannerControls}>
            <View style={styles.scannerItemInfo}>
              <Text style={styles.scannerItemLabel}>Item:</Text>
              <Text style={styles.scannerItemValue}>{pickingLine.item_number}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Filter grouped lots data
  const filteredGroupedLots = groupedLotsData.filter(item => {
    if (!lotsSearchQuery) return true;
    const query = lotsSearchQuery.toLowerCase();
    return (
      (item.item_number && item.item_number.toLowerCase().includes(query)) ||
      (item.item_description && item.item_description.toLowerCase().includes(query)) ||
      (item.sub_inventory_code && item.sub_inventory_code.toLowerCase().includes(query))
    );
  });

  // Onhand by Lots Screen (Grouped View)
  if (currentScreen === 'OnhandByLots') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setCurrentScreen('Dashboard');
            setLotsData([]);
            setGroupedLotsData([]);
            setLotsSearchQuery('');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Onhand by Lots</Text>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={fetchLotsData}>
              <Text style={styles.refreshButton}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.lotsSearchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by item code or description..."
              value={lotsSearchQuery}
              onChangeText={setLotsSearchQuery}
              autoCapitalize="none"
            />
            {lotsSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setLotsSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.lotsStatsContainer}>
          <View style={styles.lotStatBox}>
            <Text style={styles.lotStatValue}>{filteredGroupedLots.length}</Text>
            <Text style={styles.lotStatLabel}>Items</Text>
          </View>
          <View style={styles.lotStatBox}>
            <Text style={styles.lotStatValue}>
              {filteredGroupedLots.reduce((sum, item) => sum + item.lots.length, 0)}
            </Text>
            <Text style={styles.lotStatLabel}>Lots</Text>
          </View>
          <View style={styles.lotStatBox}>
            <Text style={styles.lotStatValue}>
              {filteredGroupedLots.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}
            </Text>
            <Text style={styles.lotStatLabel}>Total Qty</Text>
          </View>
        </View>

        {lotsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading lots data...</Text>
          </View>
        ) : filteredGroupedLots.length > 0 ? (
          <FlatList
            data={filteredGroupedLots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lotsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.lotItemCard}
                onPress={() => {
                  setSelectedLotItem(item);
                  setCurrentScreen('LotDetails');
                }}
              >
                <View style={styles.lotItemHeader}>
                  <View style={styles.lotItemInfo}>
                    <Text style={styles.lotItemNumber}>{item.item_number}</Text>
                    <View style={styles.lotBadgeRow}>
                      <View style={styles.orgBadgeSmall}>
                        <Text style={styles.orgBadgeSmallText}>{item.organization_code}</Text>
                      </View>
                      <View style={styles.subinvBadge}>
                        <Text style={styles.subinvBadgeText}>{item.sub_inventory_code}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.lotQtyContainer}>
                    <Text style={styles.lotTotalQty}>{item.totalQuantity.toLocaleString()}</Text>
                    <Text style={styles.lotQtyLabel}>Total Qty</Text>
                  </View>
                </View>

                <Text style={styles.lotItemDescription} numberOfLines={2}>
                  {item.item_description}
                </Text>

                <View style={styles.lotItemFooter}>
                  <View style={styles.lotCountBadge}>
                    <Text style={styles.lotCountText}>{item.lots.length} lot{item.lots.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={styles.drillDownHint}>Tap to view lots →</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🏷️</Text>
            <Text style={styles.emptyStateText}>No lots data found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchLotsData}>
              <Text style={styles.retryButtonText}>Fetch Lots Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Lot Details Screen (Individual Lots)
  if (currentScreen === 'LotDetails' && selectedLotItem) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setSelectedLotItem(null);
            setCurrentScreen('OnhandByLots');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>Lot Details</Text>
            <Text style={styles.screenSubtitle}>{selectedLotItem.item_number}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Item Summary Card */}
        <View style={styles.lotSummaryCard}>
          <Text style={styles.lotSummaryTitle}>{selectedLotItem.item_description}</Text>
          <View style={styles.lotSummaryRow}>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Organization</Text>
              <Text style={styles.lotSummaryValue}>{selectedLotItem.organization_code}</Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Subinventory</Text>
              <Text style={styles.lotSummaryValue}>{selectedLotItem.sub_inventory_code}</Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Total Qty</Text>
              <Text style={[styles.lotSummaryValue, { color: COLORS.success }]}>
                {selectedLotItem.totalQuantity.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Lots List */}
        <View style={styles.lotsListHeader}>
          <Text style={styles.lotsListTitle}>Lots ({selectedLotItem.lots.length})</Text>
        </View>

        <FlatList
          data={selectedLotItem.lots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lotDetailsList}
          renderItem={({ item: lot }) => (
            <View style={styles.lotDetailCard}>
              <View style={styles.lotDetailHeader}>
                <View style={styles.lotNumberContainer}>
                  <Text style={styles.lotNumberLabel}>Lot #</Text>
                  <Text style={styles.lotNumberValue}>{lot.lotnumber || 'N/A'}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: lot.materialstatus === 'Active' ? COLORS.successLight : COLORS.warningLight }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: lot.materialstatus === 'Active' ? COLORS.success : COLORS.warning }
                  ]}>
                    {lot.materialstatus || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.lotDetailRow}>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Quantity</Text>
                  <Text style={styles.lotDetailValue}>{lot.primaryquantity || 0}</Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Expiration</Text>
                  <Text style={styles.lotDetailValue}>
                    {lot.expirationdate ? new Date(lot.expirationdate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Instance</Text>
                  <Text style={styles.lotDetailValue}>{lot.instance_name || 'N/A'}</Text>
                </View>
              </View>

              {lot.trx_number && (
                <View style={styles.lotExtraInfo}>
                  <Text style={styles.lotExtraLabel}>Transaction:</Text>
                  <Text style={styles.lotExtraValue}>{lot.trx_number}</Text>
                </View>
              )}

              {/* Serial Numbers Button */}
              <TouchableOpacity
                style={[
                  styles.serialButton,
                  !lot.srno_link && styles.serialButtonDisabled
                ]}
                onPress={() => {
                  if (lot.srno_link) {
                    setSelectedLot(lot);
                    fetchSerialNumbers(lot.srno_link);
                  } else {
                    Alert.alert('Info', 'No serial numbers available for this lot');
                  }
                }}
                disabled={serialLoading}
              >
                {serialLoading && selectedLot?.id === lot.id ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.serialButtonText}>
                      {lot.srno_link ? '🔢 View Serial Numbers' : '🔢 No Serials'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  // Serial Numbers Screen
  if (currentScreen === 'SerialNumbers' && selectedLot) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => {
            setSerialNumbers([]);
            setSelectedLot(null);
            setCurrentScreen('LotDetails');
          }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>Serial Numbers</Text>
            <Text style={styles.screenSubtitle}>Lot: {selectedLot.lotnumber}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Lot Info */}
        <View style={styles.serialLotInfo}>
          <Text style={styles.serialLotItem}>{selectedLotItem?.item_number}</Text>
          <Text style={styles.serialLotDesc}>{selectedLotItem?.item_description}</Text>
        </View>

        {serialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading serial numbers...</Text>
          </View>
        ) : serialNumbers.length > 0 ? (
          <FlatList
            data={serialNumbers}
            keyExtractor={(item, index) => `serial-${index}`}
            contentContainerStyle={styles.serialList}
            renderItem={({ item: serial, index }) => (
              <View style={styles.serialCard}>
                <View style={styles.serialCardHeader}>
                  <View style={styles.serialIndexBadge}>
                    <Text style={styles.serialIndexText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.serialNumber}>
                    {serial.SerialNumber || serial.serialNumber || serial.serial_number || `Serial ${index + 1}`}
                  </Text>
                </View>
                {serial.Status && (
                  <View style={styles.serialDetailRow}>
                    <Text style={styles.serialDetailLabel}>Status:</Text>
                    <Text style={styles.serialDetailValue}>{serial.Status}</Text>
                  </View>
                )}
                {serial.CurrentOrganizationId && (
                  <View style={styles.serialDetailRow}>
                    <Text style={styles.serialDetailLabel}>Org ID:</Text>
                    <Text style={styles.serialDetailValue}>{serial.CurrentOrganizationId}</Text>
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🔢</Text>
            <Text style={styles.emptyStateText}>No serial numbers found</Text>
            <Text style={styles.emptyStateHint}>This lot may not have serialized items</Text>
          </View>
        )}
      </View>
    );
  }

  return null;
}

// ============= ORACLE REDWOOD STYLES =============

const styles = StyleSheet.create({
  // Base Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ========== LOGIN SCREEN ==========
  loginTopSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: 32,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    alignItems: 'center',
  },
  loginLogoContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  loginLogoIcon: {
    fontSize: 24,
  },
  loginTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  loginSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.9,
  },
  loginFormContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    marginTop: -20,
  },
  loginCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  loginCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    color: COLORS.neutral900,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  loginHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },

  // ========== MODAL STYLES ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 30, 28, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  orgScrollView: {
    maxHeight: 400,
  },
  orgButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral200,
  },
  orgButtonText: {
    color: COLORS.neutral900,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  orgButtonArrow: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },

  // ========== DASHBOARD HEADER ==========
  dashboardHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    marginLeft: SPACING.md,
  },
  menuIcon: {
    fontSize: 26,
    color: COLORS.white,
  },
  dashboardGreeting: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.85,
  },
  dashboardUserName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  orgBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
  },
  orgBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  notificationIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  notificationIconSmall: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },

  // ========== HAMBURGER MENU ==========
  hamburgerMenu: {
    position: 'absolute',
    top: 110,
    left: 0,
    backgroundColor: COLORS.surface,
    width: 280,
    borderTopRightRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    zIndex: 1000,
    ...SHADOWS.lg,
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  menuUserName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  menuUserRole: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    marginTop: 2,
  },
  menuOrgText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  menuItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral50,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral700,
    fontWeight: '500',
  },

  // ========== DASHBOARD CONTENT ==========
  dashboardContent: {
    flex: 1,
  },
  orgDisplayContainer: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  orgDisplayLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    marginRight: SPACING.sm,
  },
  orgDisplayValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardGrid: {
    padding: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    width: '48%',
    minHeight: 160,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    lineHeight: 18,
  },

  // ========== BOTTOM NAVIGATION ==========
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  navIcon: {
    fontSize: 24,
  },
  navText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },

  // ========== SCREEN HEADER ==========
  screenHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: 6,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  screenSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.85,
    marginLeft: SPACING.md,
  },
  headerCenter: {
    marginLeft: SPACING.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerOrgText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    fontWeight: '600',
  },
  refreshButton: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },

  // ========== STATS CONTAINER ==========
  statsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
    fontWeight: '500',
  },

  // ========== PO LIST ==========
  poList: {
    padding: SPACING.md,
  },
  poCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  poCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  poNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  itemCountText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  poCardSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
  },

  // ========== ITEMS LIST ==========
  itemsList: {
    padding: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    flex: 1,
  },
  itemQty: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  itemDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    marginBottom: SPACING.xs,
  },
  itemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.neutral50,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },

  // ========== ITEM DETAIL ==========
  detailContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  detailTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral900,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: COLORS.info,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  // ========== SCANNER ==========
  scannerContainer: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 36,
    paddingHorizontal: SPACING.md,
    paddingBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerBackButton: {
    padding: SPACING.sm,
  },
  scannerBackText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  scannerTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  scannerFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.md,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
    borderTopRightRadius: RADIUS.md,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 60,
    height: 60,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.md,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
    borderBottomRightRadius: RADIUS.md,
  },
  scannedIndicator: {
    backgroundColor: COLORS.success,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedCheckmark: {
    fontSize: 48,
    color: COLORS.white,
  },
  scannerHint: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    fontWeight: '500',
    overflow: 'hidden',
  },
  scannerControls: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  scannerItemInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  scannerItemLabel: {
    color: COLORS.neutral300,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  scannerItemValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  rescanButton: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  rescanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  scannerIcon: {
    fontSize: 64,
  },
  scannerInstructions: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    fontWeight: '500',
    textAlign: 'center',
  },
  permissionHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral300,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  simulateButton: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  simulateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  cancelScanButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelScanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  torchButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButtonText: {
    fontSize: 24,
  },

  // ========== LOADING ==========
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral500,
    marginTop: SPACING.md,
    fontWeight: '500',
  },

  // ========== EMPTY STATE ==========
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral500,
    marginBottom: SPACING.lg,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  // ========== PLACEHOLDER ==========
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral500,
  },

  // ========== INVENTORY ONHAND ==========
  searchSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
  },
  searchIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral900,
  },
  clearIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral400,
    paddingLeft: SPACING.xs,
  },
  fetchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  fetchButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  scanSearchButton: {
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  scanSearchButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    maxHeight: 200,
    ...SHADOWS.md,
  },
  suggestionItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral700,
  },
  parameterModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
  },
  modalCancelText: {
    color: COLORS.neutral600,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  modalFetchButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.sm,
  },
  modalFetchText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  resultsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  onhandList: {
    padding: SPACING.md,
  },
  onhandCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  onhandCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  onhandItemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    flex: 1,
  },
  qohBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  qohText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  onhandDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  onhandDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  onhandDetailItem: {
    flex: 1,
  },
  onhandDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
    fontWeight: '500',
  },
  onhandDetailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral900,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyStateHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ========== ONHAND BY LOTS ==========
  lotsSearchContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsStatsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotStatBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  lotStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lotStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
    fontWeight: '500',
  },
  lotsList: {
    padding: SPACING.md,
  },
  lotItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  lotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  lotItemInfo: {
    flex: 1,
  },
  lotItemNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.neutral900,
    marginBottom: SPACING.xs,
  },
  lotBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  orgBadgeSmall: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  orgBadgeSmallText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  subinvBadge: {
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  subinvBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.info,
  },
  lotQtyContainer: {
    alignItems: 'flex-end',
  },
  lotTotalQty: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.success,
  },
  lotQtyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
  },
  lotItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  lotItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  lotCountBadge: {
    backgroundColor: COLORS.neutral100,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  lotCountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral600,
  },
  drillDownHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // ========== LOT DETAILS ==========
  lotSummaryCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  lotSummaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.md,
  },
  lotSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lotSummaryItem: {
    flex: 1,
  },
  lotSummaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  lotSummaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  lotsListHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.neutral50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsListTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  lotDetailsList: {
    padding: SPACING.md,
  },
  lotDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  lotDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lotNumberContainer: {
    flex: 1,
  },
  lotNumberLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  lotNumberValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.neutral900,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  lotDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  lotDetailItem: {
    flex: 1,
  },
  lotDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  lotDetailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  lotExtraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  lotExtraLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginRight: SPACING.xs,
  },
  lotExtraValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  serialButton: {
    backgroundColor: COLORS.info,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  serialButtonDisabled: {
    backgroundColor: COLORS.neutral300,
  },
  serialButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // ========== SERIAL NUMBERS ==========
  serialLotInfo: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  serialLotItem: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  serialLotDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
  },
  serialList: {
    padding: SPACING.md,
  },
  serialCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  serialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  serialIndexBadge: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  serialIndexText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  serialNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
    flex: 1,
  },
  serialDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  serialDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginRight: SPACING.xs,
  },
  serialDetailValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral700,
  },

  // ========== SHIP ORDERS ==========
  shipSearchContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  shipStatsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  shipStatBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  shipStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.info,
  },
  shipStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
    fontWeight: '500',
  },
  shipOrdersList: {
    padding: SPACING.sm,
  },
  shipOrderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  shipOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  shipOrderInfo: {
    flex: 1,
  },
  shipOrderNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.neutral900,
    marginBottom: 4,
  },
  shipBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  shipQtyContainer: {
    alignItems: 'flex-end',
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  shipTotalQty: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.info,
  },
  shipQtyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
  },
  shipAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  shipAccountIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  shipAccountName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
    flex: 1,
  },
  shipOrderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  shipDetailItem: {
    flex: 1,
  },
  shipDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  shipDetailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.neutral700,
  },
  shipOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  shipLineCountBadge: {
    backgroundColor: COLORS.neutral100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  shipLineCountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral600,
  },

  // ========== SHIP ORDER LINES ==========
  shipAllButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  shipAllButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  shipSummaryCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    ...SHADOWS.sm,
  },
  shipSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shipSummaryAccount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral900,
    flex: 1,
  },
  shipSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shipSummaryItem: {
    flex: 1,
  },
  shipSummaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  shipSummaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  linesListHeader: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.neutral50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  linesListTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  shipLinesList: {
    padding: SPACING.sm,
  },
  shipLineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  shipLineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  shipLineInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  shipLineItemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.neutral900,
    marginBottom: 4,
  },
  shipLineDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral600,
    lineHeight: 16,
  },
  shipLineQtyBox: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 50,
  },
  shipLineQty: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.success,
  },
  shipLineUom: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  shipLineDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  shipLineDetailItem: {
    flex: 1,
  },
  shipLineDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginBottom: 2,
  },
  shipLineDetailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.neutral700,
  },
  shipLineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  shipLineButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // ========== PICK LINE ==========
  pickLineButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  pickLineButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },

  // ========== PICK MODAL ==========
  pickModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  pickModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  pickModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  pickModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  pickModalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: '600',
  },
  pickModalContent: {
    padding: SPACING.md,
  },
  pickItemInfo: {
    backgroundColor: COLORS.neutral50,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  pickItemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  pickItemDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
  },
  pickFieldRow: {
    marginBottom: SPACING.md,
  },
  pickFieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
    marginBottom: 6,
  },
  pickFieldValueBox: {
    backgroundColor: COLORS.neutral100,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  pickFieldValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  pickQtyInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  pickSerialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pickSerialInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral900,
  },
  pickScanButton: {
    backgroundColor: COLORS.info,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickScanButtonText: {
    fontSize: 20,
  },
  pickModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  pickCancelButton: {
    flex: 1,
    backgroundColor: COLORS.neutral200,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  pickCancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  pickConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  pickConfirmButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
