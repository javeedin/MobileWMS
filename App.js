import React, { useState, useEffect } from 'react';
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
  Dimensions,
  RefreshControl,
} from 'react-native';

const { width } = Dimensions.get('window');

// Constants
const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  secondary: '#7c3aed',
  secondaryLight: '#8b5cf6',
  success: '#10b981',
  successLight: '#34d399',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  danger: '#ef4444',
  dangerLight: '#f87171',
  dark: '#1f2937',
  light: '#f3f4f6',
  white: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  backgroundDark: '#f3f4f6',
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
  inventoryColor: '#3b82f6',
  receiveColor: '#10b981',
  shipColor: '#f59e0b',
  scanColor: '#8b5cf6',
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
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// API Configuration
const API_BASE = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY';
const API_URL = `${API_BASE}/PUTAWAYDETAILS?PICKER_NAME=PICKER1`;

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

  // KPI state
  const [kpiData, setKpiData] = useState({
    totalPOs: 0,
    pendingItems: 0,
    inventoryItems: 0,
    lowStock: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch KPIs when organization is selected
  useEffect(() => {
    if (selectedOrg && isLoggedIn) {
      fetchKPIs();
    }
  }, [selectedOrg, isLoggedIn]);

  // Fetch KPI data from web services
  const fetchKPIs = async () => {
    setKpiLoading(true);
    try {
      // Fetch PO data for KPIs
      const poResponse = await fetch(API_URL);
      const poJson = await poResponse.json();
      const poItems = poJson.items || [];

      // Calculate PO KPIs
      const uniquePOs = [...new Set(poItems.map(item => item.documentnumber))];

      // Fetch Inventory data for KPIs
      let inventoryCount = 0;
      let lowStockCount = 0;

      try {
        const invUrl = `${API_BASE}/getonhand?orgainzation_code=${selectedOrg}`;
        const invResponse = await fetch(invUrl);
        const invJson = await invResponse.json();
        const invItems = invJson.items || [];
        inventoryCount = invItems.length;
        lowStockCount = invItems.filter(item => (item.qoh || 0) < 10).length;
      } catch (e) {
        console.log('Inventory fetch error:', e);
      }

      setKpiData({
        totalPOs: uniquePOs.length,
        pendingItems: poItems.length,
        inventoryItems: inventoryCount,
        lowStock: lowStockCount,
      });
    } catch (error) {
      console.log('KPI fetch error:', error);
    } finally {
      setKpiLoading(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKPIs();
    setRefreshing(false);
  };

  // Handle Login
  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setUser({ name: username, username: username });
      setIsLoggedIn(true);
      setShowOrgModal(true);
    } else {
      Alert.alert('Error', 'Invalid credentials');
    }
  };

  // Handle Organization Selection
  const handleOrgSelection = (org) => {
    setSelectedOrg(org);
    setShowOrgModal(false);
    setCurrentScreen('Home');
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setSelectedOrg(null);
    setCurrentScreen('Login');
    setUsername('admin');
    setPassword('admin123');
    setKpiData({ totalPOs: 0, pendingItems: 0, inventoryItems: 0, lowStock: 0 });
  };

  // Fetch Purchase Orders
  const fetchPOData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

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
      let url = `${API_BASE}/getonhand?orgainzation_code=${searchOrgCode}`;

      if (searchSubinventory) {
        url += `&subinventory=${searchSubinventory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

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

  // Handle unified search with autocomplete
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length > 1 && onhandData.length > 0) {
      const suggestions = [];
      const seen = new Set();

      onhandData.forEach(item => {
        if (item.itemnumber && item.itemnumber.toLowerCase().includes(text.toLowerCase()) && !seen.has(item.itemnumber)) {
          suggestions.push({
            type: 'code',
            value: item.itemnumber,
            display: `${item.itemnumber} - ${item.itemdescription || 'No description'}`
          });
          seen.add(item.itemnumber);
        }
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

  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
  };

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

  // ============= NEW HOME PAGE =============
  if (currentScreen === 'Home') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Beautiful Header */}
        <View style={styles.homeHeader}>
          <View style={styles.homeHeaderContent}>
            <View style={styles.homeHeaderLeft}>
              <Text style={styles.homeGreeting}>Welcome back,</Text>
              <Text style={styles.homeUserName}>{user?.name || 'User'}</Text>
              <View style={styles.homeOrgBadge}>
                <Text style={styles.homeOrgText}>{selectedOrg}</Text>
              </View>
            </View>
            <View style={styles.homeHeaderRight}>
              <TouchableOpacity
                style={styles.homeHeaderIcon}
                onPress={() => Alert.alert('Notifications', 'No new notifications')}
              >
                <Text style={styles.headerIconText}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.homeHeaderIcon}
                onPress={handleLogout}
              >
                <Text style={styles.headerIconText}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.homeContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* KPI Section */}
          <View style={styles.kpiSection}>
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>

            {kpiLoading ? (
              <View style={styles.kpiLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.kpiLoadingText}>Loading KPIs...</Text>
              </View>
            ) : (
              <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: COLORS.inventoryColor }]}>
                  <View style={styles.kpiIconContainer}>
                    <Text style={styles.kpiIcon}>📋</Text>
                  </View>
                  <Text style={styles.kpiValue}>{kpiData.totalPOs}</Text>
                  <Text style={styles.kpiLabel}>Purchase Orders</Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: COLORS.receiveColor }]}>
                  <View style={styles.kpiIconContainer}>
                    <Text style={styles.kpiIcon}>📦</Text>
                  </View>
                  <Text style={styles.kpiValue}>{kpiData.pendingItems}</Text>
                  <Text style={styles.kpiLabel}>Pending Items</Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: COLORS.secondary }]}>
                  <View style={styles.kpiIconContainer}>
                    <Text style={styles.kpiIcon}>🏭</Text>
                  </View>
                  <Text style={styles.kpiValue}>{kpiData.inventoryItems}</Text>
                  <Text style={styles.kpiLabel}>Inventory Items</Text>
                </View>

                <View style={[styles.kpiCard, { backgroundColor: COLORS.warning }]}>
                  <View style={styles.kpiIconContainer}>
                    <Text style={styles.kpiIcon}>⚠️</Text>
                  </View>
                  <Text style={styles.kpiValue}>{kpiData.lowStock}</Text>
                  <Text style={styles.kpiLabel}>Low Stock Alerts</Text>
                </View>
              </View>
            )}
          </View>

          {/* Modules Section */}
          <View style={styles.modulesSection}>
            <Text style={styles.sectionTitle}>Modules</Text>

            <View style={styles.modulesGrid}>
              {/* Inventory Module */}
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => setCurrentScreen('InventoryModule')}
              >
                <View style={[styles.moduleIconContainer, { backgroundColor: COLORS.inventoryColor }]}>
                  <Text style={styles.moduleIcon}>📦</Text>
                </View>
                <Text style={styles.moduleTitle}>Inventory</Text>
                <Text style={styles.moduleDescription}>Manage stock, view onhand quantities, and track items</Text>
                <View style={styles.moduleArrow}>
                  <Text style={styles.moduleArrowText}>→</Text>
                </View>
              </TouchableOpacity>

              {/* Receiving Module */}
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => {
                  setCurrentScreen('ReceiveGoods');
                  fetchPOData();
                }}
              >
                <View style={[styles.moduleIconContainer, { backgroundColor: COLORS.receiveColor }]}>
                  <Text style={styles.moduleIcon}>📥</Text>
                </View>
                <Text style={styles.moduleTitle}>Receiving</Text>
                <Text style={styles.moduleDescription}>Process incoming shipments and putaway operations</Text>
                <View style={styles.moduleArrow}>
                  <Text style={styles.moduleArrowText}>→</Text>
                </View>
              </TouchableOpacity>

              {/* Shipping Module */}
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => setCurrentScreen('Ship')}
              >
                <View style={[styles.moduleIconContainer, { backgroundColor: COLORS.shipColor }]}>
                  <Text style={styles.moduleIcon}>📤</Text>
                </View>
                <Text style={styles.moduleTitle}>Shipping</Text>
                <Text style={styles.moduleDescription}>Process outgoing orders and manage shipments</Text>
                <View style={styles.moduleArrow}>
                  <Text style={styles.moduleArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setCurrentScreen('Scanner')}
              >
                <Text style={styles.quickActionIcon}>📷</Text>
                <Text style={styles.quickActionText}>Scan Item</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  setSearchOrgCode(selectedOrg || '');
                  setCurrentScreen('Inventory');
                }}
              >
                <Text style={styles.quickActionIcon}>🔍</Text>
                <Text style={styles.quickActionText}>Search</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={onRefresh}
              >
                <Text style={styles.quickActionIcon}>🔄</Text>
                <Text style={styles.quickActionText}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Settings', 'Settings coming soon')}
              >
                <Text style={styles.quickActionIcon}>⚙️</Text>
                <Text style={styles.quickActionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('InventoryModule')}>
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

  // ============= INVENTORY MODULE (Contains the old menu) =============
  if (currentScreen === 'InventoryModule') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.inventoryColor} />

        {/* Header */}
        <View style={[styles.moduleHeader, { backgroundColor: COLORS.inventoryColor }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.moduleHeaderCenter}>
            <Text style={styles.moduleHeaderTitle}>Inventory Module</Text>
            <Text style={styles.moduleHeaderSubtitle}>{selectedOrg}</Text>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={styles.notificationIconSmall}>🔔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.moduleContent}>
          {/* Module Menu Cards */}
          <View style={styles.moduleMenuGrid}>
            {/* Inventory Onhand */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => {
                setSearchOrgCode(selectedOrg || '');
                setCurrentScreen('Inventory');
              }}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.moduleMenuIcon}>📦</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Inventory Onhand</Text>
              <Text style={styles.moduleMenuDescription}>View and search inventory quantities</Text>
            </TouchableOpacity>

            {/* Scan Item */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => setCurrentScreen('Scanner')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.moduleMenuIcon}>📷</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Scan Item</Text>
              <Text style={styles.moduleMenuDescription}>Scan barcode to view item details</Text>
            </TouchableOpacity>

            {/* Stock Counts */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Stock Counts feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.moduleMenuIcon}>📊</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Stock Counts</Text>
              <Text style={styles.moduleMenuDescription}>Perform cycle counts and adjustments</Text>
            </TouchableOpacity>

            {/* Transfer Orders */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Transfer Orders feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.moduleMenuIcon}>🔄</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Transfer Orders</Text>
              <Text style={styles.moduleMenuDescription}>Move inventory between locations</Text>
            </TouchableOpacity>

            {/* Item Inquiry */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => {
                setSearchOrgCode(selectedOrg || '');
                setCurrentScreen('Inventory');
              }}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.moduleMenuIcon}>🔍</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Item Inquiry</Text>
              <Text style={styles.moduleMenuDescription}>Search and view item information</Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Reports feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#e0e7ff' }]}>
                <Text style={styles.moduleMenuIcon}>📈</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Reports</Text>
              <Text style={styles.moduleMenuDescription}>View inventory reports and analytics</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => setCurrentScreen('InventoryModule')}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Inventory</Text>
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.receiveColor} />

        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: COLORS.receiveColor }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Purchase Orders</Text>
          <View style={styles.headerRight}>
            {selectedOrg && <Text style={styles.headerOrgText}>{selectedOrg}</Text>}
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
            <ActivityIndicator size="large" color={COLORS.receiveColor} />
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
                  <View style={[styles.itemCountBadge, { backgroundColor: COLORS.receiveColor }]}>
                    <Text style={styles.itemCountText}>{item.itemCount} items</Text>
                  </View>
                </View>
                <Text style={styles.poCardSubtext}>Vendor: {item.vendorname}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No purchase orders found</Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.receiveColor }]} onPress={fetchPOData}>
                  <Text style={styles.retryButtonText}>Fetch Purchase Orders</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('InventoryModule')}>
            <Text style={styles.navIcon}>📦</Text>
            <Text style={styles.navText}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => { setCurrentScreen('ReceiveGoods'); fetchPOData(); }}>
            <Text style={styles.navIcon}>📥</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Scanner')}>
            <Text style={styles.navIcon}>📷</Text>
            <Text style={styles.navText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PO Items Screen
  if (currentScreen === 'POItems' && selectedPO) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.receiveColor} />

        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: COLORS.receiveColor }]}>
          <TouchableOpacity onPress={() => { setSelectedPO(null); setCurrentScreen('ReceiveGoods'); }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.screenTitle}>PO Items</Text>
            <Text style={styles.screenSubtitle}>PO: {selectedPO.documentnumber}</Text>
          </View>
          <View style={styles.headerRight}>
            {selectedOrg && <Text style={styles.headerOrgText}>{selectedOrg}</Text>}
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
            setCurrentScreen(selectedItem ? 'ItemDetail' : 'Home');
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.inventoryColor} />

        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: COLORS.inventoryColor }]}>
          <TouchableOpacity onPress={() => {
            setCurrentScreen('InventoryModule');
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
              style={[styles.fetchButton, { backgroundColor: COLORS.inventoryColor }]}
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
                  style={[styles.modalFetchButton, { backgroundColor: COLORS.inventoryColor }]}
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
            <ActivityIndicator size="large" color={COLORS.inventoryColor} />
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
            <Text style={styles.emptyStateHint}>Enter search parameters above and tap Fetch</Text>
          </View>
        )}
      </View>
    );
  }

  // Scanner Screen
  if (currentScreen === 'Scanner') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.scanColor} />

        <View style={[styles.screenHeader, { backgroundColor: COLORS.scanColor }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')}>
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.shipColor} />

        <View style={[styles.screenHeader, { backgroundColor: COLORS.shipColor }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('Home')}>
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

// ============= STYLES =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },

  // Login Styles
  loginTopSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 80,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  loginLogoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loginLogoIcon: {
    fontSize: 40,
  },
  loginTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  loginSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.9,
  },
  loginFormContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    marginTop: -40,
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loginCardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  loginHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  orgScrollView: {
    maxHeight: 400,
  },
  orgButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  orgButtonArrow: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },

  // ============= NEW HOME PAGE STYLES =============
  homeHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  homeHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  homeHeaderLeft: {
    flex: 1,
  },
  homeGreeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  homeUserName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  homeOrgBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  homeOrgText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  homeHeaderRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  homeHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 20,
  },
  homeContent: {
    flex: 1,
  },

  // KPI Section
  kpiSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  kpiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  kpiLoadingText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    minHeight: 120,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  kpiIcon: {
    fontSize: 20,
  },
  kpiValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  kpiLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },

  // Modules Section
  modulesSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  modulesGrid: {
    gap: SPACING.md,
  },
  moduleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  moduleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  moduleIcon: {
    fontSize: 28,
  },
  moduleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  moduleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 2,
    marginRight: SPACING.sm,
  },
  moduleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleArrowText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },

  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    width: '23%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // ============= INVENTORY MODULE STYLES =============
  moduleHeader: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleHeaderCenter: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  moduleHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  moduleHeaderSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  moduleContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  moduleMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleMenuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '48%',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 140,
  },
  moduleMenuIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  moduleMenuIcon: {
    fontSize: 24,
  },
  moduleMenuTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  moduleMenuDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  navIcon: {
    fontSize: 24,
  },
  navText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Screen Header
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
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    marginLeft: SPACING.md,
  },
  screenSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
  refreshButton: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  notificationIconSmall: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },

  // Stats Container
  statsContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // PO List
  poList: {
    padding: SPACING.md,
  },
  poCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  poCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  poNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  itemCountText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  poCardSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Items List
  itemsList: {
    padding: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  itemQty: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  itemDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  // Item Detail
  detailContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  detailTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },

  // Scanner
  scannerContainer: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.white,
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.white,
  },
  scannerIcon: {
    fontSize: 60,
  },
  scannerInstructions: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: SPACING.md,
    borderRadius: 8,
  },
  simulateButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    marginTop: SPACING.xl,
  },
  simulateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  cancelScanButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    marginTop: SPACING.md,
  },
  cancelScanButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },

  // Empty State
  emptyContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },

  // Placeholder
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Inventory Onhand Styles
  searchSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    paddingLeft: SPACING.xs,
  },
  fetchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  fetchButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: SPACING.xs,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  parameterModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  modalFetchButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: SPACING.md,
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  modalFetchText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  onhandList: {
    padding: SPACING.md,
  },
  onhandCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  onhandCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  onhandItemNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  qohBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  qohText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  onhandDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  onhandDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  onhandDetailItem: {
    flex: 1,
  },
  onhandDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  onhandDetailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    fontSize: 60,
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
