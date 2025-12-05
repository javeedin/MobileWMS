import React, { useState } from 'react';
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
} from 'react-native';

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
  const [scannedLocator, setScannedLocator] = useState('');

  // Inventory Onhand state
  const [onhandData, setOnhandData] = useState([]);
  const [onhandLoading, setOnhandLoading] = useState(false);
  const [searchOrgCode, setSearchOrgCode] = useState('');
  const [searchSubinventory, setSearchSubinventory] = useState('');
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  // Handle barcode scan
  const handleScanLocator = (item) => {
    setScanningForItem(item);
    setCurrentScreen('BarcodeScanner');
  };

  const simulateScan = () => {
    const mockLocator = `LOC-${Math.floor(Math.random() * 1000)}`;
    setScannedLocator(mockLocator);

    // Update item with scanned locator
    if (scanningForItem) {
      const updatedItem = { ...scanningForItem, actualLocator: mockLocator };
      setSelectedItem(updatedItem);
    }

    Alert.alert(
      'Scanned Successfully',
      `Locator: ${mockLocator}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setCurrentScreen('ItemDetail');
            setScanningForItem(null);
          },
        },
      ]
    );
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
              onPress={() => setCurrentScreen('Ship')}
            >
              <Text style={styles.cardIcon}>📤</Text>
              <Text style={styles.cardTitle}>Ship Orders</Text>
              <Text style={styles.cardDescription}>Process outgoing orders</Text>
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
    return (
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

        {/* Scanner Frame */}
        <View style={styles.scannerFrame}>
          <View style={styles.scannerCornerTL} />
          <View style={styles.scannerCornerTR} />
          <View style={styles.scannerCornerBL} />
          <View style={styles.scannerCornerBR} />
          <Text style={styles.scannerIcon}>📷</Text>
        </View>

        <Text style={styles.scannerInstructions}>
          {scanningForItem ? 'Scan Pallet Locator' : 'Point camera at barcode'}
        </Text>

        {/* Simulate Scan Button */}
        <TouchableOpacity style={styles.simulateButton} onPress={simulateScan}>
          <Text style={styles.simulateButtonText}>🎲 Simulate Scan (Testing)</Text>
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
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setCurrentScreen('Scanner')}>
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

  // Ship Screen
  if (currentScreen === 'Ship') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => setCurrentScreen('Dashboard')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Ship Orders</Text>
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={styles.notificationIconSmall}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentCenter}>
          <Text style={styles.placeholderIcon}>📤</Text>
          <Text style={styles.placeholderTitle}>Ship Orders</Text>
          <Text style={styles.placeholderText}>Coming soon...</Text>
        </View>
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
    paddingTop: 70,
    paddingBottom: 90,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    alignItems: 'center',
  },
  loginLogoContainer: {
    width: 88,
    height: 88,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  loginLogoIcon: {
    fontSize: 44,
  },
  loginTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  loginSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '400',
  },
  loginFormContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    marginTop: -50,
  },
  loginCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  loginCardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.neutral900,
    marginBottom: SPACING.lg,
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
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
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
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    marginLeft: SPACING.md,
  },
  screenSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.85,
    marginLeft: SPACING.md,
  },
  headerCenter: {
    flex: 1,
    marginLeft: SPACING.md,
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
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
    marginTop: SPACING.xs,
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
  scannerFrame: {
    width: 260,
    height: 260,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
    borderTopLeftRadius: RADIUS.md,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
    borderTopRightRadius: RADIUS.md,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.md,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.primary,
    borderBottomRightRadius: RADIUS.md,
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
  },
  simulateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xl,
    ...SHADOWS.md,
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
});
