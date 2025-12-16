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
  RefreshControl,
  BackHandler,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';

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

  // Module Colors
  inventoryColor: '#0572CE',     // Blue for Inventory
  receiveColor: '#107F47',       // Green for Receiving
  shipColor: '#6366f1',          // Purple for Shipping
  orderColor: '#D4820A',         // Amber for Orders
  crmColor: '#C74634',           // Red for CRM
  scanColor: '#312D2A',          // Charcoal for Scanner
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

// App Version
const APP_VERSION = 'v1.5.4';

// API Configuration
const API_BASE = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY';
const API_URL = `${API_BASE}/PUTAWAYDETAILS?PICKER_NAME=PICKER1`;

// Oracle Fusion API Configuration
const ORACLE_FUSION_BASE = 'https://iacney-test.fa.ocs.oraclecloud.com/fscmRestApi/resources/11.13.18.05';
const ORACLE_FUSION_AUTH = btoa('javeed:Fusion@1234'); // Base64 encode for Basic Auth

export default function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('PICKER1');
  const [password, setPassword] = useState('12345');
  const [user, setUser] = useState(null);

  // Organization state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const organizations = ['AMS', 'MLCECLAIM'];

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigate with history tracking
  const navigateTo = (screen) => {
    setNavigationHistory(prev => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // Go back to previous screen
  const goBack = () => {
    // Case 1: Clear temp selected locators when leaving ItemDetail screen
    if (currentScreen === 'ItemDetail') {
      setSelectedLocatorsTemp(new Set());
      console.log('Cleared temp selected locators (left ItemDetail screen)');
    }

    setNavigationHistory(prev => {
      if (prev.length > 0) {
        const prevScreen = prev[prev.length - 1];

        // Clear selection states when going back to parent screens
        if (prevScreen === 'ReceiveGoods') {
          setSelectedPO(null);
          setSelectedItem(null);
        } else if (prevScreen === 'POItems') {
          setSelectedItem(null);
        } else if (prevScreen === 'Ship') {
          setSelectedShipOrder(null);
        }

        setCurrentScreen(prevScreen);
        return prev.slice(0, -1);
      } else {
        // No history, go to Home and clear all selections
        setSelectedPO(null);
        setSelectedItem(null);
        setSelectedShipOrder(null);
        setCurrentScreen('Home');
        return [];
      }
    });
  };

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

  // Onhand by Lots - Tab and Filter state
  const [lotsActiveTab, setLotsActiveTab] = useState('byItem'); // byItem, byLot, byLocator
  const [lotsSelectedOrg, setLotsSelectedOrg] = useState(null);
  const [lotsOrgFilter, setLotsOrgFilter] = useState('');
  const [lotsProductFilter, setLotsProductFilter] = useState('');
  const [showLotsOrgDropdown, setShowLotsOrgDropdown] = useState(false);
  const [showLotsProductDropdown, setShowLotsProductDropdown] = useState(false);
  const [groupedByLot, setGroupedByLot] = useState([]);
  const [groupedByLocator, setGroupedByLocator] = useState([]);
  const [selectedLocatorGroup, setSelectedLocatorGroup] = useState(null);
  const [selectedLotGroup, setSelectedLotGroup] = useState(null);

  // Organizations list (cached)
  const [organizationsList, setOrganizationsList] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);

  // Stock Locators state
  const [stockLocatorsTab, setStockLocatorsTab] = useState('all'); // 'all' or 'available'
  const [fusionLocators, setFusionLocators] = useState([]); // From Oracle Fusion
  const [onhandLocators, setOnhandLocators] = useState([]); // From getonhandsbylocator
  const [mappedLocators, setMappedLocators] = useState([]); // Combined with Used/Free status
  const [locatorsLoading, setLocatorsLoading] = useState(false);
  const [locatorSearchQuery, setLocatorSearchQuery] = useState('');
  const [selectedLocatorDetail, setSelectedLocatorDetail] = useState(null); // For drill-down
  const [locatorSubinventory, setLocatorSubinventory] = useState('AMKE'); // Default subinventory
  // Segment filter state
  const [segmentFilters, setSegmentFilters] = useState({ seg1: '', seg2: '', seg3: '' });
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(null); // 'seg1', 'seg2', 'seg3' or null
  const [searchExpanded, setSearchExpanded] = useState(false); // Collapsible search section - start collapsed

  // Selected warehouse and subinventory for org selection
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedSubinventory, setSelectedSubinventory] = useState(null);

  // Locator data from separate API
  const [locatorData, setLocatorData] = useState([]);
  const [locatorLoading, setLocatorLoading] = useState(false);

  // Locator visualization modal
  const [showLocatorModal, setShowLocatorModal] = useState(false);
  const [selectedLocatorForView, setSelectedLocatorForView] = useState(null);

  // Global Locator View state
  const [locatorDrillPath, setLocatorDrillPath] = useState([]); // ['AREA', 'BIN', ...]
  const [locatorHierarchy, setLocatorHierarchy] = useState(null);

  // Ship Orders state
  const [shipOrdersData, setShipOrdersData] = useState([]);
  const [shipOrdersLoading, setShipOrdersLoading] = useState(false);
  const [groupedShipOrders, setGroupedShipOrders] = useState([]);

  // Data Flow Diagram state
  const [flowStep, setFlowStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim1 = useRef(new Animated.Value(0)).current;
  const arrowAnim2 = useRef(new Animated.Value(0)).current;
  const arrowAnim3 = useRef(new Animated.Value(0)).current;
  const arrowAnim4 = useRef(new Animated.Value(0)).current;
  const arrowAnim5 = useRef(new Animated.Value(0)).current;

  // Data Flow Diagram pulse animation effect
  useEffect(() => {
    if (isAnimating && currentScreen === 'DataFlowDiagram') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnimating, flowStep, currentScreen]);
  const [selectedShipOrder, setSelectedShipOrder] = useState(null);
  const [shipSearchQuery, setShipSearchQuery] = useState('');
  const [shippingLine, setShippingLine] = useState(null);

  // Pick Modal state
  const [showPickModal, setShowPickModal] = useState(false);
  const [pickingLine, setPickingLine] = useState(null);
  const [pickedQty, setPickedQty] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Call Center state
  const [mobileContacts, setMobileContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [callLogNotes, setCallLogNotes] = useState('');
  const [callLogs, setCallLogs] = useState([]);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const callTimerRef = useRef(null);

  // Inbound Call state
  const [inboundPhoneNumber, setInboundPhoneNumber] = useState('');
  const [inboundCustomerData, setInboundCustomerData] = useState(null);
  const [inboundCallActive, setInboundCallActive] = useState(false);
  const [inboundCallTimer, setInboundCallTimer] = useState(0);
  const inboundTimerRef = useRef(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [receivingLoading, setReceivingLoading] = useState(false);

  // Split Quantity state
  const [splitLines, setSplitLines] = useState([]); // Array of {id, qty, locator, scanned}
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitQtyInput1, setSplitQtyInput1] = useState('');
  const [splitQtyInput2, setSplitQtyInput2] = useState('');
  const [scanningForSplitLine, setScanningForSplitLine] = useState(null); // ID of split line being scanned

  // Expiration Date state
  const [expirationDate, setExpirationDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Locator fields state (for non-split mode)
  const [locatorInput, setLocatorInput] = useState('');

  // Locator validation state (for Item Details receiving)
  const [locatorStatus, setLocatorStatus] = useState(null); // null, 'checking', 'used', 'free', 'invalid'
  const [showLocatorPicker, setShowLocatorPicker] = useState(false);
  const [availableLocators, setAvailableLocators] = useState([]); // Free locators for picker
  const [locatorPickerLoading, setLocatorPickerLoading] = useState(false);
  const [selectedLocatorsTemp, setSelectedLocatorsTemp] = useState(new Set()); // Case 1: Temp selected (cleared on screen exit)
  const [confirmedLocators, setConfirmedLocators] = useState(new Set()); // Case 2: Confirmed locators (cleared on manual refresh)
  const [pickingForSplitLine, setPickingForSplitLine] = useState(null); // Track which split line we're picking for

  // Processing modal state
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingItems, setProcessingItems] = useState([]); // Array of { id, label, status: 'pending'|'processing'|'success'|'error', message }

  // AI Stock Counting state
  const [stockCountingMode, setStockCountingMode] = useState('camera'); // 'camera', 'analyzing', 'results'
  const [capturedImage, setCapturedImage] = useState(null);
  const [aiCountResults, setAiCountResults] = useState([]);
  const [stockCountLocation, setStockCountLocation] = useState('');
  const cameraRef = useRef(null);

  // Handle Login with API
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(
        `https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/Login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );
      const data = await response.json();

      if (response.ok && data && (data.status === 'success' || data.STATUS === 'SUCCESS' || data.items?.length > 0)) {
        setUser({ name: username, username: username });
        setIsLoggedIn(true);
        setShowOrgModal(true);
      } else {
        Alert.alert('Login Failed', data.message || data.MESSAGE || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Organization Selection
  const handleOrgSelection = (org) => {
    setSelectedOrg(org);
    setShowOrgModal(false);
    setCurrentScreen('Home');
  };

  // Confirm Receiving API - POST request with JSON body
  const confirmReceivingAPI = async (item) => {
    const lineId = item.lineid || item.LINEID || item.line_id || item.LINE_ID || '';
    if (!lineId) {
      Alert.alert('Error', 'Line ID is missing. Cannot process receiving.');
      return;
    }

    const shipmentNumber = item.asn_number || item.shipmentnumber || item.shipment_number || '';
    if (!shipmentNumber) {
      Alert.alert('Error', 'Shipment number is missing. Cannot process receiving.');
      return;
    }

    setReceivingLoading(true);
    const url = `https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline`;

    try {
      console.log('Calling API:', url);
      console.log('Parameters:', { p_shipment_number: shipmentNumber, p_line_id: lineId });
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_shipment_number: shipmentNumber,
          p_line_id: lineId
        }),
      });

      // Get raw text first for debugging
      const rawText = await response.text();
      console.log('Raw response:', rawText);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.log('API Parse Error - URL:', url);
        console.log('API Parse Error - Body:', { p_shipment_number: shipmentNumber, p_line_id: lineId });
        console.log('API Parse Error - Response:', rawText);
        Alert.alert(
          'API Response Error',
          'Invalid response from server. Check VS Code console for details.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check for success - linesSuccess:1 or other success indicators
      const isSuccess = response.ok && (
        data.linesSuccess === 1 ||
        data.linesSuccess === '1' ||
        data.LINESSUCCESS === 1 ||
        data.status === 'success' ||
        data.STATUS === 'SUCCESS' ||
        data.message?.toLowerCase().includes('success')
      );

      if (isSuccess) {
        // Update local state to mark item as received
        const lineIdToUpdate = lineId;

        // Update poData items
        setPoData(prevData => {
          if (!prevData || !prevData.items) return prevData;
          return {
            ...prevData,
            items: prevData.items.map(i => {
              const itemLineId = i.lineid || i.LINEID || i.line_id || i.LINE_ID || '';
              if (itemLineId === lineIdToUpdate) {
                return { ...i, processingstatuscode: 'SUCCESS', PROCESSINGSTATUSCODE: 'SUCCESS' };
              }
              return i;
            })
          };
        });

        // Update selectedItem as well
        setSelectedItem(prev => ({
          ...prev,
          processingstatuscode: 'SUCCESS',
          PROCESSINGSTATUSCODE: 'SUCCESS'
        }));

        Alert.alert(
          '✓ Receipt Confirmed',
          data.message || data.MESSAGE || `Successfully received ${item.itemnumber || item.ITEMNUMBER}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Go back to items list (data already updated locally)
                setCurrentScreen('POItems');
              },
            },
          ]
        );
      } else {
        console.log('Receiving Failed - URL:', url);
        console.log('Receiving Failed - Body:', { p_shipment_number: shipmentNumber, p_line_id: lineId });
        console.log('Receiving Failed - Response:', data);
        Alert.alert(
          'Receiving Failed',
          data.message || data.MESSAGE || data.error || 'Failed to process receiving. Check VS Code console for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Network Error - URL:', url);
      console.log('Network Error - Body:', { p_shipment_number: shipmentNumber, p_line_id: lineId });
      console.log('Network Error:', error.message);
      Alert.alert('Network Error', error.message);
    } finally {
      setReceivingLoading(false);
    }
  };

  // ============= SHARE FUNCTION =============
  const handleSharePO = async () => {
    if (!selectedPO) return;

    const po = selectedPO;
    const items = po.items || [];

    // Format items list
    const itemsList = items.map((item, index) => {
      const status = (item.processingstatuscode || item.PROCESSINGSTATUSCODE) === 'SUCCESS' ? '✅' : '⏳';
      const lotNumber = item.lotnumber || item.LOTNUMBER || item.lot_number || item.LOT_NUMBER || '-';
      const locator = item.locator || '-';
      const qty = item.transactionquantity || 0;

      return `${index + 1}. *${item.itemnumber || 'N/A'}*
   📝 ${item.itemdescription || 'No description'}
   📊 Qty: ${qty} | 🎫 Lot: ${lotNumber}
   📍 Locator: ${locator} | ${status}`;
    }).join('\n\n');

    // Count received vs pending
    const receivedCount = items.filter(i => (i.processingstatuscode || i.PROCESSINGSTATUSCODE) === 'SUCCESS').length;
    const totalCount = items.length;

    // Format message nicely
    const message = `📦 *PO RECEIVING DETAILS*
━━━━━━━━━━━━━━━━━━━━━

📋 *PO:* ${po.documentnumber || 'N/A'}
🏢 *Supplier:* ${po.vendorname || 'Unknown'}
📋 *ASN:* ${po.asn_number || 'N/A'}
📊 *Progress:* ${receivedCount}/${totalCount} received

━━━━━━━━━━━━━━━━━━━━━
📦 *ITEMS (${totalCount})*
━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━
_Sent from MobileWMS_`;

    try {
      await Share.share({
        message: message,
        title: `PO: ${po.documentnumber || 'Details'}`,
      });
    } catch (error) {
      console.log('Share error:', error.message);
      Alert.alert('Share Error', 'Could not share the PO details.');
    }
  };

  // ============= SPLIT QUANTITY FUNCTIONS =============

  // Initialize split lines when entering item detail (reset when item changes)
  const initializeSplitLines = (item) => {
    setSplitLines([]);
    setSplitQtyInput('');
    setShowSplitModal(false);
    setScanningForSplitLine(null);
  };

  // Handle split quantity - supports two split inputs
  const handleSplitQty = async () => {
    const splitQty1 = parseInt(splitQtyInput1) || 0;
    const splitQty2 = parseInt(splitQtyInput2) || 0;
    const totalQty = selectedItem?.transactionquantity || 0;

    if (splitQty1 <= 0 && splitQty2 <= 0) {
      Alert.alert('Invalid', 'Please enter at least one valid quantity');
      return;
    }

    const totalSplit = splitQty1 + splitQty2;

    // Calculate current allocated qty
    const currentAllocated = splitLines.reduce((sum, line) => sum + line.qty, 0);
    const remainingQty = totalQty - currentAllocated;

    if (totalSplit >= remainingQty) {
      Alert.alert('Invalid', `Total split (${totalSplit}) must be less than remaining quantity (${remainingQty})`);
      return;
    }

    // Fetch available locators first for auto-assignment
    const freeLocators = await fetchAvailableLocators();

    const newLines = [];
    let locatorIndex = 0;

    if (splitQty1 > 0) {
      const autoLocator = freeLocators[locatorIndex]?.locatorName || '';
      if (autoLocator) {
        setSelectedLocatorsTemp(prev => {
          const newSet = new Set(prev);
          newSet.add(autoLocator.toUpperCase());
          return newSet;
        });
        locatorIndex++;
      }
      newLines.push({
        id: Date.now().toString(),
        qty: splitQty1,
        locator: autoLocator,
        scanned: !!autoLocator,
      });
    }
    if (splitQty2 > 0) {
      const autoLocator = freeLocators[locatorIndex]?.locatorName || '';
      if (autoLocator) {
        setSelectedLocatorsTemp(prev => {
          const newSet = new Set(prev);
          newSet.add(autoLocator.toUpperCase());
          return newSet;
        });
        locatorIndex++;
      }
      newLines.push({
        id: (Date.now() + 1).toString(),
        qty: splitQty2,
        locator: autoLocator,
        scanned: !!autoLocator,
      });
    }

    // If this is first split, also create line for remaining qty with auto-assigned locator
    if (splitLines.length === 0) {
      // Use already assigned locator from Item Details or get next available
      const existingLocator = scannedLocator || locatorInput;
      const remainingLocator = existingLocator || freeLocators[locatorIndex]?.locatorName || '';
      if (remainingLocator && !existingLocator) {
        setSelectedLocatorsTemp(prev => {
          const newSet = new Set(prev);
          newSet.add(remainingLocator.toUpperCase());
          return newSet;
        });
      }
      const remainingLine = {
        id: 'original',
        qty: totalQty - totalSplit,
        locator: remainingLocator,
        scanned: !!remainingLocator,
      };
      setSplitLines([remainingLine, ...newLines]);
      console.log('Split created with auto-assigned locators:', [remainingLine, ...newLines].map(l => l.locator));
    } else {
      // Update the first line's qty (remaining) and add new splits
      setSplitLines(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], qty: updated[0].qty - totalSplit };
        return [...updated, ...newLines];
      });
      console.log('New splits added with auto-assigned locators:', newLines.map(l => l.locator));
    }

    setSplitQtyInput1('');
    setSplitQtyInput2('');
    setShowSplitModal(false);
  };

  // Handle scan for specific split line
  const handleScanForSplitLine = (lineId) => {
    setScanningForSplitLine(lineId);
    setCurrentScreen('BarcodeScanner');
  };

  // Update split line locator (for both scan and manual input)
  const updateSplitLineLocator = (lineId, locatorValue) => {
    setSplitLines(prev => {
      const oldLine = prev.find(l => l.id === lineId);

      // Release old locator if it exists and is different from new one
      if (oldLine?.locator && oldLine.locator.toUpperCase() !== (locatorValue || '').toUpperCase()) {
        setSelectedLocatorsTemp(prevTemp => {
          const newTemp = new Set(prevTemp);
          newTemp.delete(oldLine.locator.toUpperCase());
          console.log('Released old locator:', oldLine.locator);
          return newTemp;
        });
      }

      return prev.map(line => {
        if (line.id === lineId) {
          const hasValue = locatorValue && locatorValue.trim() && locatorValue.trim() !== '----';
          return { ...line, locator: locatorValue, scanned: hasValue };
        }
        return line;
      });
    });
    // Clear scanning state if this was from a camera scan
    if (scanningForSplitLine === lineId) {
      setScanningForSplitLine(null);
    }
  };

  // Remove a split line (merge back to first line)
  const removeSplitLine = (lineId) => {
    if (lineId === 'original') return; // Can't remove original line

    setSplitLines(prev => {
      const lineToRemove = prev.find(l => l.id === lineId);
      if (!lineToRemove) return prev;

      // Release locator back to available list
      if (lineToRemove.locator) {
        setSelectedLocatorsTemp(prevTemp => {
          const newTemp = new Set(prevTemp);
          newTemp.delete(lineToRemove.locator.toUpperCase());
          console.log('Released locator:', lineToRemove.locator);
          return newTemp;
        });
      }

      const filtered = prev.filter(l => l.id !== lineId);
      if (filtered.length > 0) {
        filtered[0] = { ...filtered[0], qty: filtered[0].qty + lineToRemove.qty };
      }

      // If only one line left, clear split lines (back to normal mode)
      if (filtered.length === 1) {
        return [];
      }
      return filtered;
    });
  };

  // Check if all split lines have locators assigned
  const allSplitLinesScanned = () => {
    if (splitLines.length === 0) return true;
    return splitLines.every(line => line.scanned && line.locator);
  };

  // ============= GENERATE RECEIVING JSON =============
  // Helper to parse serial number (e.g., "IGRN202512012_111" -> { prefix: "IGRN202512012_", num: 111 })
  const parseSerialNumber = (serial) => {
    if (!serial) return null;
    const match = serial.match(/^(.+_)(\d+)$/);
    if (match) {
      return { prefix: match[1], num: parseInt(match[2], 10) };
    }
    return null;
  };

  // Generate receiving JSON for API
  const generateReceivingJSON = () => {
    if (!selectedItem || !selectedPO) return null;

    const item = selectedItem;
    const po = selectedPO;

    // Parse from/to serial numbers
    const fromSerial = parseSerialNumber(item.fromserialnumber);
    const toSerial = parseSerialNumber(item.toserialnumber);
    const totalQty = item.transactionquantity || 0;
    const baseShipmentNumber = item.shipmentnumber || item.SHIPMENTNUMBER || item.asn_number || po.asn_number || po.shipmentnumber || "";
    const documentLineNumber = item.documentlinenumber || item.DOCUMENTLINENUMBER || "";

    if (splitLines.length > 0) {
      // Split scenario - create SEPARATE FULL JSON for each split
      // ShipmentNumber format: baseShipmentNumber-documentLineNumber-splitSequence (e.g., IPONMay2500103-1-1)
      let allJsons = [];
      let serialStart = fromSerial ? fromSerial.num : 0;

      splitLines.forEach((split, index) => {
        const splitQty = split.qty;
        const serialEnd = serialStart + splitQty - 1;
        const sequenceNum = index + 1;

        // Build serial range for this split
        let lotSerialItemSerials = [];
        if (fromSerial && toSerial) {
          lotSerialItemSerials = [{
            FromSerialNumber: `${fromSerial.prefix}${serialStart}`,
            ToSerialNumber: `${fromSerial.prefix}${serialEnd}`
          }];
        }

        // Create full JSON for this split
        const splitJson = {
          FromOrganizationCode: null,
          OrganizationCode: item.organizationcode || "",
          ReceiptSourceCode: "VENDOR",
          EmployeeId: "",
          VendorName: item.vendorname || po.vendorname || "",
          ShipmentNumber: `${baseShipmentNumber}-${documentLineNumber}-${sequenceNum}`,
          lines: [{
            POHeaderId: item.poheaderid || item.POHEADERID || null,
            POLineLocationId: item.polinelocationid || item.POLINELOCATIONID || null,
            SourceDocumentCode: "PO",
            ReceiptSourceCode: "VENDOR",
            TransactionType: "RECEIVE",
            AutoTransactCode: "DELIVER",
            DocumentNumber: po.documentnumber || "",
            DocumentLineNumber: item.documentlinenumber || "",
            ItemNumber: item.itemnumber || "",
            OrganizationCode: item.organizationcode || "",
            Subinventory: item.subinventory || item.SUBINVENTORY || "",
            Locator: split.locator || "",
            Quantity: splitQty,
            FromOrganizationCode: null,
            UnitOfMeasure: item.unitofmeasure || item.UNITOFMEASURE || item.uom || "PCS",
            lotSerialItemLots: [{
              LotNumber: item.lotnumber || item.LOTNUMBER || "",
              TransactionQuantity: splitQty,
              lotSerialItemSerials: lotSerialItemSerials
            }]
          }]
        };

        allJsons.push(splitJson);
        serialStart = serialEnd + 1;
      });

      return allJsons; // Return array of JSONs for split
    } else {
      // Non-split scenario - single JSON
      const locator = scannedLocator || locatorInput || item.locator || "";

      let lotSerialItemSerials = [];
      if (item.fromserialnumber && item.toserialnumber) {
        lotSerialItemSerials = [{
          FromSerialNumber: item.fromserialnumber,
          ToSerialNumber: item.toserialnumber
        }];
      }

      // ShipmentNumber format: baseShipmentNumber-documentLineNumber (e.g., IPONMay2500103-1)
      const receivingJSON = {
        FromOrganizationCode: null,
        OrganizationCode: item.organizationcode || "",
        ReceiptSourceCode: "VENDOR",
        EmployeeId: "",
        VendorName: item.vendorname || po.vendorname || "",
        ShipmentNumber: `${baseShipmentNumber}-${documentLineNumber}`,
        lines: [{
          POHeaderId: item.poheaderid || item.POHEADERID || null,
          POLineLocationId: item.polinelocationid || item.POLINELOCATIONID || null,
          SourceDocumentCode: "PO",
          ReceiptSourceCode: "VENDOR",
          TransactionType: "RECEIVE",
          AutoTransactCode: "DELIVER",
          DocumentNumber: po.documentnumber || "",
          DocumentLineNumber: item.documentlinenumber || "",
          ItemNumber: item.itemnumber || "",
          OrganizationCode: item.organizationcode || "",
          Subinventory: item.subinventory || item.SUBINVENTORY || "",
          Locator: locator,
          Quantity: totalQty,
          FromOrganizationCode: null,
          UnitOfMeasure: item.unitofmeasure || item.UNITOFMEASURE || item.uom || "PCS",
          lotSerialItemLots: [{
            LotNumber: item.lotnumber || item.LOTNUMBER || "",
            TransactionQuantity: totalQty,
            lotSerialItemSerials: lotSerialItemSerials
          }]
        }]
      };

      return receivingJSON;
    }
  };

  // Log receiving JSON to console
  const logReceivingJSON = () => {
    const json = generateReceivingJSON();
    if (json) {
      console.log('========== RECEIVING JSON ==========');

      if (Array.isArray(json)) {
        // Split scenario - multiple JSONs
        console.log(`Split Mode: ${json.length} separate JSONs`);
        json.forEach((splitJson, index) => {
          console.log(`\n----- Split ${index + 1} of ${json.length} -----`);
          console.log(JSON.stringify(splitJson, null, 2));
        });
        Alert.alert('JSON Logged', `${json.length} separate JSONs logged to VS Code console (Split Mode). Check the terminal.`);
      } else {
        // Non-split scenario - single JSON
        console.log('Single Mode: 1 JSON');
        console.log(JSON.stringify(json, null, 2));
        Alert.alert('JSON Logged', 'Receiving JSON has been logged to VS Code console. Check the terminal.');
      }

      console.log('\n====================================');
    } else {
      Alert.alert('Error', 'Could not generate receiving JSON');
    }
  };

  // ============= PROCESS RECEIVING =============
  // Oracle Cloud API URL for receiving
  const ORACLE_RECEIVING_URL = `${ORACLE_FUSION_BASE}/receivingReceiptRequests`;

  // APEX API for updating status
  const APEX_UPDATE_URL = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline';

  // Process receiving - main function
  const processReceiving = async () => {
    if (!selectedItem || !selectedPO) {
      Alert.alert('Error', 'No item selected');
      return;
    }

    // Validation: Check locators
    if (splitLines.length > 0) {
      // Split mode - check all split locators
      const missingLocator = splitLines.find(s => !s.locator || s.locator.trim() === '' || s.locator.trim() === '----');
      if (missingLocator) {
        Alert.alert('Validation Error', 'Please assign locators to all split lines before processing.');
        return;
      }
    } else {
      // Non-split mode - check locator
      const locator = scannedLocator || locatorInput || '';
      if (!locator || locator.trim() === '' || locator.trim() === '----') {
        Alert.alert('Validation Error', 'Please scan or enter a locator before processing.');
        return;
      }
    }

    // Generate JSONs
    const jsonData = generateReceivingJSON();
    if (!jsonData) {
      Alert.alert('Error', 'Could not generate receiving data');
      return;
    }

    // Convert to array for unified processing
    const jsonArray = Array.isArray(jsonData) ? jsonData : [jsonData];

    // Initialize processing items for modal
    const items = jsonArray.map((json, index) => ({
      id: index,
      label: `${json.ShipmentNumber} - Qty: ${json.lines[0].Quantity}`,
      locator: json.lines[0].Locator,
      status: 'pending',
      message: ''
    }));

    setProcessingItems(items);
    setShowProcessingModal(true);

    // Process each JSON sequentially
    for (let i = 0; i < jsonArray.length; i++) {
      const json = jsonArray[i];
      const lineId = selectedItem.lineid || selectedItem.LINEID || '';

      // Update status to processing
      setProcessingItems(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'processing', message: '🔄 Step 1: Sending to Oracle Fusion...' } : item
      ));

      try {
        // Step 1: POST to Oracle Cloud
        console.log(`Processing ${i + 1}/${jsonArray.length}:`, json.ShipmentNumber);
        console.log('Oracle POST payload:', JSON.stringify(json, null, 2));

        const oracleResponse = await fetch(ORACLE_RECEIVING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ORACLE_FUSION_AUTH}`,
          },
          body: JSON.stringify(json),
        });

        const oracleText = await oracleResponse.text();
        console.log('Oracle Response:', oracleText);

        let oracleData;
        try {
          oracleData = JSON.parse(oracleText);
        } catch (e) {
          throw new Error(`Invalid Oracle response: ${oracleText.substring(0, 200)}`);
        }

        // Step 2: Check ProcessingStatusCode
        const processingStatus = oracleData.ProcessingStatusCode || oracleData.processingstatuscode;
        console.log('ProcessingStatusCode:', processingStatus);

        if (processingStatus !== 'SUCCESS') {
          throw new Error(`Oracle Fusion failed: ${processingStatus || 'Unknown error'}`);
        }

        // Update status - Oracle success, now APEX
        setProcessingItems(prev => prev.map((item, idx) =>
          idx === i ? { ...item, message: '✅ Step 1: Oracle Fusion SUCCESS\n🔄 Step 2: Updating APEX DB...' } : item
        ));

        // Step 3: POST to APEX to update status
        const apexUrl = `${APEX_UPDATE_URL}?p_status=UPDATE&p_line_id=${lineId}`;
        console.log('==========================================');
        console.log('APEX UPDATE CALL');
        console.log('==========================================');
        console.log('LineId:', lineId);
        console.log('Full APEX URL:', apexUrl);
        console.log('==========================================');

        const apexResponse = await fetch(apexUrl, {
          method: 'POST',
        });

        const apexStatus = apexResponse.status;
        const apexText = await apexResponse.text();
        console.log('APEX Response Status:', apexStatus);
        console.log('APEX Response Body:', apexText);
        console.log('==========================================');

        // Check APEX response
        if (apexStatus !== 200) {
          // APEX failed but Oracle succeeded
          setProcessingItems(prev => prev.map((item, idx) =>
            idx === i ? {
              ...item,
              status: 'error',
              message: `✅ Oracle Fusion SUCCESS\n❌ APEX DB FAILED (${apexStatus})\nURL: ${apexUrl}\nResponse: ${apexText.substring(0, 100)}`
            } : item
          ));
          continue; // Move to next item
        }

        // Both succeeded
        setProcessingItems(prev => prev.map((item, idx) =>
          idx === i ? {
            ...item,
            status: 'success',
            message: `✅ Oracle Fusion SUCCESS\n✅ APEX DB SUCCESS (${apexStatus})`
          } : item
        ));

      } catch (error) {
        console.log('Processing Error:', error.message);
        setProcessingItems(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'error', message: `❌ ${error.message}` } : item
        ));
      }

      // Small delay between requests
      if (i < jsonArray.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Check if all successful
    setTimeout(() => {
      setProcessingItems(prev => {
        const allSuccess = prev.every(item => item.status === 'success');
        if (allSuccess) {
          // Update local state to mark item as received
          const lineIdToUpdate = selectedItem.lineid || selectedItem.LINEID || '';

          // Update poData items
          setPoData(prevData => {
            if (!prevData || !prevData.items) return prevData;
            return {
              ...prevData,
              items: prevData.items.map(i => {
                const itemLineId = i.lineid || i.LINEID || i.line_id || i.LINE_ID || '';
                if (itemLineId === lineIdToUpdate) {
                  return { ...i, processingstatuscode: 'SUCCESS', PROCESSINGSTATUSCODE: 'SUCCESS' };
                }
                return i;
              })
            };
          });

          // Update selectedItem
          setSelectedItem(prevItem => ({
            ...prevItem,
            processingstatuscode: 'SUCCESS',
            PROCESSINGSTATUSCODE: 'SUCCESS'
          }));

          // Update selectedPO items as well
          if (selectedPO) {
            setSelectedPO(prevPO => ({
              ...prevPO,
              items: prevPO.items?.map(i => {
                const itemLineId = i.lineid || i.LINEID || '';
                if (itemLineId === lineIdToUpdate) {
                  return { ...i, processingstatuscode: 'SUCCESS', PROCESSINGSTATUSCODE: 'SUCCESS' };
                }
                return i;
              })
            }));
          }

          // Case 2: Move locators from temp to confirmed (permanent until refresh)
          const locatorsToConfirm = [];
          if (splitLines.length > 0) {
            // Add all split line locators
            splitLines.forEach(line => {
              if (line.locator) {
                locatorsToConfirm.push(line.locator.toUpperCase());
              }
            });
          } else {
            // Add normal locator
            const locator = scannedLocator || locatorInput || '';
            if (locator) {
              locatorsToConfirm.push(locator.toUpperCase());
            }
          }

          // Add to confirmed locators
          setConfirmedLocators(prev => {
            const newConfirmed = new Set(prev);
            locatorsToConfirm.forEach(loc => {
              newConfirmed.add(loc);
              console.log('Confirmed locator (permanent):', loc);
            });
            console.log('Total confirmed locators:', newConfirmed.size);
            return newConfirmed;
          });

          // Remove from temp selected (since now confirmed)
          setSelectedLocatorsTemp(prev => {
            const newTemp = new Set(prev);
            locatorsToConfirm.forEach(loc => newTemp.delete(loc));
            return newTemp;
          });
        }
        return prev;
      });
    }, 500);
  };

  // ============= CALL CENTER FUNCTIONS =============

  // Load contacts from device
  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image],
        });
        if (data.length > 0) {
          // Filter contacts that have phone numbers
          const contactsWithPhone = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
          setMobileContacts(contactsWithPhone);
        }
      } else {
        Alert.alert('Permission Denied', 'Contact permission is required to use this feature');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    }
    setContactsLoading(false);
  };

  // Format call duration
  const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start call timer
  const startCallTimer = () => {
    setCallTimer(0);
    setCallInProgress(true);
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer and show call log modal
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallInProgress(false);
    setShowCallLogModal(true);
  };

  // Make phone call
  const makePhoneCall = async (contact) => {
    const phoneNumber = contact.phoneNumbers[0].number;
    setSelectedContact(contact);
    startCallTimer();
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.error('Error making call:', error);
      Alert.alert('Error', 'Unable to make phone call');
      stopCallTimer();
    }
  };

  // Save call log
  const saveCallLog = () => {
    const newLog = {
      id: Date.now().toString(),
      contact: selectedContact,
      duration: callTimer,
      notes: callLogNotes,
      timestamp: new Date().toISOString(),
    };
    setCallLogs(prev => [newLog, ...prev]);
    setShowCallLogModal(false);
    setCallLogNotes('');
    setCallTimer(0);
    setSelectedContact(null);
    Alert.alert('Success', 'Call log saved successfully');
  };

  // Get sample customer data for contact
  const getCustomerData = (contact) => {
    // Sample data - in real app this would come from CRM
    return {
      invoices: [
        { id: 'INV-001', amount: 2500.00, status: 'Paid', date: '2024-01-15' },
        { id: 'INV-002', amount: 1800.00, status: 'Pending', date: '2024-02-01' },
        { id: 'INV-003', amount: 3200.00, status: 'Overdue', date: '2024-01-01' },
      ],
      payments: [
        { id: 'PAY-001', amount: 2500.00, method: 'Credit Card', date: '2024-01-20' },
        { id: 'PAY-002', amount: 1000.00, method: 'Bank Transfer', date: '2024-02-05' },
      ],
      orders: [
        { id: 'ORD-001', items: 5, total: 4500.00, status: 'Delivered' },
        { id: 'ORD-002', items: 3, total: 2100.00, status: 'Processing' },
      ],
      totalSpent: 8500.00,
      memberSince: '2023-06-15',
    };
  };

  // Filter contacts based on search query
  const filteredContacts = mobileContacts.filter(contact => {
    const query = contactSearchQuery.toLowerCase();
    const name = (contact.name || '').toLowerCase();
    const phone = contact.phoneNumbers?.[0]?.number || '';
    return name.includes(query) || phone.includes(query);
  });

  // ============= INBOUND CALL FUNCTIONS =============

  // Get customer details by phone number
  const getInboundCustomerDetails = (phoneNumber) => {
    // Sample customer database - in real app this would be an API call
    const customerDatabase = {
      '+1234567890': {
        name: 'John Smith',
        company: 'ABC Corporation',
        email: 'john.smith@abc.com',
        customerType: 'Premium',
        creditLimit: 50000,
        outstandingBalance: 12500,
        invoices: [
          { id: 'INV-2024-001', amount: 5500.00, status: 'Overdue', date: '2024-01-15', dueDate: '2024-02-15' },
          { id: 'INV-2024-002', amount: 3200.00, status: 'Pending', date: '2024-02-01', dueDate: '2024-03-01' },
          { id: 'INV-2024-003', amount: 8900.00, status: 'Paid', date: '2024-01-01', dueDate: '2024-02-01' },
        ],
        payments: [
          { id: 'PAY-001', amount: 8900.00, method: 'Wire Transfer', date: '2024-01-28' },
          { id: 'PAY-002', amount: 2500.00, method: 'Credit Card', date: '2024-02-10' },
        ],
        orders: [
          { id: 'SO-2024-101', items: 12, total: 15600.00, status: 'Shipped', date: '2024-02-01' },
          { id: 'SO-2024-089', items: 5, total: 4200.00, status: 'Delivered', date: '2024-01-20' },
          { id: 'SO-2024-075', items: 8, total: 9800.00, status: 'Delivered', date: '2024-01-10' },
        ],
        notes: 'VIP customer - always prioritize. Prefers email communication.',
        lastContact: '2024-02-15',
      },
      'default': {
        name: 'Unknown Caller',
        company: 'Not in system',
        email: 'N/A',
        customerType: 'New',
        creditLimit: 0,
        outstandingBalance: 0,
        invoices: [],
        payments: [],
        orders: [],
        notes: 'New caller - not found in customer database',
        lastContact: 'Never',
      }
    };

    // Clean phone number for matching
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Return matching customer or default
    return customerDatabase[cleanNumber] || customerDatabase['default'];
  };

  // Start inbound call timer
  const startInboundTimer = () => {
    setInboundCallTimer(0);
    setInboundCallActive(true);
    inboundTimerRef.current = setInterval(() => {
      setInboundCallTimer(prev => prev + 1);
    }, 1000);
  };

  // Stop inbound call timer
  const stopInboundTimer = () => {
    if (inboundTimerRef.current) {
      clearInterval(inboundTimerRef.current);
      inboundTimerRef.current = null;
    }
    setInboundCallActive(false);
  };

  // Handle get details button
  const handleGetInboundDetails = () => {
    if (!inboundPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    const customerData = getInboundCustomerDetails(inboundPhoneNumber);
    setInboundCustomerData(customerData);
    if (!inboundCallActive) {
      startInboundTimer();
    }
  };

  // End inbound call and log
  const endInboundCall = () => {
    stopInboundTimer();
    const newLog = {
      id: Date.now().toString(),
      contact: {
        name: inboundCustomerData?.name || 'Unknown',
        phoneNumbers: [{ number: inboundPhoneNumber }],
      },
      duration: inboundCallTimer,
      notes: `Inbound call from ${inboundCustomerData?.company || 'Unknown'}`,
      timestamp: new Date().toISOString(),
      type: 'inbound',
    };
    setCallLogs(prev => [newLog, ...prev]);
    setInboundPhoneNumber('');
    setInboundCustomerData(null);
    setInboundCallTimer(0);
    Alert.alert('Call Ended', 'Inbound call has been logged');
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

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh PO data for KPIs
      const pickerName = user?.username || username || 'PICKER1';
      const poUrl = `${API_BASE}/PUTAWAYDETAILS?PICKER_NAME=${encodeURIComponent(pickerName)}`;
      const poResponse = await fetch(poUrl);
      const poJson = await poResponse.json();
      const poItems = poJson.items || [];
      const uniquePOs = [...new Set(poItems.map(item => item.documentnumber))];

      // Refresh Ship Orders data for KPIs
      try {
        const shipResponse = await fetch(
          'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/pendingpickingdetails'
        );
        const shipJson = await shipResponse.json();
        const shipItems = shipJson.items || [];
        setShipOrdersData(shipItems);

        // Group ship orders
        const grouped = shipItems.reduce((acc, item) => {
          const key = `${item.source_order_number}-${item.organization_name}`;
          if (!acc[key]) {
            acc[key] = { id: key, lines: [], totalQty: 0, ...item };
          }
          acc[key].lines.push(item);
          acc[key].totalQty += item.qty || 0;
          return acc;
        }, {});
        setGroupedShipOrders(Object.values(grouped));
      } catch (e) {
        console.log('Ship orders fetch error:', e);
      }

      // Refresh Inventory data for KPIs
      let inventoryCount = 0;
      let lowStockCount = 0;
      if (selectedOrg) {
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
      }

      setKpiData({
        totalPOs: uniquePOs.length,
        pendingItems: poItems.length,
        inventoryItems: inventoryCount,
        lowStock: lowStockCount,
      });
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load KPIs when app starts and user is logged in
  useEffect(() => {
    if (isLoggedIn && currentScreen === 'Home') {
      onRefresh();
    }
  }, [isLoggedIn]);

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'Login' || currentScreen === 'Home') {
        // Exit app or do nothing on Login/Home screen
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      }
      // Go back to previous screen
      goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, navigationHistory]);

  // Fetch Purchase Orders
  const fetchPOData = async () => {
    setLoading(true);
    try {
      const pickerName = user?.username || username || 'PICKER1';
      const url = `${API_BASE}/PUTAWAYDETAILS?PICKER_NAME=${encodeURIComponent(pickerName)}`;
      const response = await fetch(url);
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

  // Fetch Organizations List (cached)
  const fetchOrganizationsList = async () => {
    // Don't fetch if already loaded
    if (organizationsList.length > 0) {
      setCurrentScreen('LotsOrgSelection');
      return;
    }

    setOrgsLoading(true);
    try {
      const response = await fetch(
        'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/getorgnizationslist'
      );
      const data = await response.json();
      console.log('Organizations API response:', JSON.stringify(data));
      const orgs = data.items || [];
      setOrganizationsList(orgs);
      setOrgsLoading(false);
      setCurrentScreen('LotsOrgSelection');
    } catch (error) {
      console.log('Organizations API error:', error);
      Alert.alert('Error', 'Failed to fetch organizations: ' + error.message);
      setOrgsLoading(false);
      // Still navigate to show empty state
      setCurrentScreen('LotsOrgSelection');
    }
  };

  // Fetch Locator Data from separate API
  const fetchLocatorData = async (orgCode) => {
    if (!orgCode) return;

    setLocatorLoading(true);
    setGroupedByLocator([]); // Clear previous data
    try {
      // Try with organizationcode parameter (no underscore) to match API convention
      const url = `https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/getonhandsbylocator?organizationcode=${orgCode}`;
      console.log('Fetching locator data from:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Locator API raw response:', JSON.stringify(data).substring(0, 500));
      console.log('Locator API response items count:', (data.items || []).length);
      const items = data.items || [];

      if (items.length > 0) {
        console.log('First locator item:', JSON.stringify(items[0]));
      }

      // Group by Locator - using correct field names from API
      // API fields: locator_id, organizationcode, subinventorycode, itemnumber, itemdescription, primaryquantity
      const byLocator = items.reduce((acc, item) => {
        const locatorKey = item.locator_id || item.locator || 'NO_LOCATOR';
        if (!acc[locatorKey]) {
          acc[locatorKey] = {
            id: locatorKey,
            locator: item.locator_id || item.locator || 'No Locator',
            organization_code: item.organizationcode || item.organization_code || orgCode,
            sub_inventory_code: item.subinventorycode || item.sub_inventory_code,
            totalQuantity: 0,
            items: [],
          };
        }
        // primaryquantity is a string, need to parse it
        const qty = parseFloat(item.primaryquantity) || parseFloat(item.primary_quantity) || 0;
        acc[locatorKey].totalQuantity += qty;
        acc[locatorKey].items.push({
          ...item,
          // Normalize field names for display
          item_number: item.itemnumber || item.item_number,
          item_description: item.itemdescription || item.item_description,
          organization_code: item.organizationcode || item.organization_code || orgCode,
          sub_inventory_code: item.subinventorycode || item.sub_inventory_code,
          locator: item.locator_id || item.locator,
          primaryquantity: qty,
          id: `${locatorKey}-${item.itemnumber || item.item_number}-${item.lotnumber || 'nolot'}-${Math.random()}`,
        });
        return acc;
      }, {});

      const groupedData = Object.values(byLocator);
      console.log('Grouped locator data count:', groupedData.length);
      if (groupedData.length > 0) {
        console.log('First grouped locator:', JSON.stringify(groupedData[0]).substring(0, 300));
      }

      setLocatorData(items);
      setGroupedByLocator(groupedData);
      setLocatorLoading(false);
    } catch (error) {
      console.log('Locator API error:', error);
      Alert.alert('Error', 'Failed to fetch locator data: ' + error.message);
      setLocatorLoading(false);
    }
  };

  // ============= STOCK LOCATORS FUNCTIONS =============

  // Fetch Stock Locators - from Oracle Fusion and map with onhand data
  const fetchStockLocators = async () => {
    setLocatorsLoading(true);
    setFusionLocators([]);
    setOnhandLocators([]);
    setMappedLocators([]);

    const orgCode = selectedOrg || 'MLCECLAIM';

    try {
      // Fetch both APIs in parallel
      const [fusionResponse, onhandResponse] = await Promise.all([
        // Oracle Fusion API - Get all locators
        fetch(`${ORACLE_FUSION_BASE}/subinventories/00020000000EACED00057708000110D9319D664C00000004414D4B45/child/locators?offset=0&limit=500`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${ORACLE_FUSION_AUTH}`,
            'Content-Type': 'application/json',
          },
        }),
        // APEX API - Get onhand by locator
        fetch(`${API_BASE}/getonhandsbylocator?organizationcode=${orgCode}`),
      ]);

      // Parse Fusion response
      const fusionText = await fusionResponse.text();
      console.log('========== FUSION LOCATORS API ==========');
      console.log('Status:', fusionResponse.status);
      console.log('Response:', fusionText.substring(0, 500));

      let fusionData = { items: [] };
      try {
        fusionData = JSON.parse(fusionText);
      } catch (e) {
        console.log('Failed to parse Fusion response');
      }

      const fusionItems = fusionData.items || [];
      console.log('Fusion locators count:', fusionItems.length);
      if (fusionItems.length > 0) {
        console.log('First Fusion locator:', JSON.stringify(fusionItems[0]));
        // Extract SubinventoryCode for title
        setLocatorSubinventory(fusionItems[0].SubinventoryCode || 'AMKE');
      }
      setFusionLocators(fusionItems);

      // Parse Onhand response
      const onhandText = await onhandResponse.text();
      console.log('========== ONHAND LOCATORS API ==========');
      console.log('Status:', onhandResponse.status);
      console.log('Response:', onhandText.substring(0, 500));

      let onhandData = { items: [] };
      try {
        onhandData = JSON.parse(onhandText);
      } catch (e) {
        console.log('Failed to parse Onhand response');
      }

      const onhandItems = onhandData.items || [];
      console.log('Onhand items count:', onhandItems.length);
      setOnhandLocators(onhandItems);

      // Map locators - mark as Used or Free
      const onhandLocatorSet = new Set();
      const onhandByLocator = {};

      onhandItems.forEach(item => {
        const locatorName = item.locator_id || item.locator || '';
        if (locatorName) {
          onhandLocatorSet.add(locatorName);
          if (!onhandByLocator[locatorName]) {
            onhandByLocator[locatorName] = [];
          }
          onhandByLocator[locatorName].push(item);
        }
      });

      const mapped = fusionItems.map(loc => {
        const locatorName = loc.LocatorName || '';
        const isUsed = onhandLocatorSet.has(locatorName);
        const items = onhandByLocator[locatorName] || [];
        const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.primaryquantity) || 0), 0);

        return {
          ...loc,
          id: loc.InventoryLocationId || locatorName,
          locatorName: locatorName,
          subinventory: loc.SubinventoryCode || '',
          status: isUsed ? 'Used' : 'Free',
          statusCode: loc.MaterialStatusCode || 'Active',
          itemCount: items.length,
          totalQuantity: totalQty,
          items: items,
          creationDate: loc.CreationDate,
        };
      });

      console.log('Mapped locators count:', mapped.length);
      console.log('Used locators:', mapped.filter(l => l.status === 'Used').length);
      console.log('Free locators:', mapped.filter(l => l.status === 'Free').length);

      setMappedLocators(mapped);
      setLocatorsLoading(false);

    } catch (error) {
      console.log('Stock Locators Error:', error.message);
      Alert.alert('Error', 'Failed to fetch stock locators: ' + error.message);
      setLocatorsLoading(false);
    }
  };

  // Check if a locator is Used or Free (for Item Details receiving)
  const checkLocatorStatus = async (locatorName) => {
    if (!locatorName || locatorName.trim() === '' || locatorName.trim() === '----') {
      setLocatorStatus(null);
      return;
    }

    setLocatorStatus('checking');
    const orgCode = selectedOrg || 'MLCECLAIM';

    try {
      // Fetch on-hand data to check if locator has items
      const response = await fetch(`${API_BASE}/getonhandsbylocator?organizationcode=${orgCode}`);
      const data = await response.json();
      const onhandItems = data.items || [];

      // Check if this locator exists in on-hand data
      const locatorHasItems = onhandItems.some(item => {
        const itemLocator = item.locator_id || item.locator || '';
        return itemLocator.toLowerCase() === locatorName.toLowerCase();
      });

      setLocatorStatus(locatorHasItems ? 'used' : 'free');
      console.log(`Locator ${locatorName} status:`, locatorHasItems ? 'Used' : 'Free');

    } catch (error) {
      console.log('Error checking locator status:', error.message);
      setLocatorStatus('invalid');
    }
  };

  // Fetch available (Free) locators for the picker modal
  // Returns the list of free locators and optionally auto-assigns them
  const fetchAvailableLocators = async (autoAssignCount = 0) => {
    setLocatorPickerLoading(true);
    setAvailableLocators([]);
    const orgCode = selectedOrg || 'MLCECLAIM';

    try {
      // Fetch both APIs in parallel
      const [fusionResponse, onhandResponse] = await Promise.all([
        fetch(`${ORACLE_FUSION_BASE}/subinventories/00020000000EACED00057708000110D9319D664C00000004414D4B45/child/locators?offset=0&limit=500`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${ORACLE_FUSION_AUTH}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE}/getonhandsbylocator?organizationcode=${orgCode}`),
      ]);

      // Parse responses
      let fusionData = { items: [] };
      let onhandData = { items: [] };

      try {
        const fusionText = await fusionResponse.text();
        fusionData = JSON.parse(fusionText);
      } catch (e) { }

      try {
        const onhandText = await onhandResponse.text();
        onhandData = JSON.parse(onhandText);
      } catch (e) { }

      const fusionItems = fusionData.items || [];
      const onhandItems = onhandData.items || [];

      // Create set of used locators
      const usedLocatorSet = new Set();
      onhandItems.forEach(item => {
        const locatorName = item.locator_id || item.locator || '';
        if (locatorName) usedLocatorSet.add(locatorName.toUpperCase());
      });

      // Filter to only Free locators:
      // - Not in on-hand data (from API)
      // - Not in selectedLocatorsTemp (Case 1: selected but not confirmed)
      // - Not in confirmedLocators (Case 2: confirmed receipts)
      const freeLocators = fusionItems
        .filter(loc => {
          const locatorName = loc.LocatorName || '';
          const upperName = locatorName.toUpperCase();
          const isInOnhand = usedLocatorSet.has(upperName);
          const isSelectedTemp = selectedLocatorsTemp.has(upperName);
          const isConfirmed = confirmedLocators.has(upperName);
          return !isInOnhand && !isSelectedTemp && !isConfirmed;
        })
        .map(loc => ({
          id: loc.InventoryLocationId || loc.LocatorName,
          locatorName: loc.LocatorName || '',
          subinventory: loc.SubinventoryCode || '',
          statusCode: loc.MaterialStatusCode || 'Active',
        }))
        .sort((a, b) => a.locatorName.localeCompare(b.locatorName));

      console.log('Available locators:', freeLocators.length, '| Temp selected:', selectedLocatorsTemp.size, '| Confirmed:', confirmedLocators.size);
      setAvailableLocators(freeLocators);
      setLocatorPickerLoading(false);

      // Return the free locators for auto-assignment
      return freeLocators;

    } catch (error) {
      console.log('Error fetching available locators:', error.message);
      setLocatorPickerLoading(false);
      return [];
    }
  };

  // Auto-assign first available locator when opening Item Details
  const autoAssignLocatorForItem = async () => {
    const freeLocators = await fetchAvailableLocators();
    if (freeLocators.length > 0) {
      const firstLocator = freeLocators[0].locatorName;
      setLocatorInput(firstLocator);
      setScannedLocator(firstLocator);
      // Add to temp selected locators
      setSelectedLocatorsTemp(prev => {
        const newSet = new Set(prev);
        newSet.add(firstLocator.toUpperCase());
        return newSet;
      });
      // Check locator status
      checkLocatorStatus(firstLocator);
      console.log('Auto-assigned locator:', firstLocator);
    }
  };

  // Auto-assign locators for split lines
  const autoAssignLocatorsForSplits = async (newSplitLines, startIndex = 0) => {
    const freeLocators = await fetchAvailableLocators();
    if (freeLocators.length === 0) return newSplitLines;

    const updatedLines = newSplitLines.map((line, idx) => {
      // Only assign to lines without locators
      if (!line.locator && freeLocators[startIndex + idx]) {
        const locatorName = freeLocators[startIndex + idx].locatorName;
        // Add to temp selected
        setSelectedLocatorsTemp(prev => {
          const newSet = new Set(prev);
          newSet.add(locatorName.toUpperCase());
          return newSet;
        });
        console.log(`Auto-assigned locator to split ${idx + 1}:`, locatorName);
        return { ...line, locator: locatorName, scanned: true };
      }
      return line;
    });

    return updatedLines;
  };

  // Build hierarchical tree from locator data
  // Locator format: AREA-BIN-COLUMN-ROW-SHELVING
  const buildLocatorHierarchy = (data) => {
    const hierarchy = {
      level: 'root',
      name: 'All Locations',
      children: {},
      items: [],
      totalQty: 0,
      itemCount: 0,
    };

    const levelNames = ['AREA', 'BIN', 'COLUMN', 'ROW', 'SHELVING'];

    data.forEach(item => {
      const locator = item.locator_id || item.locator || '';
      const segments = locator.split('-');
      let current = hierarchy;

      segments.forEach((segment, idx) => {
        if (!segment) return;

        if (!current.children[segment]) {
          current.children[segment] = {
            level: levelNames[idx] || `LEVEL_${idx}`,
            name: segment,
            fullPath: segments.slice(0, idx + 1).join('-'),
            children: {},
            items: [],
            totalQty: 0,
            itemCount: 0,
          };
        }
        current = current.children[segment];
      });

      // Add item to the deepest level
      const qty = parseFloat(item.primaryquantity) || 0;
      current.items.push({
        ...item,
        item_number: item.itemnumber || item.item_number,
        item_description: item.itemdescription || item.item_description,
        quantity: qty,
      });
      current.totalQty += qty;
      current.itemCount += 1;

      // Propagate counts up the tree
      let path = hierarchy;
      segments.forEach((segment, idx) => {
        if (!segment) return;
        path.totalQty += qty;
        path.itemCount += 1;
        path = path.children[segment];
      });
    });

    return hierarchy;
  };

  // Get current level data based on drill path
  const getCurrentLevelData = (hierarchy, path) => {
    if (!hierarchy) return null;

    let current = hierarchy;
    for (const segment of path) {
      if (current.children && current.children[segment]) {
        current = current.children[segment];
      } else {
        return null;
      }
    }
    return current;
  };

  // Fetch Onhand by Lots (for By Item and By Lot tabs)
  const fetchLotsData = async (orgCode = null) => {
    setLotsLoading(true);
    try {
      let url = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY/getonhandbylots';
      if (orgCode) {
        url += `?organization_code=${orgCode}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      const items = data.items || [];
      setLotsData(items);

      // Group by item (organization_code, sub_inventory_code, item_number, item_description)
      const groupedByItem = items.reduce((acc, item) => {
        const key = `${item.organization_code}-${item.sub_inventory_code}-${item.item_number}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            organization_code: item.organization_code,
            sub_inventory_code: item.sub_inventory_code,
            item_number: item.item_number,
            item_description: item.item_description,
            locator: item.locator,
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
      setGroupedLotsData(Object.values(groupedByItem));

      // Group by Lot (lotnumber)
      const byLot = items.reduce((acc, item) => {
        const lotKey = item.lotnumber || 'NO_LOT';
        if (!acc[lotKey]) {
          acc[lotKey] = {
            id: lotKey,
            lotnumber: item.lotnumber || 'No Lot',
            organization_code: item.organization_code,
            sub_inventory_code: item.sub_inventory_code,
            materialstatus: item.materialstatus,
            expirationdate: item.expirationdate,
            totalQuantity: 0,
            items: [],
          };
        }
        acc[lotKey].totalQuantity += item.primaryquantity || 0;
        acc[lotKey].items.push({
          ...item,
          id: `${lotKey}-${item.item_number}-${item.lid}`,
        });
        return acc;
      }, {});
      setGroupedByLot(Object.values(byLot));

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

  // AI Stock Counting - Take Picture
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setCapturedImage(photo);
        setStockCountingMode('analyzing');
        // Start mock AI analysis
        analyzeImageWithAI(photo);
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image: ' + error.message);
      }
    }
  };

  // AI Stock Counting - Mock AI Analysis
  const analyzeImageWithAI = async (photo) => {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock AI results - In real implementation, this would call OpenAI Vision API
    const mockResults = [
      { id: '1', itemName: 'Cardboard Box - Large', count: Math.floor(Math.random() * 10) + 5, confidence: 94, color: '#3B82F6' },
      { id: '2', itemName: 'Cardboard Box - Medium', count: Math.floor(Math.random() * 15) + 8, confidence: 91, color: '#10B981' },
      { id: '3', itemName: 'Cardboard Box - Small', count: Math.floor(Math.random() * 20) + 10, confidence: 88, color: '#F59E0B' },
      { id: '4', itemName: 'Plastic Container', count: Math.floor(Math.random() * 5) + 2, confidence: 85, color: '#8B5CF6' },
      { id: '5', itemName: 'Wooden Pallet', count: Math.floor(Math.random() * 3) + 1, confidence: 96, color: '#EC4899' },
    ];

    // Randomly select 3-5 items to make it more realistic
    const numItems = Math.floor(Math.random() * 3) + 3;
    const shuffled = mockResults.sort(() => 0.5 - Math.random());
    const selectedResults = shuffled.slice(0, numItems);

    setAiCountResults(selectedResults);
    setStockCountingMode('results');
  };

  // AI Stock Counting - Update Count
  const updateItemCount = (itemId, newCount) => {
    setAiCountResults(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, count: parseInt(newCount) || 0, manuallyAdjusted: true } : item
      )
    );
  };

  // AI Stock Counting - Save Results
  const saveStockCount = () => {
    const totalItems = aiCountResults.reduce((sum, item) => sum + item.count, 0);
    Alert.alert(
      'Stock Count Saved',
      `Location: ${stockCountLocation || 'Not specified'}\nTotal Items: ${totalItems}\n\nItems counted:\n${aiCountResults.map(r => `• ${r.itemName}: ${r.count}`).join('\n')}`,
      [{ text: 'OK', onPress: resetStockCounting }]
    );
  };

  // AI Stock Counting - Reset
  const resetStockCounting = () => {
    setStockCountingMode('camera');
    setCapturedImage(null);
    setAiCountResults([]);
    setStockCountLocation('');
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
        asn_number: item.asn_number || '',
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
    asn_number: groupedPOs[docNum].asn_number,
  }));

  // Handle barcode scan - navigate to scanner
  const handleScanLocator = (item) => {
    setScanningForItem(item);
    setScanned(false); // Reset scan state
    navigateTo('BarcodeScanner');
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

    // Handle split line scanning
    if (scanningForSplitLine) {
      Alert.alert(
        'Scan Successful!',
        `Locator: ${data}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Confirm',
            style: 'default',
            onPress: () => {
              updateSplitLineLocator(scanningForSplitLine, data);
              setScanned(false);
              setCurrentScreen('ItemDetail');
            },
          },
        ]
      );
      return;
    }

    // Handle stock locator scanning
    if (scanningForItem === 'stockLocator') {
      Alert.alert(
        'Scan Successful!',
        `Locator: ${data}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Search',
            style: 'default',
            onPress: () => {
              setLocatorSearchQuery(data);
              setScanningForItem(null);
              setScanned(false);
              setCurrentScreen('StockLocators');
            },
          },
        ]
      );
      return;
    }

    if (scanningForItem) {
      const updatedItem = { ...scanningForItem, actualLocator: data };
      setSelectedItem(updatedItem);
      setScannedLocator(data); // Update scanned locator field
      setLocatorInput(data); // Sync Assigned field with Scanned field

      // Update the item in poData as well
      const updatedPoData = poData.map(item =>
        item.id === scanningForItem.id ? { ...item, actualLocator: data } : item
      );
      setPoData(updatedPoData);

      // Check locator status (Used/Free)
      checkLocatorStatus(data);
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

            <TouchableOpacity
              style={[styles.loginButton, loginLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.loginHint}>Use PICKER1/12345 to login</Text>
          </View>
        </View>

        {renderOrgModal()}
      </View>
    );
  }

  // ============= NEW HOME PAGE =============
  if (currentScreen === 'Home') {
    // Calculate ship orders KPIs
    const totalShipOrders = groupedShipOrders.length;
    const totalShipLines = shipOrdersData.length;

    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header with Bell Icon */}
        <View style={{ backgroundColor: COLORS.primary, paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>MobileWMS {APP_VERSION}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Welcome, {user?.name || 'User'} {selectedOrg ? `• ${selectedOrg}` : ''}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => Alert.alert('Notifications', 'No new notifications')}
                style={{ padding: 8, marginRight: 4 }}
              >
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 22 }}>🔔</Text>
                  <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.danger, width: 8, height: 8, borderRadius: 4 }} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20 }}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Overview KPI Cards */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 12 }}>Overview</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
            {/* POs/ASNs Card */}
            <TouchableOpacity
              style={{ width: '48%', backgroundColor: COLORS.receiveColor, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}
              onPress={() => { navigateTo('ReceiveGoods'); fetchPOData(); }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>POs/ASNs</Text>
                <Text style={{ fontSize: 16 }}>📥</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{kpiData.totalPOs}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{kpiData.pendingItems} Lines</Text>
            </TouchableOpacity>

            {/* Shipping Card */}
            <TouchableOpacity
              style={{ width: '48%', backgroundColor: COLORS.shipColor, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}
              onPress={() => { navigateTo('Ship'); fetchShipOrders(); }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>Shipping</Text>
                <Text style={{ fontSize: 16 }}>📤</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{totalShipOrders}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{totalShipLines} Lines</Text>
            </TouchableOpacity>

            {/* Supplier Returns Card */}
            <TouchableOpacity
              style={{ width: '48%', backgroundColor: COLORS.warning, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}
              onPress={() => Alert.alert('Coming Soon', 'Supplier Returns feature coming soon')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>Supplier Returns</Text>
                <Text style={{ fontSize: 16 }}>↩️</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>0</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>0 Lines</Text>
            </TouchableOpacity>

            {/* Order Returns Card */}
            <TouchableOpacity
              style={{ width: '48%', backgroundColor: COLORS.crmColor, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}
              onPress={() => Alert.alert('Coming Soon', 'Order Returns feature coming soon')}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>Order Returns</Text>
                <Text style={{ fontSize: 16 }}>🔄</Text>
              </View>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>0</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>0 Lines</Text>
            </TouchableOpacity>
          </View>

          {/* Modules Grid */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 12 }}>Modules</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
            {/* Inventory */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => navigateTo('InventoryModule')}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.inventoryColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>📦</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>Inventory</Text>
            </TouchableOpacity>

            {/* Receiving */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => { navigateTo('ReceiveGoods'); fetchPOData(); }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.receiveColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>📥</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>Receiving</Text>
            </TouchableOpacity>

            {/* Shipping */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => navigateTo('Ship')}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.shipColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>📤</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>Shipping</Text>
            </TouchableOpacity>

            {/* Orders */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => navigateTo('OrderManagementModule')}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.orderColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>📋</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>Orders</Text>
            </TouchableOpacity>

            {/* CRM */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => navigateTo('CRMModule')}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.crmColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>👥</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>CRM</Text>
            </TouchableOpacity>

            {/* Scanner */}
            <TouchableOpacity
              style={{ width: '31%', backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 }}
              onPress={() => navigateTo('Scanner')}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.scanColor, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>📷</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#333', fontWeight: '500' }}>Scanner</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={{ width: '23%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 1 }}
              onPress={() => setCurrentScreen('Scanner')}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>📷</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: '23%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 1 }}
              onPress={() => { setSearchOrgCode(selectedOrg || ''); setCurrentScreen('Inventory'); }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🔍</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: '23%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 1 }}
              onPress={onRefresh}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🔄</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: '23%', backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 1 }}
              onPress={handleLogout}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🚪</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8, paddingBottom: 12 }}>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setCurrentScreen('Home')}>
            <Text style={{ fontSize: 20 }}>🏠</Text>
            <Text style={{ fontSize: 10, color: COLORS.primary, fontWeight: '600' }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setCurrentScreen('InventoryModule')}>
            <Text style={{ fontSize: 20 }}>📦</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => { setCurrentScreen('ReceiveGoods'); fetchPOData(); }}>
            <Text style={{ fontSize: 20 }}>📥</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setCurrentScreen('Scanner')}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============= INVENTORY MODULE (Contains the old menu) =============
  if (currentScreen === 'InventoryModule') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={{ backgroundColor: '#C74634', paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{APP_VERSION}</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Inventory</Text>
          <TouchableOpacity onPress={() => Alert.alert('Notifications', 'No new notifications')}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Hamburger Menu */}
        {menuOpen && (
          <View style={styles.hamburgerMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuUserName}>{user?.name || 'User'}</Text>
              <Text style={styles.menuUserRole}>Warehouse Staff</Text>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setCurrentScreen('Dashboard'); }}>
              <Text style={styles.menuItemText}>🏠 Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setCurrentScreen('Inventory'); }}>
              <Text style={styles.menuItemText}>📦 Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); fetchOrganizationsList(); }}>
              <Text style={styles.menuItemText}>🏷️ Onhand by Lots</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuItemText, { color: COLORS.danger }]}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.dashboardContent}>
          <View style={styles.cardGrid}>
            {/* Inventory Card */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                setSearchOrgCode(selectedOrg || '');
                navigateTo('Inventory');
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.compactMenuIcon}>📦</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Onhand</Text>
            </TouchableOpacity>

            {/* Inventory by Lots */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                navigateTo('OnhandByLots');
                fetchLotsData();
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.compactMenuIcon}>🏷️</Text>
              </View>
              <Text style={styles.compactMenuTitle}>By Lots</Text>
            </TouchableOpacity>

            {/* Receive Goods */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                navigateTo('ReceiveGoods');
                fetchPOData();
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.compactMenuIcon}>📥</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Receive</Text>
            </TouchableOpacity>

            {/* Ship Orders */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                navigateTo('Ship');
                fetchShipOrders();
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.compactMenuIcon}>📤</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Ship</Text>
            </TouchableOpacity>

            {/* Scan Item */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => navigateTo('Scanner')}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.compactMenuIcon}>📷</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Scan</Text>
            </TouchableOpacity>

            {/* Stock Counts - AI Powered */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => navigateTo('StockCounting')}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#fce7f3' }]}>
                <Text style={styles.compactMenuIcon}>🤖</Text>
              </View>
              <Text style={styles.compactMenuTitle}>AI Count</Text>
            </TouchableOpacity>

            {/* Transfer Orders */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Transfer Orders feature coming soon')}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.compactMenuIcon}>🔄</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Transfers</Text>
            </TouchableOpacity>

            {/* Item Inquiry */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                setSearchOrgCode(selectedOrg || '');
                navigateTo('Inventory');
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.compactMenuIcon}>🔍</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Inquiry</Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Reports feature coming soon')}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#e0e7ff' }]}>
                <Text style={styles.compactMenuIcon}>📈</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Reports</Text>
            </TouchableOpacity>

            {/* APIs Reference */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => navigateTo('APIList')}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.compactMenuIcon}>🔌</Text>
              </View>
              <Text style={styles.compactMenuTitle}>APIs</Text>
            </TouchableOpacity>

            {/* Stock Locators */}
            <TouchableOpacity
              style={styles.compactMenuCard}
              onPress={() => {
                fetchStockLocators();
                navigateTo('StockLocators');
              }}
            >
              <View style={[styles.compactMenuIconBg, { backgroundColor: '#d1fae5' }]}>
                <Text style={styles.compactMenuIcon}>📍</Text>
              </View>
              <Text style={styles.compactMenuTitle}>Locators</Text>
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Purchase Orders</Text>
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
            renderItem={({ item }) => {
              // Calculate receiving status
              const totalLines = item.items?.length || 0;
              const receivedLines = item.items?.filter(i =>
                (i.processingstatuscode || i.PROCESSINGSTATUSCODE) === 'SUCCESS'
              ).length || 0;

              let statusText = 'Pending';
              let statusColor = COLORS.warning;
              let statusBg = COLORS.warningLight;

              if (totalLines > 0 && receivedLines === totalLines) {
                statusText = 'Fully Received';
                statusColor = COLORS.success;
                statusBg = COLORS.successLight;
              } else if (receivedLines > 0) {
                statusText = 'Partial';
                statusColor = COLORS.info;
                statusBg = COLORS.infoLight;
              }

              return (
                <TouchableOpacity
                  style={styles.poCard}
                  onPress={() => {
                    setSelectedPO(item);
                    navigateTo('POItems');
                  }}
                >
                  <View style={styles.poCardHeader}>
                    <Text style={styles.poNumber}>PO: {item.documentnumber}</Text>
                    <View style={[styles.itemCountBadge, { backgroundColor: COLORS.receiveColor }]}>
                      <Text style={styles.itemCountText}>{item.itemCount} items</Text>
                    </View>
                  </View>
                  {item.asn_number && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: COLORS.info, fontWeight: '600' }}>ASN: </Text>
                      <Text style={{ fontSize: 12, color: COLORS.info }}>{item.asn_number}</Text>
                    </View>
                  )}
                  <Text style={styles.poCardSubtext}>Vendor: {item.vendorname}</Text>

                  {/* Receiving Status */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
                    <View style={{
                      backgroundColor: statusBg,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor }}>
                        {statusText}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                      {receivedLines}/{totalLines} received
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header with Share Icon */}
        <View style={[styles.screenHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.screenTitle}>PO: {selectedPO.documentnumber}</Text>
          <TouchableOpacity
            onPress={handleSharePO}
            style={{ padding: 8 }}
          >
            <Text style={{ fontSize: 20, color: '#fff' }}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* PO Summary Card */}
        <View style={{ backgroundColor: COLORS.surface, margin: 12, marginBottom: 0, padding: 12, borderRadius: 8, ...SHADOWS.sm }}>
          {selectedPO.asn_number && (
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.info }}>ASN: </Text>
              <Text style={{ fontSize: 13, color: COLORS.info }}>{selectedPO.asn_number}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary }}>Supplier: </Text>
            <Text style={{ fontSize: 13, color: COLORS.text }}>{selectedPO.vendorname}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{selectedPO.itemCount} items</Text>
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
                setSelectedItem({ ...item, vendorname: selectedPO.vendorname, asn_number: selectedPO.asn_number || item.asn_number });
                setSplitLines([]); // Reset split lines for new item
                setSplitQtyInput1('');
                setSplitQtyInput2('');
                setLocatorInput(''); // Will be auto-assigned
                setScannedLocator(''); // Will be auto-assigned
                setExpirationDate(null); // Reset expiration date
                navigateTo('ItemDetail');
                // Auto-assign first available locator
                autoAssignLocatorForItem();
              }}
            >
              {/* Item Title - Code + Description */}
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 }} numberOfLines={2}>
                {item.itemnumber || 'Unknown'} - {item.itemdescription || 'No Description'}
              </Text>

              {/* Quantity Badge */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.success }}>Qty: {item.transactionquantity || 0}</Text>
                </View>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Line: {item.documentlinenumber || 'N/A'}</Text>
              </View>

              {/* Details Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>📍 {item.locator || 'No Locator'}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>🏢 {item.organizationcode || 'N/A'}</Text>
              </View>

              {/* Subinventory & Lot Number Row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {(item.subinventory || item.SUBINVENTORY) && <Text style={{ fontSize: 12, color: COLORS.info }}>📦 {item.subinventory || item.SUBINVENTORY}</Text>}
                <Text style={{ fontSize: 12, color: COLORS.warning }}>🏷️ Lot: {item.lotnumber || item.LOTNUMBER || item.lot_number || item.LOT_NUMBER || 'N/A'}</Text>
              </View>

              {/* Processing Status */}
              {(item.processingstatuscode || item.PROCESSINGSTATUSCODE) && (
                <View style={{ marginTop: 6 }}>
                  <View style={{
                    backgroundColor: (item.processingstatuscode || item.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.successLight : COLORS.warningLight,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: (item.processingstatuscode || item.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.success : COLORS.warning
                    }}>
                      {(item.processingstatuscode || item.PROCESSINGSTATUSCODE) === 'SUCCESS' ? '✓ Received' : item.processingstatuscode || item.PROCESSINGSTATUSCODE}
                    </Text>
                  </View>
                </View>
              )}
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header with Supplier + PO */}
        <View style={[styles.screenHeader, { justifyContent: 'center', paddingVertical: 10 }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }} numberOfLines={1}>
            {selectedItem.vendorname || 'Unknown Supplier'}, PO: {selectedPO?.documentnumber || 'N/A'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            {selectedItem.asn_number ? `ASN: ${selectedItem.asn_number}` : ''}
          </Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
          {/* Item Title Card - Code + Description + Qty + Split */}
          <View style={{ backgroundColor: COLORS.surface, margin: 12, padding: 12, borderRadius: 12, ...SHADOWS.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 8 }}>
                {selectedItem.itemnumber || 'Unknown'}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: COLORS.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.success }}>Qty: {selectedItem.transactionquantity || 0}</Text>
                </View>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginTop: 6 }} numberOfLines={2}>
              {selectedItem.itemdescription || 'No description available'}
            </Text>

            {/* Split Button - Show when no splits and not received */}
            {splitLines.length === 0 && (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS' && (
              <TouchableOpacity
                onPress={() => setShowSplitModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.warningLight,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: COLORS.warning,
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>✂️</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.warning }}>Split Quantity</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Split Lines Table - Show when splits exist */}
          {splitLines.length > 0 && (
            <View style={{ backgroundColor: '#FFFDE7', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FFF59D', ...SHADOWS.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary }}>SPLIT QUANTITIES</Text>
                {/* Hide Add Split when item is already received */}
                {(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS' && (
                  <TouchableOpacity onPress={() => setShowSplitModal(true)}>
                    <Text style={{ fontSize: 11, color: COLORS.info, fontWeight: '600' }}>+ Add Split</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Table Header */}
              <View style={{ flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#FFF59D', marginBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 50 }}>Qty</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, flex: 1 }}>Locator</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 50, textAlign: 'center' }}>Scan</Text>
              </View>

              {/* Split Lines */}
              {splitLines.map((line, index) => {
                const isReceived = (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS';
                return (
                  <View key={line.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: index < splitLines.length - 1 ? 1 : 0, borderBottomColor: '#FFF59D' }}>
                    <View style={{ width: 50 }}>
                      <View style={{ backgroundColor: COLORS.infoLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.info }}>{line.qty}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: line.scanned ? COLORS.success : COLORS.border,
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          fontSize: 12,
                          backgroundColor: isReceived ? COLORS.neutral100 : '#fff',
                          color: line.scanned ? COLORS.success : COLORS.text,
                        }}
                        value={line.locator || ''}
                        onChangeText={(text) => updateSplitLineLocator(line.id, text)}
                        placeholder="Scan or enter locator"
                        placeholderTextColor={COLORS.neutral400}
                        editable={!isReceived}
                      />
                    </View>
                    <View style={{ width: 75, flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
                      {/* Hide buttons when item is received */}
                      {!isReceived && (
                        <>
                          {/* Picker button - opens available locators */}
                          <TouchableOpacity
                            onPress={() => {
                              setPickingForSplitLine(line.id);
                              fetchAvailableLocators();
                              setShowLocatorPicker(true);
                            }}
                            style={{ backgroundColor: '#059669', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}
                          >
                            <Text style={{ fontSize: 11, color: '#fff' }}>📋</Text>
                          </TouchableOpacity>
                          {/* Scan button - opens camera */}
                          <TouchableOpacity
                            onPress={() => handleScanForSplitLine(line.id)}
                            style={{ backgroundColor: COLORS.secondary, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}
                          >
                            <Text style={{ fontSize: 11, color: '#fff' }}>📷</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {line.id !== 'original' && !isReceived && (
                        <TouchableOpacity
                          onPress={() => removeSplitLine(line.id)}
                          style={{ backgroundColor: COLORS.dangerLight, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 }}
                        >
                          <Text style={{ fontSize: 11, color: COLORS.danger }}>✕</Text>
                        </TouchableOpacity>
                      )}
                      {isReceived && (
                        <Text style={{ fontSize: 11, color: COLORS.success }}>✓</Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Total row */}
              <View style={{ flexDirection: 'row', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 50 }}>Total:</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.text }}>{splitLines.reduce((sum, l) => sum + l.qty, 0)}</Text>
              </View>
            </View>
          )}

          {/* Shipment Info - Compact */}
          <View style={{ backgroundColor: COLORS.surface, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 12, ...SHADOWS.sm }}>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary, width: 55 }}>Line ID:</Text>
              <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 1 }}>{selectedItem.lineid || selectedItem.LINEID || 'N/A'}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, width: 55 }}>Line No:</Text>
              <Text style={{ fontSize: 12, color: COLORS.text }}>{selectedItem.documentlinenumber || 'N/A'}</Text>
            </View>
            {/* Processing Status */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, width: 55 }}>Status:</Text>
              <View style={{
                backgroundColor: (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.successLight : COLORS.warningLight,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.success : COLORS.warning
                }}>
                  {(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? '✓ Received' : (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE || 'Pending')}
                </Text>
              </View>
            </View>
          </View>

          {/* Location Info */}
          <View style={{ backgroundColor: COLORS.surface, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, ...SHADOWS.sm }}>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, width: 80 }}>Org:</Text>
              <Text style={{ fontSize: 14, color: COLORS.text, flex: 1 }}>{selectedItem.organizationcode || 'N/A'}</Text>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.info, width: 80 }}>SubInv:</Text>
              <Text style={{ fontSize: 14, color: COLORS.text, flex: 1 }}>{selectedItem.subinventory || selectedItem.SUBINVENTORY || 'N/A'}</Text>
            </View>

            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.warning, width: 80 }}>Lot No:</Text>
              <Text style={{ fontSize: 14, color: COLORS.text, flex: 1 }}>{selectedItem.lotnumber || selectedItem.LOTNUMBER || selectedItem.lot_number || selectedItem.LOT_NUMBER || 'N/A'}</Text>
            </View>

            {/* Expiration Date Field */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.danger, width: 80 }}>Exp Date:</Text>
              <TouchableOpacity
                onPress={() => {
                  if ((selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS') {
                    setShowDatePicker(true);
                  }
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.neutral100 : '#fff',
                  borderWidth: 1,
                  borderColor: expirationDate ? COLORS.success : COLORS.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
                disabled={(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS'}
              >
                <Text style={{ fontSize: 14, color: expirationDate ? COLORS.text : COLORS.neutral400, flex: 1 }}>
                  {expirationDate ? expirationDate.toLocaleDateString() : 'Select date'}
                </Text>
                <Text style={{ fontSize: 16 }}>📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Locators Box - Only show when NOT in split mode */}
          {splitLines.length === 0 && (
            <View style={{ backgroundColor: COLORS.surface, marginHorizontal: 12, marginBottom: 8, padding: 14, borderRadius: 12, ...SHADOWS.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>📍 Locators</Text>
                {/* Locator Status Badge */}
                {locatorStatus && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: locatorStatus === 'free' ? '#d1fae5' : locatorStatus === 'used' ? '#fef3c7' : locatorStatus === 'checking' ? '#e0e7ff' : '#fee2e2',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    {locatorStatus === 'checking' && <ActivityIndicator size="small" color="#6366f1" style={{ marginRight: 4 }} />}
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: locatorStatus === 'free' ? '#059669' : locatorStatus === 'used' ? '#d97706' : locatorStatus === 'checking' ? '#6366f1' : '#dc2626',
                    }}>
                      {locatorStatus === 'free' ? '✓ Free' : locatorStatus === 'used' ? '⚠ Used' : locatorStatus === 'checking' ? 'Checking...' : '✗ Invalid'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Auto Assigned - Editable Text Field */}
              <View style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, width: 90 }}>Assigned:</Text>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: locatorInput ? COLORS.info : COLORS.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    backgroundColor: (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.neutral100 : '#fff',
                    color: COLORS.text,
                  }}
                  value={locatorInput}
                  onChangeText={(text) => {
                    setLocatorInput(text);
                    // Check status when manually typing (debounced effect would be better)
                  }}
                  placeholder="Enter or scan locator"
                  placeholderTextColor={COLORS.neutral400}
                  editable={(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS'}
                />
              </View>

              {/* Scanned - Editable Text Field with status icon and picker */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success, width: 90 }}>Scanned:</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: scannedLocator ? (locatorStatus === 'free' ? COLORS.success : locatorStatus === 'used' ? '#f59e0b' : COLORS.success) : COLORS.border,
                      borderRadius: 8,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      backgroundColor: scannedLocator ? (locatorStatus === 'free' ? COLORS.successLight : locatorStatus === 'used' ? '#fef3c7' : COLORS.successLight) : ((selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.neutral100 : '#fff'),
                      color: scannedLocator ? (locatorStatus === 'free' ? COLORS.success : locatorStatus === 'used' ? '#d97706' : COLORS.success) : COLORS.text,
                      fontWeight: scannedLocator ? '600' : 'normal',
                    }}
                    value={scannedLocator}
                    onChangeText={(text) => {
                      setScannedLocator(text);
                      setLocatorInput(text); // Sync with Assigned
                      if (text.length > 3) {
                        checkLocatorStatus(text);
                      } else {
                        setLocatorStatus(null);
                      }
                    }}
                    placeholder="Scan to fill"
                    placeholderTextColor={COLORS.neutral400}
                    editable={(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS'}
                  />
                  {/* Available Locators Picker Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS' ? COLORS.neutral200 : '#059669',
                      padding: 12,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if ((selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS') {
                        fetchAvailableLocators();
                        setShowLocatorPicker(true);
                      }
                    }}
                    disabled={(selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS'}
                  >
                    <Text style={{ fontSize: 16 }}>📍</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status hint */}
              {locatorStatus === 'used' && (
                <View style={{ marginTop: 8, backgroundColor: '#fef3c7', padding: 8, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#92400e' }}>⚠️ This locator already has items. You can still use it.</Text>
                </View>
              )}
            </View>
          )}

          {/* Serial Numbers - Only show after locator is scanned */}
          {selectedItem.actualLocator && (selectedItem.fromserialnumber || selectedItem.toserialnumber) && (
            <View style={{ backgroundColor: COLORS.infoLight, marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.info }}>
              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.info, width: 45 }}>From:</Text>
                <Text style={{ fontSize: 12, color: COLORS.text, flex: 1, fontFamily: 'monospace' }}>{selectedItem.fromserialnumber || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.info, width: 45 }}>To:</Text>
                <Text style={{ fontSize: 12, color: COLORS.text, flex: 1, fontFamily: 'monospace' }}>{selectedItem.toserialnumber || 'N/A'}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 12, paddingBottom: 24 }}>
            {/* Show Scan Pallet button only when no splits and not already received */}
            {splitLines.length === 0 && (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) !== 'SUCCESS' && (
              <TouchableOpacity
                style={{ backgroundColor: COLORS.secondary, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}
                onPress={() => handleScanLocator(selectedItem)}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>📷 Scan Pallet Locator</Text>
              </TouchableOpacity>
            )}

            {/* Confirm Receipt - disabled if already received, loading, splits not scanned, or locator empty */}
            {(() => {
              const isAlreadyReceived = (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS';
              const currentLocator = scannedLocator || locatorInput || '';
              const isLocatorEmpty = !currentLocator || currentLocator.trim() === '' || currentLocator.trim() === '----';
              const hasSplitLocatorIssue = splitLines.length > 0 && !allSplitLinesScanned();
              const hasNormalLocatorIssue = splitLines.length === 0 && isLocatorEmpty;
              const isDisabled = receivingLoading || isAlreadyReceived || hasSplitLocatorIssue || hasNormalLocatorIssue;
              // Green for already received, grey for other disabled states, green for enabled
              const buttonBg = isAlreadyReceived ? COLORS.success : (isDisabled ? COLORS.neutral400 : COLORS.success);

              // Determine button text
              let buttonText = '✓ Confirm Receipt';
              if (isAlreadyReceived) {
                buttonText = '✓ Already Received';
              } else if (hasSplitLocatorIssue) {
                buttonText = 'Assign all locators first';
              } else if (hasNormalLocatorIssue) {
                buttonText = 'Scan locator first';
              }

              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: buttonBg,
                    padding: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  disabled={isDisabled}
                  onPress={() => {
                if (splitLines.length > 0) {
                  // Split mode - show summary of all lines
                  const splitSummary = splitLines.map(l => `• Qty ${l.qty} → ${l.locator}`).join('\n');
                  Alert.alert(
                    'Confirm Receipt',
                    `Confirm receipt of ${selectedItem.itemnumber}?\n\nSplit Quantities:\n${splitSummary}\n\nTotal: ${splitLines.reduce((s, l) => s + l.qty, 0)}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm All',
                        onPress: () => processReceiving(),
                      },
                    ]
                  );
                } else {
                  // Normal mode
                  Alert.alert(
                    'Confirm Receipt',
                    `Confirm receipt of ${selectedItem.itemnumber}?\n\nQuantity: ${selectedItem.transactionquantity}\nLocator: ${locatorInput || 'N/A'}\nScanned: ${scannedLocator || 'N/A'}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: () => processReceiving(),
                      },
                    ]
                  );
                }
              }}
                >
                  {receivingLoading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
                      {buttonText}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}

            {/* View JSON Button - For debugging */}
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.neutral200,
                padding: 12,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              onPress={logReceivingJSON}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textSecondary }}>📋 View Receiving JSON</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Split Quantity Modal */}
        <Modal
          visible={showSplitModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSplitModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#FFFDE7', borderRadius: 16, padding: 20, width: '100%', maxWidth: 320, borderWidth: 1, borderColor: '#FFF59D' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>✂️ Split Quantity</Text>
              <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
                Total: {selectedItem.transactionquantity} | Available: {selectedItem.transactionquantity - splitLines.reduce((s, l) => s + l.qty, 0)}
              </Text>

              {/* Two split input fields */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' }}>Split 1</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 18,
                      textAlign: 'center',
                      backgroundColor: COLORS.surface,
                    }}
                    placeholder="Qty"
                    keyboardType="number-pad"
                    value={splitQtyInput1}
                    onChangeText={setSplitQtyInput1}
                    autoFocus
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' }}>Split 2</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 18,
                      textAlign: 'center',
                      backgroundColor: COLORS.surface,
                    }}
                    placeholder="Qty"
                    keyboardType="number-pad"
                    value={splitQtyInput2}
                    onChangeText={setSplitQtyInput2}
                  />
                </View>
              </View>

              <Text style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                Enter one or both quantities
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: COLORS.neutral200, padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setShowSplitModal(false);
                    setSplitQtyInput1('');
                    setSplitQtyInput2('');
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={handleSplitQty}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Split</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 320 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 16 }}>📅 Select Expiration Date</Text>

              {/* Quick Date Options */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>Quick Select:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[30, 60, 90, 180, 365].map(days => (
                    <TouchableOpacity
                      key={days}
                      onPress={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + days);
                        setExpirationDate(date);
                      }}
                      style={{
                        backgroundColor: COLORS.infoLight,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: COLORS.info, fontWeight: '600' }}>+{days}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Manual Date Input */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>Or enter date (DD/MM/YYYY):</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={expirationDate ? String(expirationDate.getDate()).padStart(2, '0') : ''}
                    onChangeText={(text) => {
                      const day = parseInt(text) || 1;
                      const current = expirationDate || new Date();
                      const newDate = new Date(current.getFullYear(), current.getMonth(), Math.min(day, 31));
                      setExpirationDate(newDate);
                    }}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={expirationDate ? String(expirationDate.getMonth() + 1).padStart(2, '0') : ''}
                    onChangeText={(text) => {
                      const month = parseInt(text) || 1;
                      const current = expirationDate || new Date();
                      const newDate = new Date(current.getFullYear(), Math.min(month - 1, 11), current.getDate());
                      setExpirationDate(newDate);
                    }}
                  />
                  <TextInput
                    style={{
                      flex: 1.5,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={expirationDate ? String(expirationDate.getFullYear()) : ''}
                    onChangeText={(text) => {
                      const year = parseInt(text) || new Date().getFullYear();
                      const current = expirationDate || new Date();
                      const newDate = new Date(year, current.getMonth(), current.getDate());
                      setExpirationDate(newDate);
                    }}
                  />
                </View>
              </View>

              {/* Selected Date Display */}
              {expirationDate && (
                <View style={{ backgroundColor: COLORS.successLight, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, color: COLORS.success, fontWeight: '600', textAlign: 'center' }}>
                    Selected: {expirationDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: COLORS.neutral200, padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setExpirationDate(null);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Processing Modal */}
        <Modal
          visible={showProcessingModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360, maxHeight: '80%' }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, flex: 1 }}>📤 Processing Receipt</Text>
                {processingItems.every(item => item.status === 'success' || item.status === 'error') && (
                  <TouchableOpacity onPress={() => setShowProcessingModal(false)}>
                    <Text style={{ fontSize: 24, color: COLORS.neutral400 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Processing Items List */}
              <ScrollView style={{ maxHeight: 300 }}>
                {processingItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: item.status === 'success' ? COLORS.successLight :
                                      item.status === 'error' ? COLORS.errorLight :
                                      item.status === 'processing' ? COLORS.infoLight :
                                      COLORS.neutral100,
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: item.status === 'success' ? COLORS.success :
                                  item.status === 'error' ? COLORS.error :
                                  item.status === 'processing' ? COLORS.info :
                                  COLORS.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Status Icon */}
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: item.status === 'success' ? COLORS.success :
                                        item.status === 'error' ? COLORS.error :
                                        item.status === 'processing' ? COLORS.info :
                                        COLORS.neutral300,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        {item.status === 'pending' && (
                          <Text style={{ fontSize: 14, color: '#fff' }}>⏳</Text>
                        )}
                        {item.status === 'processing' && (
                          <ActivityIndicator size="small" color="#fff" />
                        )}
                        {item.status === 'success' && (
                          <Text style={{ fontSize: 16, color: '#fff' }}>✓</Text>
                        )}
                        {item.status === 'error' && (
                          <Text style={{ fontSize: 16, color: '#fff' }}>✗</Text>
                        )}
                      </View>

                      {/* Item Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: item.status === 'success' ? COLORS.success :
                                item.status === 'error' ? COLORS.error :
                                item.status === 'processing' ? COLORS.info :
                                COLORS.text,
                        }}>
                          {item.label}
                        </Text>
                        <Text style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                        }}>
                          📍 {item.locator}
                        </Text>
                        {item.message && (
                          <Text style={{
                            fontSize: 11,
                            color: item.status === 'error' ? COLORS.error : COLORS.textSecondary,
                            marginTop: 4,
                            fontStyle: 'italic',
                          }}>
                            {item.message}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Status Summary */}
              {processingItems.length > 0 && (
                <View style={{ marginTop: 16, padding: 12, backgroundColor: COLORS.neutral100, borderRadius: 8 }}>
                  {processingItems.every(item => item.status === 'success') ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>🎉</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>All items processed successfully!</Text>
                    </View>
                  ) : processingItems.some(item => item.status === 'error') && processingItems.every(item => item.status === 'success' || item.status === 'error') ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>⚠️</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.error }}>
                        {processingItems.filter(i => i.status === 'error').length} item(s) failed
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                        Processing {processingItems.filter(i => i.status === 'success').length}/{processingItems.length}...
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Close Button - only show when all done */}
              {processingItems.every(item => item.status === 'success' || item.status === 'error') && (
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: processingItems.every(i => i.status === 'success') ? COLORS.success : COLORS.primary,
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowProcessingModal(false)}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                    {processingItems.every(i => i.status === 'success') ? '✓ Done' : 'Close'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Locator Picker Modal */}
        <Modal
          visible={showLocatorPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLocatorPicker(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>📍 Available Locators</Text>
                <TouchableOpacity onPress={() => setShowLocatorPicker(false)}>
                  <Text style={{ fontSize: 24, color: COLORS.neutral400 }}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Search Filter */}
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <TextInput
                  style={{
                    backgroundColor: COLORS.neutral100,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                  placeholder="🔍 Search locators..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={locatorInput}
                  onChangeText={(text) => setLocatorInput(text)}
                />
              </View>

              {/* Content */}
              {locatorPickerLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 12 }}>Loading available locators...</Text>
                </View>
              ) : (
                <FlatList
                  data={availableLocators.filter(loc =>
                    !locatorInput || loc.locatorName.toLowerCase().includes(locatorInput.toLowerCase())
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  style={{ maxHeight: 400 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
                  ListEmptyComponent={
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
                      <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>No available locators found</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.successLight,
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: COLORS.success,
                      }}
                      onPress={() => {
                        // Case 1: Add to temp selected (will be hidden until screen exit)
                        setSelectedLocatorsTemp(prev => {
                          const newSet = new Set(prev);
                          newSet.add(item.locatorName.toUpperCase());
                          return newSet;
                        });

                        if (pickingForSplitLine) {
                          // Update split line locator
                          updateSplitLineLocator(pickingForSplitLine, item.locatorName);
                          setPickingForSplitLine(null);
                        } else {
                          // Set both locator fields (normal mode)
                          setLocatorInput(item.locatorName);
                          setScannedLocator(item.locatorName);
                          // Update selectedItem
                          setSelectedItem(prev => ({
                            ...prev,
                            actualLocator: item.locatorName,
                          }));
                          // Check status (should be free)
                          setLocatorStatus('free');
                        }
                        // Close modal
                        setShowLocatorPicker(false);
                      }}
                    >
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: COLORS.success,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 16 }}>✓</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: 'monospace' }}>{item.locatorName}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.success, marginTop: 2 }}>Free • Ready to use</Text>
                      </View>
                      <Text style={{ fontSize: 20 }}>→</Text>
                    </TouchableOpacity>
                  )}
                />
              )}

              {/* Footer */}
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' }}>
                  Showing {availableLocators.filter(loc => !locatorInput || loc.locatorName.toLowerCase().includes(locatorInput.toLowerCase())).length} free locators
                  {confirmedLocators.size > 0 ? ` • ${confirmedLocators.size} used` : ''}
                </Text>

                {/* Refresh Button - Reset confirmed locators */}
                {confirmedLocators.size > 0 && (
                  <TouchableOpacity
                    style={{
                      marginTop: 12,
                      backgroundColor: COLORS.infoLight,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: COLORS.info,
                    }}
                    onPress={() => {
                      setConfirmedLocators(new Set());
                      setSelectedLocatorsTemp(new Set());
                      fetchAvailableLocators();
                      console.log('Refreshed: Cleared all confirmed locators');
                    }}
                  >
                    <Text style={{ fontSize: 13, color: COLORS.info, fontWeight: '600' }}>🔄 Refresh All Locators</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={{ backgroundColor: '#C74634', paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Inventory Onhand</Text>
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
                navigateTo('BarcodeScanner');
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

  // Scanner Screen - Full Scanner Implementation
  if (currentScreen === 'Scanner') {
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

          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelScanButton}
            onPress={() => setCurrentScreen('Home')}
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
            setScanned(true);
            Vibration.vibrate(100);
            Alert.alert(
              'Barcode Scanned',
              `Type: ${result.type}\nData: ${result.data}`,
              [
                {
                  text: 'Scan Again',
                  onPress: () => setScanned(false),
                },
                {
                  text: 'Done',
                  onPress: () => {
                    setScanned(false);
                    setCurrentScreen('Home');
                  },
                },
              ]
            );
          }}
        />

        {/* Overlay */}
        <View style={styles.scannerOverlay}>
          {/* Top Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerBackButton}
              onPress={() => {
                setScanned(false);
                setCurrentScreen('Home');
              }}
            >
              <Text style={styles.scannerBackText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <TouchableOpacity
              style={styles.torchButton}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Text style={styles.torchIcon}>{torchOn ? '🔦' : '💡'}</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerFrameContainer}>
            <View style={styles.scannerFrame}>
              <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
            </View>
            <Text style={styles.scannerHint}>Position barcode within frame</Text>
          </View>

          {/* Bottom Actions */}
          <View style={styles.scannerActions}>
            {scanned && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ============= API LIST SCREEN =============
  if (currentScreen === 'APIList') {
    const apiList = [
      {
        page: 'Login',
        apis: [
          {
            name: 'User Authentication (APEX)',
            method: 'GET',
            url: 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/Login',
            params: 'username, password',
            description: 'Validates user credentials'
          }
        ]
      },
      {
        page: 'Receive Goods',
        apis: [
          {
            name: 'Get Putaway Details (APEX)',
            method: 'GET',
            url: `${API_BASE}/PUTAWAYDETAILS`,
            params: 'PICKER_NAME',
            description: 'Fetches pending putaway items for receiving'
          },
          {
            name: 'Process Receipt (FUSION)',
            method: 'POST',
            url: 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline',
            params: 'JSON body with receipt details',
            description: 'Sends receipt to Oracle Fusion ERP'
          },
          {
            name: 'Update Status (APEX)',
            method: 'POST',
            url: 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline',
            params: 'p_status, p_line_id (URL params)',
            description: 'Updates receipt status in APEX DB'
          }
        ]
      },
      {
        page: 'Item Inquiry (Onhand)',
        apis: [
          {
            name: 'Get Organizations List (APEX)',
            method: 'GET',
            url: `${API_BASE}/getorgnizationslist`,
            params: 'None',
            description: 'Fetches list of organizations'
          },
          {
            name: 'Get Onhand Inventory (APEX)',
            method: 'GET',
            url: `${API_BASE}/getonhand`,
            params: 'orgainzation_code, subinventory (optional)',
            description: 'Fetches onhand inventory by org and subinventory'
          }
        ]
      },
      {
        page: 'Stock Locators',
        apis: [
          {
            name: 'Get Locators (FUSION)',
            method: 'GET',
            url: `${ORACLE_FUSION_BASE}/subinventories/.../child/locators`,
            params: 'offset, limit',
            description: 'Fetches all locators from Oracle Fusion (master list)'
          },
          {
            name: 'Get Onhand by Locator (APEX)',
            method: 'GET',
            url: `${API_BASE}/getonhandsbylocator`,
            params: 'organizationcode',
            description: 'Fetches onhand items grouped by locator (Used/Free status)'
          }
        ]
      },
      {
        page: 'Lots Inquiry',
        apis: [
          {
            name: 'Get Onhand by Lots (APEX)',
            method: 'GET',
            url: `${API_BASE}/getonhandbylots`,
            params: 'organizationcode, subinventory (optional)',
            description: 'Fetches inventory grouped by lot numbers'
          },
          {
            name: 'Get Onhand by Locator (APEX)',
            method: 'GET',
            url: `${API_BASE}/getonhandsbylocator`,
            params: 'organizationcode',
            description: 'Fetches inventory grouped by locator'
          }
        ]
      },
      {
        page: 'Picking',
        apis: [
          {
            name: 'Get Pending Picking Details (APEX)',
            method: 'GET',
            url: `${API_BASE}/pendingpickingdetails`,
            params: 'None',
            description: 'Fetches pending picking tasks'
          }
        ]
      },
      {
        page: 'Item Details (Locator Validation)',
        apis: [
          {
            name: 'Check Locator Status (APEX)',
            method: 'GET',
            url: `${API_BASE}/getonhandsbylocator`,
            params: 'organizationcode',
            description: 'Checks if locator is Used or Free'
          },
          {
            name: 'Get Available Locators (FUSION)',
            method: 'GET',
            url: `${ORACLE_FUSION_BASE}/subinventories/.../child/locators`,
            params: 'offset, limit',
            description: 'Fetches free locators for picker modal'
          }
        ]
      }
    ];

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: '#f59e0b' }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('InventoryModule')} style={{ padding: 8 }}>
            <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { flex: 1, textAlign: 'center' }]}>🔌 API Reference</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('DataFlowDiagram')} style={{ padding: 8 }}>
            <Text style={{ color: '#fff', fontSize: 20 }}>📊</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info + Flow Diagram Button */}
        <View style={{ backgroundColor: '#fef3c7', padding: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#92400e', flex: 1 }}>
            App Version: {APP_VERSION} | Total APIs: {apiList.reduce((sum, page) => sum + page.apis.length, 0)}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentScreen('DataFlowDiagram')}
            style={{ backgroundColor: '#1e3a5f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>📊 Flow Diagram</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
          {apiList.map((section, sectionIdx) => (
            <View key={sectionIdx} style={{ marginBottom: 16 }}>
              {/* Page Header */}
              <View style={{
                backgroundColor: '#1e3a5f',
                padding: 10,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                  📄 {section.page}
                </Text>
              </View>

              {/* APIs for this page */}
              {section.apis.map((api, apiIdx) => (
                <View key={apiIdx} style={{
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: api.method === 'GET' ? '#10b981' : '#f59e0b',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2
                }}>
                  {/* API Name & Method */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{
                      backgroundColor: api.method === 'GET' ? '#d1fae5' : '#fef3c7',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                      marginRight: 8
                    }}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: api.method === 'GET' ? '#059669' : '#d97706'
                      }}>
                        {api.method}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e3a5f', flex: 1 }}>
                      {api.name}
                    </Text>
                  </View>

                  {/* URL */}
                  <View style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4, marginBottom: 6 }}>
                    <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }} numberOfLines={2}>
                      {api.url}
                    </Text>
                  </View>

                  {/* Params */}
                  <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                    <Text style={{ fontWeight: '600' }}>Params:</Text> {api.params}
                  </Text>

                  {/* Description */}
                  <Text style={{ fontSize: 11, color: '#475569' }}>
                    {api.description}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* Footer */}
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: '#94a3b8' }}>
              🔌 MobileWMS API Reference | {APP_VERSION}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============= DATA FLOW DIAGRAM SCREEN =============
  if (currentScreen === 'DataFlowDiagram') {
    const flowSteps = [
      { id: 0, title: 'Start', desc: 'User opens Receive Goods', icon: '📱', color: '#6366f1' },
      { id: 1, title: 'Fetch Data (APEX)', desc: 'GET /PUTAWAYDETAILS', icon: '📥', color: '#f59e0b' },
      { id: 2, title: 'Display Items', desc: 'Show pending PO items', icon: '📋', color: '#10b981' },
      { id: 3, title: 'User Action', desc: 'Scan locator & confirm', icon: '📷', color: '#8b5cf6' },
      { id: 4, title: 'Process (FUSION)', desc: 'POST receipt to Oracle', icon: '☁️', color: '#ef4444' },
      { id: 5, title: 'Update (APEX)', desc: 'POST status update', icon: '✅', color: '#f59e0b' },
      { id: 6, title: 'Complete', desc: 'Receipt confirmed!', icon: '🎉', color: '#10b981' },
    ];

    // Start animation sequence
    const startAnimation = () => {
      setIsAnimating(true);
      setFlowStep(0);
      arrowAnim1.setValue(0);
      arrowAnim2.setValue(0);
      arrowAnim3.setValue(0);
      arrowAnim4.setValue(0);
      arrowAnim5.setValue(0);

      const stepDuration = 1500;

      // Animate through each step
      const animateStep = (step, arrowAnim) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            setFlowStep(step);
            if (arrowAnim) {
              Animated.timing(arrowAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
              }).start();
            }
            Vibration.vibrate(50);
            resolve();
          }, stepDuration);
        });
      };

      // Run animation sequence
      (async () => {
        await animateStep(1, arrowAnim1);
        await animateStep(2, arrowAnim2);
        await animateStep(3, arrowAnim3);
        await animateStep(4, arrowAnim4);
        await animateStep(5, arrowAnim5);
        await animateStep(6, null);
        setIsAnimating(false);
      })();
    };

    // Reset animation
    const resetAnimation = () => {
      setIsAnimating(false);
      setFlowStep(0);
      arrowAnim1.setValue(0);
      arrowAnim2.setValue(0);
      arrowAnim3.setValue(0);
      arrowAnim4.setValue(0);
      arrowAnim5.setValue(0);
    };

    // Arrow component
    const AnimatedArrow = ({ anim, direction = 'down' }) => {
      const width = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      });

      return (
        <View style={{ alignItems: 'center', marginVertical: 4 }}>
          <Animated.View style={{
            height: direction === 'down' ? 24 : 2,
            width: direction === 'down' ? 3 : width,
            backgroundColor: '#3b82f6',
            borderRadius: 2,
          }} />
          <Text style={{ color: '#3b82f6', fontSize: 12, marginTop: -4 }}>
            {direction === 'down' ? '▼' : '→'}
          </Text>
        </View>
      );
    };

    // Flow node component
    const FlowNode = ({ step, isActive, isPast }) => {
      const scale = isActive ? pulseAnim : 1;
      const bgColor = isPast ? step.color : (isActive ? step.color : '#e2e8f0');
      const textColor = isPast || isActive ? '#fff' : '#64748b';
      const borderColor = isActive ? '#1e3a5f' : 'transparent';

      return (
        <Animated.View style={{
          transform: [{ scale }],
          backgroundColor: bgColor,
          borderRadius: 12,
          padding: 12,
          marginVertical: 4,
          borderWidth: isActive ? 3 : 0,
          borderColor: borderColor,
          shadowColor: isActive ? step.color : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isActive ? 0.4 : 0,
          shadowRadius: 8,
          elevation: isActive ? 8 : 2,
          minWidth: 200,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>{step.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: 10, color: textColor, opacity: 0.9 }}>
                {step.desc}
              </Text>
            </View>
            {isPast && <Text style={{ fontSize: 16 }}>✓</Text>}
          </View>
        </Animated.View>
      );
    };

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

        {/* Header */}
        <View style={[styles.screenHeader, { backgroundColor: '#1e3a5f' }]}>
          <TouchableOpacity onPress={() => setCurrentScreen('APIList')} style={{ padding: 8 }}>
            <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { flex: 1, textAlign: 'center' }]}>📊 PO Receipt Flow</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Legend */}
        <View style={{ backgroundColor: '#f8fafc', padding: 12, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#f59e0b', marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#64748b' }}>APEX</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444', marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#64748b' }}>FUSION</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#8b5cf6', marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#64748b' }}>User Action</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', marginRight: 4 }} />
            <Text style={{ fontSize: 10, color: '#64748b' }}>App</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
          {/* Title */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 16, textAlign: 'center' }}>
            PO Receipt Data Flow
          </Text>

          {/* Flow Diagram */}
          <View style={{ alignItems: 'center' }}>
            {flowSteps.map((step, idx) => (
              <View key={step.id} style={{ alignItems: 'center' }}>
                <FlowNode
                  step={step}
                  isActive={flowStep === step.id && isAnimating}
                  isPast={flowStep > step.id || (flowStep === 6 && step.id === 6)}
                />
                {idx < flowSteps.length - 1 && (
                  <AnimatedArrow
                    anim={[arrowAnim1, arrowAnim2, arrowAnim3, arrowAnim4, arrowAnim5][idx] || new Animated.Value(flowStep > idx ? 1 : 0)}
                  />
                )}
              </View>
            ))}
          </View>

          {/* API Details Box */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e3a5f', marginBottom: 12 }}>
              📡 API Calls in This Flow
            </Text>

            {/* API 1 */}
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#d97706' }}>APEX</Text>
                </View>
                <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#059669' }}>GET</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>1. Get Putaway Details</Text>
              <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>/ords/test/INVENTORY/PUTAWAYDETAILS</Text>
            </View>

            {/* API 2 */}
            <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#dc2626' }}>FUSION</Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#d97706' }}>POST</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>2. Process Receipt</Text>
              <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline</Text>
              <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Body: JSON with receipt details (Qty, Locator, etc.)</Text>
            </View>

            {/* API 3 */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#d97706' }}>APEX</Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#d97706' }}>POST</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#334155' }}>3. Update Status</Text>
              <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>/ords/test/FUSIONCLIENTERP/inventory/poreceiveoneline</Text>
              <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Params: p_status=UPDATE, p_line_id=xxx</Text>
            </View>
          </View>

          {/* System Architecture */}
          <View style={{
            backgroundColor: '#1e3a5f',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            width: '100%',
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 12, textAlign: 'center' }}>
              🏗️ System Architecture
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#6366f1', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 24 }}>📱</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>Mobile App</Text>
              </View>
              <Text style={{ color: '#60a5fa', fontSize: 20 }}>⟷</Text>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#f59e0b', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 24 }}>🗄️</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>APEX DB</Text>
              </View>
              <Text style={{ color: '#60a5fa', fontSize: 20 }}>⟷</Text>
              <View style={{ alignItems: 'center' }}>
                <View style={{ backgroundColor: '#ef4444', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontSize: 24 }}>☁️</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>Oracle Fusion</Text>
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Bottom Controls */}
        <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: isAnimating ? '#94a3b8' : '#10b981',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={startAnimation}
              disabled={isAnimating}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                {isAnimating ? '⏳ Animating...' : '▶️ Start Animation'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#64748b',
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
                paddingHorizontal: 20,
              }}
              onPress={resetAnimation}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ============= STOCK LOCATORS SCREEN =============
  if (currentScreen === 'StockLocators') {
    // Extract distinct segment values from locators
    const getSegmentValues = () => {
      const seg1Set = new Set();
      const seg2Set = new Set();
      const seg3Set = new Set();

      mappedLocators.forEach(loc => {
        const parts = (loc.locatorName || '').split('-');
        if (parts[0]) seg1Set.add(parts[0]);
        if (parts[1]) seg2Set.add(parts[1]);
        if (parts[2]) seg3Set.add(parts[2]);
      });

      return {
        seg1: Array.from(seg1Set).sort(),
        seg2: Array.from(seg2Set).sort(),
        seg3: Array.from(seg3Set).sort(),
      };
    };

    const segmentValues = getSegmentValues();

    // Filter locators based on search, segment filters, and tab
    const filteredLocators = mappedLocators.filter(loc => {
      const locatorName = loc.locatorName || '';
      const parts = locatorName.split('-');

      // Text search filter
      const matchesSearch = !locatorSearchQuery ||
        locatorName.toLowerCase().includes(locatorSearchQuery.toLowerCase());

      // Segment filters
      const matchesSeg1 = !segmentFilters.seg1 || parts[0] === segmentFilters.seg1;
      const matchesSeg2 = !segmentFilters.seg2 || parts[1] === segmentFilters.seg2;
      const matchesSeg3 = !segmentFilters.seg3 || parts[2] === segmentFilters.seg3;

      // Tab filter
      const matchesTab = stockLocatorsTab === 'all' || loc.status === 'Free';

      return matchesSearch && matchesSeg1 && matchesSeg2 && matchesSeg3 && matchesTab;
    });

    const usedCount = mappedLocators.filter(l => l.status === 'Used').length;
    const freeCount = mappedLocators.filter(l => l.status === 'Free').length;

    const hasActiveFilters = segmentFilters.seg1 || segmentFilters.seg2 || segmentFilters.seg3;

    const clearAllFilters = () => {
      setSegmentFilters({ seg1: '', seg2: '', seg3: '' });
      setLocatorSearchQuery('');
      setShowSegmentDropdown(null);
    };

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />

        {/* Header */}
        <View style={{ backgroundColor: '#059669', paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={goBack} style={{ padding: 4 }}>
              <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Stock Locators</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                {locatorSubinventory} • {selectedOrg || 'MLCECLAIM'}
              </Text>
            </View>
            <TouchableOpacity onPress={fetchStockLocators} style={{ padding: 4 }}>
              <Text style={{ fontSize: 20, color: '#fff' }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Collapsible Search Section */}
        <TouchableOpacity
          style={{
            backgroundColor: '#fff',
            padding: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => setSearchExpanded(!searchExpanded)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Search & Filters</Text>
            {(hasActiveFilters || locatorSearchQuery) && (
              <View style={{
                backgroundColor: '#059669',
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 8,
              }}>
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>
                  {[segmentFilters.seg1, segmentFilters.seg2, segmentFilters.seg3, locatorSearchQuery].filter(Boolean).length} active
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Quick Scan Button - always visible */}
            <TouchableOpacity
              style={{ backgroundColor: '#059669', padding: 8, borderRadius: 6, marginRight: 8 }}
              onPress={(e) => {
                e.stopPropagation();
                setScanningForInventory(false);
                setScanningForItem('stockLocator');
                setScanned(false);
                navigateTo('BarcodeScanner');
              }}
            >
              <Text style={{ fontSize: 14, color: '#fff' }}>📷</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, color: COLORS.neutral400 }}>{searchExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {/* Expanded Search Content */}
        {searchExpanded && (
          <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
            {/* Search Input */}
            <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.neutral100, borderRadius: 8, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14 }}
                  placeholder="Type locator name..."
                  value={locatorSearchQuery}
                  onChangeText={setLocatorSearchQuery}
                  autoCapitalize="characters"
                />
                {locatorSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLocatorSearchQuery('')}>
                    <Text style={{ fontSize: 16, color: COLORS.neutral400 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Segment Filter Dropdowns */}
            <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginRight: 8 }}>Filter by Segment:</Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearAllFilters}>
                    <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '500' }}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Segment 1 Dropdown */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: segmentFilters.seg1 ? '#d1fae5' : COLORS.neutral100,
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: segmentFilters.seg1 ? '#059669' : COLORS.border,
                }}
                onPress={() => setShowSegmentDropdown(showSegmentDropdown === 'seg1' ? null : 'seg1')}
              >
                <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 }}>Area</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: segmentFilters.seg1 ? '#059669' : COLORS.text }}>
                    {segmentFilters.seg1 || 'All'}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.neutral400 }}>▼</Text>
                </View>
              </TouchableOpacity>
              {showSegmentDropdown === 'seg1' && (
                <View style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  zIndex: 100,
                  elevation: 5,
                  maxHeight: 200,
                }}>
                  <ScrollView>
                    <TouchableOpacity
                      style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                      onPress={() => { setSegmentFilters(p => ({ ...p, seg1: '' })); setShowSegmentDropdown(null); }}
                    >
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>All</Text>
                    </TouchableOpacity>
                    {segmentValues.seg1.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: segmentFilters.seg1 === val ? '#d1fae5' : '#fff' }}
                        onPress={() => { setSegmentFilters(p => ({ ...p, seg1: val })); setShowSegmentDropdown(null); }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: segmentFilters.seg1 === val ? '600' : '400', color: segmentFilters.seg1 === val ? '#059669' : COLORS.text }}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Segment 2 Dropdown */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: segmentFilters.seg2 ? '#dbeafe' : COLORS.neutral100,
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: segmentFilters.seg2 ? '#3b82f6' : COLORS.border,
                }}
                onPress={() => setShowSegmentDropdown(showSegmentDropdown === 'seg2' ? null : 'seg2')}
              >
                <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 }}>Bin</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: segmentFilters.seg2 ? '#3b82f6' : COLORS.text }}>
                    {segmentFilters.seg2 || 'All'}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.neutral400 }}>▼</Text>
                </View>
              </TouchableOpacity>
              {showSegmentDropdown === 'seg2' && (
                <View style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  zIndex: 100,
                  elevation: 5,
                  maxHeight: 200,
                }}>
                  <ScrollView>
                    <TouchableOpacity
                      style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                      onPress={() => { setSegmentFilters(p => ({ ...p, seg2: '' })); setShowSegmentDropdown(null); }}
                    >
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>All</Text>
                    </TouchableOpacity>
                    {segmentValues.seg2.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: segmentFilters.seg2 === val ? '#dbeafe' : '#fff' }}
                        onPress={() => { setSegmentFilters(p => ({ ...p, seg2: val })); setShowSegmentDropdown(null); }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: segmentFilters.seg2 === val ? '600' : '400', color: segmentFilters.seg2 === val ? '#3b82f6' : COLORS.text }}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Segment 3 Dropdown */}
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: segmentFilters.seg3 ? '#fef3c7' : COLORS.neutral100,
                  borderRadius: 8,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: segmentFilters.seg3 ? '#f59e0b' : COLORS.border,
                }}
                onPress={() => setShowSegmentDropdown(showSegmentDropdown === 'seg3' ? null : 'seg3')}
              >
                <Text style={{ fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 }}>Column</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: segmentFilters.seg3 ? '#f59e0b' : COLORS.text }}>
                    {segmentFilters.seg3 || 'All'}
                  </Text>
                  <Text style={{ fontSize: 10, color: COLORS.neutral400 }}>▼</Text>
                </View>
              </TouchableOpacity>
              {showSegmentDropdown === 'seg3' && (
                <View style={{
                  position: 'absolute',
                  top: 52,
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  zIndex: 100,
                  elevation: 5,
                  maxHeight: 200,
                }}>
                  <ScrollView>
                    <TouchableOpacity
                      style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                      onPress={() => { setSegmentFilters(p => ({ ...p, seg3: '' })); setShowSegmentDropdown(null); }}
                    >
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>All</Text>
                    </TouchableOpacity>
                    {segmentValues.seg3.map(val => (
                      <TouchableOpacity
                        key={val}
                        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: segmentFilters.seg3 === val ? '#fef3c7' : '#fff' }}
                        onPress={() => { setSegmentFilters(p => ({ ...p, seg3: val })); setShowSegmentDropdown(null); }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: segmentFilters.seg3 === val ? '600' : '400', color: segmentFilters.seg3 === val ? '#f59e0b' : COLORS.text }}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: stockLocatorsTab === 'all' ? '#059669' : 'transparent',
            }}
            onPress={() => setStockLocatorsTab('all')}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: stockLocatorsTab === 'all' ? '#059669' : COLORS.textSecondary,
            }}>
              All ({mappedLocators.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: stockLocatorsTab === 'available' ? '#059669' : 'transparent',
            }}
            onPress={() => setStockLocatorsTab('available')}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: stockLocatorsTab === 'available' ? '#059669' : COLORS.textSecondary,
            }}>
              Available ({freeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: stockLocatorsTab === 'map' ? '#059669' : 'transparent',
            }}
            onPress={() => setStockLocatorsTab('map')}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: stockLocatorsTab === 'map' ? '#059669' : COLORS.textSecondary,
            }}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats - hide on map view */}
        {stockLocatorsTab !== 'map' && (
        <View style={{ flexDirection: 'row', padding: 12, backgroundColor: '#f0fdf4', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#059669' }}>{usedCount}</Text>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Used</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10b981' }}>{freeCount}</Text>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Free</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6b7280' }}>{filteredLocators.length}</Text>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Showing</Text>
          </View>
        </View>
        )}

        {/* Locators List - for All and Available tabs */}
        {stockLocatorsTab !== 'map' && (
          locatorsLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading locators...</Text>
            </View>
          ) : filteredLocators.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📍</Text>
              <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
                {(locatorSearchQuery || hasActiveFilters) ? 'No locators match your filters' : 'No locators found'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearAllFilters} style={{ marginTop: 12, padding: 10 }}>
                  <Text style={{ color: '#059669', fontWeight: '600' }}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredLocators}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 12 }}
              onScrollBeginDrag={() => setShowSegmentDropdown(null)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: item.status === 'Used' ? '#f59e0b' : '#10b981',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }}
                  onPress={() => {
                    if (item.status === 'Used' && item.items.length > 0) {
                      setSelectedLocatorDetail(item);
                      navigateTo('LocatorDetail');
                    } else {
                      Alert.alert('Free Locator', `${item.locatorName} is available for use.`);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>
                        📍 {item.locatorName}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                        {item.subinventory} • {item.statusCode}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: item.status === 'Used' ? '#fef3c7' : '#d1fae5',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: item.status === 'Used' ? '#d97706' : '#059669',
                      }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {item.status === 'Used' && (
                    <View style={{ flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#d97706' }}>{item.itemCount}</Text>
                        <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Items</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669' }}>{item.totalQuantity.toFixed(0)}</Text>
                        <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Total Qty</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#6366f1' }}>View →</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )
        )}

        {/* Warehouse Map View */}
        {stockLocatorsTab === 'map' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
            {/* Legend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12, gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 16, backgroundColor: '#10b981', borderRadius: 3, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Free</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 16, backgroundColor: '#fbbf24', borderRadius: 3, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Low</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 16, backgroundColor: '#f97316', borderRadius: 3, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Medium</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 16, backgroundColor: '#ef4444', borderRadius: 3, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>High</Text>
              </View>
            </View>

            {/* Map by Area (Segment 1) */}
            {(() => {
              // Group locators by Area (seg1) and Bin (seg2)
              const areaGroups = {};
              mappedLocators.forEach(loc => {
                const parts = (loc.locatorName || '').split('-');
                const area = parts[0] || 'Unknown';
                const bin = parts[1] || '';
                const col = parts[2] || '';
                const row = parts[3] || '';

                if (!areaGroups[area]) {
                  areaGroups[area] = { bins: {}, totalUsed: 0, totalFree: 0, totalQty: 0 };
                }
                if (!areaGroups[area].bins[bin]) {
                  areaGroups[area].bins[bin] = [];
                }
                areaGroups[area].bins[bin].push(loc);
                if (loc.status === 'Used') {
                  areaGroups[area].totalUsed++;
                  areaGroups[area].totalQty += loc.totalQuantity || 0;
                } else {
                  areaGroups[area].totalFree++;
                }
              });

              // Get heat color based on quantity
              const getHeatColor = (loc) => {
                if (loc.status === 'Free') return '#10b981'; // Green
                const qty = loc.totalQuantity || 0;
                if (qty <= 10) return '#fbbf24'; // Yellow - Low
                if (qty <= 50) return '#f97316'; // Orange - Medium
                return '#ef4444'; // Red - High
              };

              return Object.entries(areaGroups).sort().map(([area, data]) => (
                <View key={area} style={{ marginBottom: 16 }}>
                  {/* Area Header */}
                  <View style={{
                    backgroundColor: '#059669',
                    padding: 10,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                      📍 Area {area}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Text style={{ color: '#fff', fontSize: 11 }}>
                        Used: {data.totalUsed}
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 11 }}>
                        Free: {data.totalFree}
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 11 }}>
                        Qty: {data.totalQty.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {/* Bins Grid */}
                  <View style={{
                    backgroundColor: '#fff',
                    padding: 10,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderColor: COLORS.border
                  }}>
                    {Object.entries(data.bins).sort().map(([bin, locators]) => (
                      <View key={bin} style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' }}>
                          Bin {bin}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                          {locators.sort((a, b) => (a.locatorName || '').localeCompare(b.locatorName || '')).map(loc => {
                            const parts = (loc.locatorName || '').split('-');
                            const shortName = parts.slice(2).join('-') || loc.locatorName;
                            return (
                              <TouchableOpacity
                                key={loc.id}
                                style={{
                                  backgroundColor: getHeatColor(loc),
                                  paddingHorizontal: 6,
                                  paddingVertical: 4,
                                  borderRadius: 4,
                                  minWidth: 50,
                                  alignItems: 'center',
                                }}
                                onPress={() => {
                                  if (loc.status === 'Used' && loc.items.length > 0) {
                                    setSelectedLocatorDetail(loc);
                                    navigateTo('LocatorDetail');
                                  } else {
                                    Alert.alert(
                                      `${loc.locatorName}`,
                                      `Status: ${loc.status}\nItems: ${loc.itemCount}\nQty: ${loc.totalQuantity.toFixed(0)}`,
                                      [{ text: 'OK' }]
                                    );
                                  }
                                }}
                              >
                                <Text style={{ fontSize: 9, color: '#fff', fontWeight: '600' }}>
                                  {shortName}
                                </Text>
                                {loc.status === 'Used' && (
                                  <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)' }}>
                                    {loc.totalQuantity.toFixed(0)}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ));
            })()}

            {/* Summary Card */}
            <View style={{
              backgroundColor: '#f0fdf4',
              padding: 16,
              borderRadius: 10,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#bbf7d0'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669', marginBottom: 8 }}>
                📊 Warehouse Overview
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#059669' }}>{usedCount}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Used Locators</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>{freeCount}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Free Locators</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6b7280' }}>
                    {((usedCount / mappedLocators.length) * 100).toFixed(0)}%
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>Utilization</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
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

  // ============= LOCATOR DETAIL SCREEN (Drill-down) =============
  if (currentScreen === 'LocatorDetail') {
    const locator = selectedLocatorDetail;
    if (!locator) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: COLORS.textSecondary }}>No locator selected</Text>
          <TouchableOpacity onPress={goBack} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#d97706" />

        {/* Header */}
        <View style={{ backgroundColor: '#d97706', paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={goBack} style={{ padding: 4 }}>
              <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
            </TouchableOpacity>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>📍 {locator.locatorName}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                {locator.subinventory} • {locator.itemCount} items • {locator.totalQuantity.toFixed(0)} qty
              </Text>
            </View>
          </View>
        </View>

        {/* Items in this Locator */}
        <FlatList
          data={locator.items}
          keyExtractor={(item, index) => `${item.itemnumber || index}-${index}`}
          contentContainerStyle={{ padding: 12 }}
          ListHeaderComponent={() => (
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 12 }}>
              Items in this Locator
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
              elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>
                    {item.itemnumber || item.item_number || 'N/A'}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }} numberOfLines={2}>
                    {item.itemdescription || item.item_description || ''}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>
                    {parseFloat(item.primaryquantity || 0).toFixed(0)} {item.uom || ''}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                {item.lotnumber && (
                  <View style={{ backgroundColor: COLORS.neutral100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Lot: {item.lotnumber}</Text>
                  </View>
                )}
                {item.subinventorycode && (
                  <View style={{ backgroundColor: COLORS.neutral100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Sub: {item.subinventorycode}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: COLORS.textSecondary }}>No items in this locator</Text>
            </View>
          )}
        />

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

  // ============= AI STOCK COUNTING SCREEN =============
  if (currentScreen === 'StockCounting') {
    // Camera permission check
    if (!permission) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>Camera Access Required</Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            AI Stock Counting needs camera access to capture shelf images for analysis.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={requestPermission}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={goBack}>
            <Text style={{ color: COLORS.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={[styles.screenHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => { resetStockCounting(); goBack(); }}>
            <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>🤖 AI Stock Count</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Camera Mode */}
        {stockCountingMode === 'camera' && (
          <View style={{ flex: 1 }}>
            {/* Location Input */}
            <View style={{ backgroundColor: COLORS.surface, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Rack/Shelf Location</Text>
              <TextInput
                style={{ backgroundColor: COLORS.background, padding: 10, borderRadius: 8, fontSize: 14 }}
                placeholder="Enter location (e.g., A-01-03)"
                value={stockCountLocation}
                onChangeText={setStockCountLocation}
              />
            </View>

            {/* Camera View */}
            <View style={{ flex: 1 }}>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="back"
              />

              {/* Overlay */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                {/* Frame Guide */}
                <View style={{ width: '85%', height: '60%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 12, borderStyle: 'dashed' }}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      📦 Point camera at shelf/rack
                    </Text>
                  </View>
                </View>
              </View>

              {/* Capture Button */}
              <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg }}
                  onPress={takePicture}
                >
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28 }}>📸</Text>
                  </View>
                </TouchableOpacity>
                <Text style={{ color: '#fff', marginTop: 8, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                  Tap to capture & analyze
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Analyzing Mode */}
        {stockCountingMode === 'analyzing' && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
            {capturedImage && (
              <View style={{ width: 200, height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 24, ...SHADOWS.md }}>
                <View style={{ flex: 1, backgroundColor: COLORS.neutral300, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 48 }}>📷</Text>
                </View>
              </View>
            )}
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginTop: 16 }}>🤖 AI Analyzing Image...</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
              Identifying and counting items on the shelf
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 24 }}>
              <Text style={{ fontSize: 12, color: COLORS.info }}>🔍 Detecting objects...</Text>
            </View>
          </View>
        )}

        {/* Results Mode */}
        {stockCountingMode === 'results' && (
          <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Results Header */}
            <View style={{ backgroundColor: COLORS.successLight, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>✅</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.success }}>Analysis Complete</Text>
                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  {stockCountLocation ? `Location: ${stockCountLocation}` : 'Location not specified'} • {aiCountResults.length} item types detected
                </Text>
              </View>
            </View>

            {/* Results List */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 }}>DETECTED ITEMS (tap count to adjust)</Text>

              {aiCountResults.map((item, index) => (
                <View key={item.id} style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, ...SHADOWS.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 20 }}>📦</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.text }}>{item.itemName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View style={{ backgroundColor: item.confidence >= 90 ? COLORS.successLight : COLORS.warningLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ fontSize: 11, color: item.confidence >= 90 ? COLORS.success : COLORS.warning }}>
                            {item.confidence}% confidence
                          </Text>
                        </View>
                        {item.manuallyAdjusted && (
                          <Text style={{ fontSize: 11, color: COLORS.info, marginLeft: 8 }}>✏️ Adjusted</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <TextInput
                        style={{ width: 60, height: 44, backgroundColor: COLORS.background, borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: item.color }}
                        value={String(item.count)}
                        onChangeText={(text) => updateItemCount(item.id, text)}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Total */}
              <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Total Items</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
                  {aiCountResults.reduce((sum, item) => sum + item.count, 0)}
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ padding: 12, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: COLORS.neutral200, padding: 14, borderRadius: 12, alignItems: 'center' }}
                  onPress={resetStockCounting}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>🔄 Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 2, backgroundColor: COLORS.success, padding: 14, borderRadius: 12, alignItems: 'center' }}
                  onPress={saveStockCount}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>✓ Save Count</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Ship Orders</Text>
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
                  navigateTo('ShipOrderLines');
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Order Lines - {selectedShipOrder.source_order_number}</Text>
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
          <StatusBar barStyle="light-content" backgroundColor="#C74634" />
          <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
            <Text style={styles.screenTitle}>Scan Serial</Text>
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

  // Get unique organizations from lotsData
  const uniqueOrganizations = [...new Set(lotsData.map(item => item.organization_code))].filter(Boolean);

  // Get unique products for autofill (filtered by selected org if any) - use item_description
  const uniqueProductDescriptions = lotsData
    .filter(item => !lotsOrgFilter || item.organization_code === lotsOrgFilter)
    .reduce((acc, item) => {
      if (item.item_description && !acc.find(p => p.description === item.item_description)) {
        acc.push({
          item_number: item.item_number,
          description: item.item_description,
        });
      }
      return acc;
    }, []);

  // Filter org suggestions
  const orgSuggestions = uniqueOrganizations.filter(org =>
    org.toLowerCase().includes(lotsOrgFilter.toLowerCase())
  );

  // Filter product suggestions by description
  const productSuggestions = uniqueProductDescriptions.filter(prod =>
    prod.description.toLowerCase().includes(lotsProductFilter.toLowerCase()) ||
    prod.item_number.toLowerCase().includes(lotsProductFilter.toLowerCase())
  ).slice(0, 10);

  // Apply filters to all grouped data
  const applyLotsFilters = (data, isLocatorTab = false) => {
    return data.filter(item => {
      // For locator tab, be more lenient with org matching or skip it since we already filtered by org in API
      const matchesOrg = !lotsOrgFilter ||
        item.organization_code === lotsOrgFilter ||
        (isLocatorTab && true); // Skip org filter for locator tab as API already filters

      // For locator groups, check items array for product match
      let matchesProduct = !lotsProductFilter;
      if (!matchesProduct) {
        if (item.item_number && item.item_number.toLowerCase().includes(lotsProductFilter.toLowerCase())) {
          matchesProduct = true;
        } else if (item.item_description && item.item_description.toLowerCase().includes(lotsProductFilter.toLowerCase())) {
          matchesProduct = true;
        } else if (item.items && item.items.length > 0) {
          // Check nested items for locator groups
          matchesProduct = item.items.some(i =>
            (i.item_number && i.item_number.toLowerCase().includes(lotsProductFilter.toLowerCase())) ||
            (i.item_description && i.item_description.toLowerCase().includes(lotsProductFilter.toLowerCase()))
          );
        }
      }

      // For locator groups, check items array for search match
      let matchesSearch = !lotsSearchQuery;
      if (!matchesSearch) {
        const query = lotsSearchQuery.toLowerCase();
        if (item.item_number && item.item_number.toLowerCase().includes(query)) {
          matchesSearch = true;
        } else if (item.item_description && item.item_description.toLowerCase().includes(query)) {
          matchesSearch = true;
        } else if (item.lotnumber && item.lotnumber.toLowerCase().includes(query)) {
          matchesSearch = true;
        } else if (item.locator && item.locator.toLowerCase().includes(query)) {
          matchesSearch = true;
        } else if (item.items && item.items.length > 0) {
          // Check nested items for locator groups
          matchesSearch = item.items.some(i =>
            (i.item_number && i.item_number.toLowerCase().includes(query)) ||
            (i.item_description && i.item_description.toLowerCase().includes(query))
          );
        }
      }
      return matchesOrg && matchesProduct && matchesSearch;
    });
  };

  // Organization Selection Screen for Lots
  if (currentScreen === 'LotsOrgSelection') {
    // Get distinct warehouses
    const distinctWarehouses = [...new Set(organizationsList.map(org => org.warehouse_code))].filter(Boolean);

    // Get subinventories for selected warehouse
    const warehouseSubinventories = selectedWarehouse
      ? organizationsList.filter(org => org.warehouse_code === selectedWarehouse)
      : [];

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Select Organization</Text>
        </View>

        {orgsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading organizations...</Text>
          </View>
        ) : organizationsList.length > 0 ? (
          <ScrollView contentContainerStyle={styles.lotsOrgList}>
            {/* Warehouse Selection */}
            <View style={styles.orgSectionContainer}>
              <Text style={styles.orgSectionTitle}>Warehouse</Text>
              <View style={styles.orgChipsContainer}>
                {distinctWarehouses.map((warehouse, index) => (
                  <TouchableOpacity
                    key={warehouse || `wh-${index}`}
                    style={[
                      styles.orgChip,
                      selectedWarehouse === warehouse && styles.orgChipSelected
                    ]}
                    onPress={() => {
                      setSelectedWarehouse(warehouse);
                      setSelectedSubinventory(null);
                    }}
                  >
                    <Text style={[
                      styles.orgChipText,
                      selectedWarehouse === warehouse && styles.orgChipTextSelected
                    ]}>
                      {warehouse}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subinventory Selection - Only show when warehouse is selected */}
            {selectedWarehouse && warehouseSubinventories.length > 0 && (
              <View style={styles.orgSectionContainer}>
                <Text style={styles.orgSectionTitle}>Subinventory</Text>
                <View style={styles.orgChipsContainer}>
                  {warehouseSubinventories.map((org, index) => (
                    <TouchableOpacity
                      key={org.subinventory_code || `sub-${index}`}
                      style={[
                        styles.orgChip,
                        selectedSubinventory === org.subinventory_code && styles.orgChipSelected
                      ]}
                      onPress={() => setSelectedSubinventory(org.subinventory_code)}
                    >
                      <Text style={[
                        styles.orgChipText,
                        selectedSubinventory === org.subinventory_code && styles.orgChipTextSelected
                      ]}>
                        {org.subinventory_code}
                      </Text>
                      {org.subinventory_name && (
                        <Text style={[
                          styles.orgChipSubtext,
                          selectedSubinventory === org.subinventory_code && styles.orgChipSubtextSelected
                        ]}>
                          {org.subinventory_name}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Selection Summary */}
            {selectedWarehouse && (
              <View style={styles.orgSelectionSummary}>
                <Text style={styles.orgSelectionLabel}>Selected:</Text>
                <Text style={styles.orgSelectionValue}>
                  {selectedWarehouse}
                  {selectedSubinventory ? ` / ${selectedSubinventory}` : ' (All Subinventories)'}
                </Text>
              </View>
            )}

            {/* Get Data Button */}
            {selectedWarehouse && (
              <TouchableOpacity
                style={styles.getDataButton}
                onPress={() => {
                  const orgCode = selectedWarehouse;
                  console.log('Get Data for org:', orgCode, 'subinv:', selectedSubinventory);
                  setLotsSelectedOrg(orgCode);
                  setLotsOrgFilter(orgCode);
                  // Fetch both APIs with selected org
                  fetchLotsData(orgCode);
                  fetchLocatorData(orgCode);
                  setCurrentScreen('OnhandByLots');
                }}
              >
                <Text style={styles.getDataButtonText}>Get Data</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🏭</Text>
            <Text style={styles.emptyStateText}>No organizations found</Text>
            <Text style={styles.emptyStateHint}>Check your network connection or API</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setOrganizationsList([]);
                fetchOrganizationsList();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Locator Global View Screen - Hierarchical drill-down
  if (currentScreen === 'LocatorGlobalView') {
    const currentLevel = getCurrentLevelData(locatorHierarchy, locatorDrillPath);
    const levelNames = ['AREA', 'BIN', 'COLUMN', 'ROW', 'SHELVING'];
    const levelIcons = ['🏢', '📦', '🗂️', '📋', '🔖'];
    const levelColors = [COLORS.primary, COLORS.info, COLORS.success, COLORS.warning, COLORS.accent];
    const currentDepth = locatorDrillPath.length;
    const currentLevelName = currentDepth > 0 ? levelNames[currentDepth - 1] : 'WAREHOUSE';
    const nextLevelName = levelNames[currentDepth] || 'ITEMS';

    const childrenArray = currentLevel ? Object.values(currentLevel.children) : [];
    const hasChildren = childrenArray.length > 0;
    const items = currentLevel?.items || [];

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Global Locator View</Text>
        </View>

        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumbContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.breadcrumbItem}
              onPress={() => setLocatorDrillPath([])}
            >
              <Text style={styles.breadcrumbIcon}>🏭</Text>
              <Text style={[styles.breadcrumbText, locatorDrillPath.length === 0 && styles.breadcrumbTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {locatorDrillPath.map((segment, idx) => (
              <View key={idx} style={styles.breadcrumbItemWrapper}>
                <Text style={styles.breadcrumbSeparator}>›</Text>
                <TouchableOpacity
                  style={styles.breadcrumbItem}
                  onPress={() => setLocatorDrillPath(locatorDrillPath.slice(0, idx + 1))}
                >
                  <Text style={styles.breadcrumbIcon}>{levelIcons[idx] || '📍'}</Text>
                  <Text style={[
                    styles.breadcrumbText,
                    idx === locatorDrillPath.length - 1 && styles.breadcrumbTextActive
                  ]}>
                    {segment}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Current Level Info */}
        <View style={styles.levelInfoContainer}>
          <View style={[styles.levelInfoBadge, { backgroundColor: levelColors[currentDepth] || COLORS.primary }]}>
            <Text style={styles.levelInfoBadgeText}>
              {currentDepth === 0 ? 'WAREHOUSE' : currentLevelName}
            </Text>
          </View>
          <View style={styles.levelInfoStats}>
            <Text style={styles.levelInfoStatsText}>
              {hasChildren ? `${childrenArray.length} ${nextLevelName}${childrenArray.length !== 1 ? 's' : ''}` : `${items.length} Items`}
            </Text>
            <Text style={styles.levelInfoQtyText}>
              {(currentLevel?.totalQty || 0).toLocaleString()} Total Qty
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.globalViewContent}>
          {hasChildren ? (
            /* Show children as cards */
            <View style={styles.hierarchyGrid}>
              {childrenArray.map((child, idx) => (
                <TouchableOpacity
                  key={child.name}
                  style={[styles.hierarchyCard, { borderLeftColor: levelColors[currentDepth] || COLORS.primary }]}
                  onPress={() => setLocatorDrillPath([...locatorDrillPath, child.name])}
                >
                  <View style={styles.hierarchyCardHeader}>
                    <View style={[styles.hierarchyCardIcon, { backgroundColor: levelColors[currentDepth] || COLORS.primary }]}>
                      <Text style={styles.hierarchyCardIconText}>{levelIcons[currentDepth] || '📍'}</Text>
                    </View>
                    <View style={styles.hierarchyCardInfo}>
                      <Text style={styles.hierarchyCardName}>{child.name}</Text>
                      <Text style={styles.hierarchyCardLevel}>{child.level}</Text>
                    </View>
                    <Text style={styles.hierarchyCardArrow}>→</Text>
                  </View>
                  <View style={styles.hierarchyCardStats}>
                    <View style={styles.hierarchyCardStat}>
                      <Text style={styles.hierarchyCardStatValue}>
                        {Object.keys(child.children).length || child.items.length}
                      </Text>
                      <Text style={styles.hierarchyCardStatLabel}>
                        {Object.keys(child.children).length > 0 ? levelNames[currentDepth + 1] || 'Sub' : 'Items'}
                      </Text>
                    </View>
                    <View style={styles.hierarchyCardStat}>
                      <Text style={styles.hierarchyCardStatValue}>{child.itemCount}</Text>
                      <Text style={styles.hierarchyCardStatLabel}>Total Items</Text>
                    </View>
                    <View style={styles.hierarchyCardStat}>
                      <Text style={styles.hierarchyCardStatValue}>{child.totalQty.toLocaleString()}</Text>
                      <Text style={styles.hierarchyCardStatLabel}>Qty</Text>
                    </View>
                  </View>
                  {/* Mini progress bar showing relative quantity */}
                  <View style={styles.hierarchyProgressBar}>
                    <View
                      style={[
                        styles.hierarchyProgressFill,
                        {
                          width: `${Math.min(100, (child.totalQty / (currentLevel?.totalQty || 1)) * 100)}%`,
                          backgroundColor: levelColors[currentDepth] || COLORS.primary,
                        }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : items.length > 0 ? (
            /* Show items at leaf level */
            <View style={styles.leafItemsContainer}>
              <Text style={styles.leafItemsTitle}>Items in {locatorDrillPath[locatorDrillPath.length - 1] || 'Location'}</Text>
              {items.map((item, idx) => (
                <View key={idx} style={styles.leafItemCard}>
                  <View style={styles.leafItemHeader}>
                    <Text style={styles.leafItemNumber}>{item.item_number}</Text>
                    <View style={styles.leafItemQtyBadge}>
                      <Text style={styles.leafItemQtyText}>{item.quantity.toLocaleString()}</Text>
                    </View>
                  </View>
                  <Text style={styles.leafItemDescription} numberOfLines={2}>
                    {item.item_description}
                  </Text>
                  <View style={styles.leafItemMeta}>
                    <Text style={styles.leafItemMetaText}>
                      {item.subinventorycode || item.sub_inventory_code}
                    </Text>
                    {item.primaryuomcode && (
                      <Text style={styles.leafItemMetaText}>UOM: {item.primaryuomcode}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📍</Text>
              <Text style={styles.emptyStateText}>No items at this location</Text>
            </View>
          )}
        </ScrollView>

        {/* Visual Warehouse Map (simplified 2D view) */}
        {currentDepth === 0 && childrenArray.length > 0 && (
          <View style={styles.warehouseMapContainer}>
            <Text style={styles.warehouseMapTitle}>Warehouse Overview</Text>
            <View style={styles.warehouseMapGrid}>
              {childrenArray.slice(0, 8).map((area, idx) => (
                <TouchableOpacity
                  key={area.name}
                  style={styles.warehouseMapCell}
                  onPress={() => setLocatorDrillPath([area.name])}
                >
                  <Text style={styles.warehouseMapCellText}>{area.name}</Text>
                  <Text style={styles.warehouseMapCellQty}>{area.itemCount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  // Onhand by Lots Screen with Tabs (Grouped View)
  if (currentScreen === 'OnhandByLots') {
    const filteredByItem = applyLotsFilters(groupedLotsData);
    const filteredByLot = applyLotsFilters(groupedByLot);
    const filteredByLocator = applyLotsFilters(groupedByLocator, true);

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Onhand by Lots</Text>
        </View>

        {/* Organization Selector */}
        <TouchableOpacity
          style={styles.lotsOrgSelector}
          onPress={() => {
            setCurrentScreen('LotsOrgSelection');
          }}
        >
          <Text style={styles.lotsOrgSelectorIcon}>🏭</Text>
          <Text style={styles.lotsOrgSelectorText}>
            {lotsSelectedOrg || 'Select Organization'}
          </Text>
          <Text style={styles.lotsOrgSelectorArrow}>▼</Text>
        </TouchableOpacity>

        {/* Tab Navigation */}
        <View style={styles.lotsTabContainer}>
          <TouchableOpacity
            style={[styles.lotsTab, lotsActiveTab === 'byItem' && styles.lotsTabActive]}
            onPress={() => setLotsActiveTab('byItem')}
          >
            <Text style={[styles.lotsTabText, lotsActiveTab === 'byItem' && styles.lotsTabTextActive]}>By Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.lotsTab, lotsActiveTab === 'byLot' && styles.lotsTabActive]}
            onPress={() => setLotsActiveTab('byLot')}
          >
            <Text style={[styles.lotsTabText, lotsActiveTab === 'byLot' && styles.lotsTabTextActive]}>By Lot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.lotsTab, lotsActiveTab === 'byLocator' && styles.lotsTabActive]}
            onPress={() => setLotsActiveTab('byLocator')}
          >
            <Text style={[styles.lotsTabText, lotsActiveTab === 'byLocator' && styles.lotsTabTextActive]}>By Locator</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.lotsFilterContainer}>
          {/* Organization Filter */}
          <View style={styles.lotsFilterRow}>
            <View style={styles.lotsFilterField}>
              <Text style={styles.lotsFilterLabel}>Organization</Text>
              <View style={styles.lotsAutocompleteContainer}>
                <TextInput
                  style={styles.lotsFilterInput}
                  placeholder="Filter by org..."
                  value={lotsOrgFilter}
                  onChangeText={(text) => {
                    setLotsOrgFilter(text);
                    setShowLotsOrgDropdown(text.length > 0);
                  }}
                  onFocus={() => setShowLotsOrgDropdown(lotsOrgFilter.length > 0)}
                />
                {lotsOrgFilter.length > 0 && (
                  <TouchableOpacity style={styles.lotsFilterClear} onPress={() => {
                    setLotsOrgFilter('');
                    setShowLotsOrgDropdown(false);
                  }}>
                    <Text style={styles.lotsFilterClearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showLotsOrgDropdown && orgSuggestions.length > 0 && (
                <View style={styles.lotsDropdown}>
                  {orgSuggestions.slice(0, 5).map(org => (
                    <TouchableOpacity
                      key={org}
                      style={styles.lotsDropdownItem}
                      onPress={() => {
                        setLotsOrgFilter(org);
                        setShowLotsOrgDropdown(false);
                      }}
                    >
                      <Text style={styles.lotsDropdownText}>{org}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Product Filter */}
            <View style={styles.lotsFilterField}>
              <Text style={styles.lotsFilterLabel}>Product</Text>
              <View style={styles.lotsAutocompleteContainer}>
                <TextInput
                  style={styles.lotsFilterInput}
                  placeholder="Filter by product..."
                  value={lotsProductFilter}
                  onChangeText={(text) => {
                    setLotsProductFilter(text);
                    setShowLotsProductDropdown(text.length > 0);
                  }}
                  onFocus={() => setShowLotsProductDropdown(lotsProductFilter.length > 0)}
                />
                {lotsProductFilter.length > 0 && (
                  <TouchableOpacity style={styles.lotsFilterClear} onPress={() => {
                    setLotsProductFilter('');
                    setShowLotsProductDropdown(false);
                  }}>
                    <Text style={styles.lotsFilterClearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showLotsProductDropdown && productSuggestions.length > 0 && (
                <View style={styles.lotsDropdown}>
                  {productSuggestions.map(prod => (
                    <TouchableOpacity
                      key={prod.item_number}
                      style={styles.lotsDropdownItem}
                      onPress={() => {
                        setLotsProductFilter(prod.description);
                        setShowLotsProductDropdown(false);
                      }}
                    >
                      <Text style={styles.lotsDropdownText} numberOfLines={1}>{prod.description}</Text>
                      <Text style={styles.lotsDropdownSubtext}>{prod.item_number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.lotsSearchRow}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
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
        </View>

        {lotsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading lots data...</Text>
          </View>
        ) : (
          <>
            {/* BY ITEM TAB */}
            {lotsActiveTab === 'byItem' && (
              <>
                <View style={styles.lotsStatsContainer}>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>{filteredByItem.length}</Text>
                    <Text style={styles.lotStatLabel}>Items</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByItem.reduce((sum, item) => sum + item.lots.length, 0)}
                    </Text>
                    <Text style={styles.lotStatLabel}>Lots</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByItem.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}
                    </Text>
                    <Text style={styles.lotStatLabel}>Total Qty</Text>
                  </View>
                </View>

                {filteredByItem.length > 0 ? (
                  <FlatList
                    data={filteredByItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.lotsList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.lotItemCard}
                        onPress={() => {
                          setSelectedLotItem(item);
                          navigateTo('LotDetails');
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
                              {item.locator && (
                                <View style={styles.locatorBadge}>
                                  <Text style={styles.locatorBadgeText}>📍 {item.locator}</Text>
                                </View>
                              )}
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
                    <Text style={styles.emptyStateText}>No items found</Text>
                  </View>
                )}
              </>
            )}

            {/* BY LOT TAB */}
            {lotsActiveTab === 'byLot' && (
              <>
                <View style={styles.lotsStatsContainer}>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>{filteredByLot.length}</Text>
                    <Text style={styles.lotStatLabel}>Lots</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByLot.reduce((sum, lot) => sum + lot.items.length, 0)}
                    </Text>
                    <Text style={styles.lotStatLabel}>Items</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByLot.reduce((sum, lot) => sum + lot.totalQuantity, 0).toLocaleString()}
                    </Text>
                    <Text style={styles.lotStatLabel}>Total Qty</Text>
                  </View>
                </View>

                {filteredByLot.length > 0 ? (
                  <FlatList
                    data={filteredByLot}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.lotsList}
                    renderItem={({ item: lot }) => (
                      <TouchableOpacity
                        style={styles.lotItemCard}
                        onPress={() => {
                          setSelectedLotGroup(lot);
                          navigateTo('LotGroupItems');
                        }}
                      >
                        <View style={styles.lotItemHeader}>
                          <View style={styles.lotItemInfo}>
                            <Text style={styles.lotItemNumber}>{lot.lotnumber}</Text>
                            <View style={styles.lotBadgeRow}>
                              <View style={[
                                styles.statusBadgeSmall,
                                { backgroundColor: lot.materialstatus === 'Active' ? COLORS.successLight : COLORS.warningLight }
                              ]}>
                                <Text style={[
                                  styles.statusBadgeSmallText,
                                  { color: lot.materialstatus === 'Active' ? COLORS.success : COLORS.warning }
                                ]}>
                                  {lot.materialstatus || 'Unknown'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.lotQtyContainer}>
                            <Text style={styles.lotTotalQty}>{lot.totalQuantity.toLocaleString()}</Text>
                            <Text style={styles.lotQtyLabel}>Total Qty</Text>
                          </View>
                        </View>

                        {lot.expirationdate && (
                          <Text style={styles.lotExpirationText}>
                            Expires: {new Date(lot.expirationdate).toLocaleDateString()}
                          </Text>
                        )}

                        <View style={styles.lotItemFooter}>
                          <View style={styles.lotCountBadge}>
                            <Text style={styles.lotCountText}>{lot.items.length} item{lot.items.length !== 1 ? 's' : ''}</Text>
                          </View>
                          <Text style={styles.drillDownHint}>Tap to view items →</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateIcon}>🏷️</Text>
                    <Text style={styles.emptyStateText}>No lots found</Text>
                  </View>
                )}
              </>
            )}

            {/* BY LOCATOR TAB */}
            {lotsActiveTab === 'byLocator' && (
              locatorLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading locator data...</Text>
                </View>
              ) : (
              <>
                <View style={styles.lotsStatsContainer}>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>{filteredByLocator.length}</Text>
                    <Text style={styles.lotStatLabel}>Locators</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByLocator.reduce((sum, loc) => sum + (loc.items?.length || 0), 0)}
                    </Text>
                    <Text style={styles.lotStatLabel}>Items</Text>
                  </View>
                  <View style={styles.lotStatBox}>
                    <Text style={styles.lotStatValue}>
                      {filteredByLocator.reduce((sum, loc) => sum + (loc.totalQuantity || 0), 0).toLocaleString()}
                    </Text>
                    <Text style={styles.lotStatLabel}>Total Qty</Text>
                  </View>
                </View>

                {/* Global View Button */}
                <TouchableOpacity
                  style={styles.globalViewButton}
                  onPress={() => {
                    const hierarchy = buildLocatorHierarchy(locatorData);
                    setLocatorHierarchy(hierarchy);
                    setLocatorDrillPath([]);
                    navigateTo('LocatorGlobalView');
                  }}
                >
                  <Text style={styles.globalViewButtonIcon}>🌐</Text>
                  <Text style={styles.globalViewButtonText}>Global View</Text>
                  <Text style={styles.globalViewButtonHint}>Explore warehouse hierarchy</Text>
                </TouchableOpacity>

                {filteredByLocator.length > 0 ? (
                  <FlatList
                    data={filteredByLocator}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.lotsList}
                    renderItem={({ item: locator }) => (
                      <View style={styles.lotItemCard}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedLocatorGroup(locator);
                            navigateTo('LocatorLots');
                          }}
                        >
                          <View style={styles.lotItemHeader}>
                            <View style={styles.lotItemInfo}>
                              <Text style={styles.lotItemNumber}>📍 {locator.locator}</Text>
                              <View style={styles.lotBadgeRow}>
                                <View style={styles.orgBadgeSmall}>
                                  <Text style={styles.orgBadgeSmallText}>{locator.organization_code}</Text>
                                </View>
                                <View style={styles.subinvBadge}>
                                  <Text style={styles.subinvBadgeText}>{locator.sub_inventory_code}</Text>
                                </View>
                              </View>
                            </View>
                            <View style={styles.lotQtyContainer}>
                              <Text style={styles.lotTotalQty}>{locator.totalQuantity.toLocaleString()}</Text>
                              <Text style={styles.lotQtyLabel}>Total Qty</Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.locatorFooterRow}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedLocatorGroup(locator);
                              navigateTo('LocatorLots');
                            }}
                          >
                            <View style={styles.lotCountBadge}>
                              <Text style={styles.lotCountText}>{locator.items?.length || 0} item{(locator.items?.length || 0) !== 1 ? 's' : ''}</Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.locatorViewButton}
                            onPress={() => {
                              setSelectedLocatorForView(locator.locator);
                              setShowLocatorModal(true);
                            }}
                          >
                            <Text style={styles.locatorViewButtonText}>🗺️ View</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateIcon}>📍</Text>
                    <Text style={styles.emptyStateText}>No locators found</Text>
                  </View>
                )}
              </>
              )
            )}
          </>
        )}

        {/* Locator Visualization Modal */}
        <Modal
          visible={showLocatorModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLocatorModal(false)}
        >
          <View style={styles.locatorModalOverlay}>
            <View style={styles.locatorModalContainer}>
              <View style={styles.locatorModalHeader}>
                <Text style={styles.locatorModalTitle}>Locator View</Text>
                <TouchableOpacity onPress={() => setShowLocatorModal(false)}>
                  <Text style={styles.locatorModalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.locatorModalContent}>
                <Text style={styles.locatorModalLocatorName}>📍 {selectedLocatorForView}</Text>

                {/* Parse locator segments: AREA-BIN-COLUMN-ROW-SHELVING */}
                {selectedLocatorForView && (() => {
                  const segments = selectedLocatorForView.split('-');
                  const segmentLabels = ['AREA', 'BIN', 'COLUMN', 'ROW', 'SHELVING'];
                  return (
                    <View style={styles.locatorSegmentsContainer}>
                      {segments.map((segment, index) => (
                        <View key={index} style={styles.locatorSegmentBox}>
                          <Text style={styles.locatorSegmentLabel}>
                            {segmentLabels[index] || `SEG ${index + 1}`}
                          </Text>
                          <Text style={styles.locatorSegmentValue}>{segment}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {/* 2D Visualization */}
                <View style={styles.locatorVisualization}>
                  <Text style={styles.locatorVisTitle}>2D Location Map</Text>
                  <View style={styles.locatorGrid}>
                    {selectedLocatorForView && (() => {
                      const segments = selectedLocatorForView.split('-');
                      const area = segments[0] || 'A';
                      const bin = segments[1] || '1';
                      const col = parseInt(segments[2]) || 1;
                      const row = parseInt(segments[3]) || 1;
                      const shelf = parseInt(segments[4]) || 1;

                      return (
                        <View style={styles.locatorGridInner}>
                          {/* Grid representation */}
                          <View style={styles.locatorGridRow}>
                            {[1, 2, 3, 4, 5].map((c) => (
                              <View
                                key={c}
                                style={[
                                  styles.locatorGridCell,
                                  c === col && styles.locatorGridCellActive
                                ]}
                              >
                                <Text style={[
                                  styles.locatorGridCellText,
                                  c === col && styles.locatorGridCellTextActive
                                ]}>
                                  {c === col ? `${area}-${bin}` : ''}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.locatorShelfIndicator}>
                            <Text style={styles.locatorShelfText}>
                              Row {row} • Shelf {shelf}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {/* 3D Representation */}
                <View style={styles.locator3DContainer}>
                  <Text style={styles.locatorVisTitle}>3D Shelf View</Text>
                  {selectedLocatorForView && (() => {
                    const segments = selectedLocatorForView.split('-');
                    const shelf = parseInt(segments[4]) || 1;
                    const totalShelves = 5;

                    return (
                      <View style={styles.locator3DShelf}>
                        {[...Array(totalShelves)].map((_, i) => {
                          const shelfNum = totalShelves - i;
                          const isActive = shelfNum === shelf;
                          return (
                            <View
                              key={i}
                              style={[
                                styles.locator3DShelfLevel,
                                isActive && styles.locator3DShelfLevelActive
                              ]}
                            >
                              <Text style={[
                                styles.locator3DShelfText,
                                isActive && styles.locator3DShelfTextActive
                              ]}>
                                {isActive ? `📦 Shelf ${shelfNum}` : `Shelf ${shelfNum}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              </View>

              <TouchableOpacity
                style={styles.locatorModalCloseButton}
                onPress={() => setShowLocatorModal(false)}
              >
                <Text style={styles.locatorModalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Lot Details Screen (Individual Lots)
  if (currentScreen === 'LotDetails' && selectedLotItem) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Lot Details - {selectedLotItem.item_number}</Text>
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
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Serial Numbers - Lot: {selectedLot.lotnumber}</Text>
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

  // Lot Group Items Screen (Drill-down from By Lot tab)
  if (currentScreen === 'LotGroupItems' && selectedLotGroup) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Lot Items - {selectedLotGroup.lotnumber}</Text>
        </View>

        {/* Lot Summary Card */}
        <View style={styles.lotSummaryCard}>
          <View style={styles.lotSummaryRow}>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Status</Text>
              <Text style={[styles.lotSummaryValue, {
                color: selectedLotGroup.materialstatus === 'Active' ? COLORS.success : COLORS.warning
              }]}>
                {selectedLotGroup.materialstatus || 'Unknown'}
              </Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Expiration</Text>
              <Text style={styles.lotSummaryValue}>
                {selectedLotGroup.expirationdate ? new Date(selectedLotGroup.expirationdate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Total Qty</Text>
              <Text style={[styles.lotSummaryValue, { color: COLORS.success }]}>
                {selectedLotGroup.totalQuantity.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List Header */}
        <View style={styles.lotsListHeader}>
          <Text style={styles.lotsListTitle}>Items ({selectedLotGroup.items.length})</Text>
        </View>

        <FlatList
          data={selectedLotGroup.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lotDetailsList}
          renderItem={({ item }) => (
            <View style={styles.lotDetailCard}>
              <View style={styles.lotDetailHeader}>
                <View style={styles.lotNumberContainer}>
                  <Text style={styles.lotNumberLabel}>Item</Text>
                  <Text style={styles.lotNumberValue}>{item.item_number}</Text>
                </View>
                <View style={styles.lotQtyBox}>
                  <Text style={styles.lotQtyBoxValue}>{item.primaryquantity || 0}</Text>
                  <Text style={styles.lotQtyBoxLabel}>Qty</Text>
                </View>
              </View>

              <Text style={styles.lotItemDescription} numberOfLines={2}>
                {item.item_description}
              </Text>

              <View style={styles.lotDetailRow}>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Organization</Text>
                  <Text style={styles.lotDetailValue}>{item.organization_code}</Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Subinventory</Text>
                  <Text style={styles.lotDetailValue}>{item.sub_inventory_code}</Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Locator</Text>
                  <Text style={styles.lotDetailValue}>{item.locator || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  // Locator Lots Screen (Drill-down from By Locator tab - shows lots in locator)
  if (currentScreen === 'LocatorLots' && selectedLocatorGroup) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Locator Lots - {selectedLocatorGroup.locator}</Text>
        </View>

        {/* Locator Summary Card */}
        <View style={styles.lotSummaryCard}>
          <View style={styles.lotSummaryRow}>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Organization</Text>
              <Text style={styles.lotSummaryValue}>{selectedLocatorGroup.organization_code}</Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Subinventory</Text>
              <Text style={styles.lotSummaryValue}>{selectedLocatorGroup.sub_inventory_code}</Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Total Qty</Text>
              <Text style={[styles.lotSummaryValue, { color: COLORS.success }]}>
                {selectedLocatorGroup.totalQuantity.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Lots List Header */}
        <View style={styles.lotsListHeader}>
          <Text style={styles.lotsListTitle}>Lots ({selectedLocatorGroup.lots.length})</Text>
        </View>

        <FlatList
          data={selectedLocatorGroup.lots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lotDetailsList}
          renderItem={({ item: lot }) => (
            <TouchableOpacity
              style={styles.lotDetailCard}
              onPress={() => {
                setSelectedLotGroup(lot);
                navigateTo('LocatorLotItems');
              }}
            >
              <View style={styles.lotDetailHeader}>
                <View style={styles.lotNumberContainer}>
                  <Text style={styles.lotNumberLabel}>Lot #</Text>
                  <Text style={styles.lotNumberValue}>{lot.lotnumber}</Text>
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
                  <Text style={styles.lotDetailValue}>{lot.totalQuantity.toLocaleString()}</Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Expiration</Text>
                  <Text style={styles.lotDetailValue}>
                    {lot.expirationdate ? new Date(lot.expirationdate).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Items</Text>
                  <Text style={styles.lotDetailValue}>{lot.items.length}</Text>
                </View>
              </View>

              <View style={styles.lotItemFooter}>
                <Text style={styles.drillDownHint}>Tap to view items →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // Locator Lot Items Screen (Drill-down from LocatorLots - shows items in a specific lot within locator)
  if (currentScreen === 'LocatorLotItems' && selectedLotGroup) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Lot Items - {selectedLotGroup.lotnumber}</Text>
        </View>

        {/* Lot Summary Card */}
        <View style={styles.lotSummaryCard}>
          <View style={styles.lotSummaryRow}>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Status</Text>
              <Text style={[styles.lotSummaryValue, {
                color: selectedLotGroup.materialstatus === 'Active' ? COLORS.success : COLORS.warning
              }]}>
                {selectedLotGroup.materialstatus || 'Unknown'}
              </Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Expiration</Text>
              <Text style={styles.lotSummaryValue}>
                {selectedLotGroup.expirationdate ? new Date(selectedLotGroup.expirationdate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={styles.lotSummaryItem}>
              <Text style={styles.lotSummaryLabel}>Total Qty</Text>
              <Text style={[styles.lotSummaryValue, { color: COLORS.success }]}>
                {selectedLotGroup.totalQuantity.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List Header */}
        <View style={styles.lotsListHeader}>
          <Text style={styles.lotsListTitle}>Items ({selectedLotGroup.items.length})</Text>
        </View>

        <FlatList
          data={selectedLotGroup.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lotDetailsList}
          renderItem={({ item }) => (
            <View style={styles.lotDetailCard}>
              <View style={styles.lotDetailHeader}>
                <View style={styles.lotNumberContainer}>
                  <Text style={styles.lotNumberLabel}>Item</Text>
                  <Text style={styles.lotNumberValue}>{item.item_number}</Text>
                </View>
                <View style={styles.lotQtyBox}>
                  <Text style={styles.lotQtyBoxValue}>{item.primaryquantity || 0}</Text>
                  <Text style={styles.lotQtyBoxLabel}>Qty</Text>
                </View>
              </View>

              <Text style={styles.lotItemDescription} numberOfLines={2}>
                {item.item_description}
              </Text>

              <View style={styles.lotDetailRow}>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Organization</Text>
                  <Text style={styles.lotDetailValue}>{item.organization_code}</Text>
                </View>
                <View style={styles.lotDetailItem}>
                  <Text style={styles.lotDetailLabel}>Subinventory</Text>
                  <Text style={styles.lotDetailValue}>{item.sub_inventory_code}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  // ============= ORDER MANAGEMENT MODULE =============
  if (currentScreen === 'OrderManagementModule') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.moduleHeader, { justifyContent: 'center' }]}>
          <Text style={styles.moduleHeaderTitle}>Order Management</Text>
        </View>

        <ScrollView style={styles.moduleContent}>
          {/* Module Menu Cards */}
          <View style={styles.moduleMenuGrid}>
            {/* Sales Orders */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Sales Orders feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fce7f3' }]}>
                <Text style={styles.moduleMenuIcon}>🛒</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Sales Orders</Text>
            </TouchableOpacity>

            {/* Purchase Orders */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => {
                navigateTo('ReceiveGoods');
                fetchPOData();
              }}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.moduleMenuIcon}>📦</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Purchase Orders</Text>
            </TouchableOpacity>

            {/* Order Tracking */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Order Tracking feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.moduleMenuIcon}>🔍</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Order Tracking</Text>
            </TouchableOpacity>

            {/* Returns */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Returns feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.moduleMenuIcon}>↩️</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Returns</Text>
            </TouchableOpacity>

            {/* Quotations */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Quotations feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.moduleMenuIcon}>📝</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Quotations</Text>
            </TouchableOpacity>

            {/* Reports */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Reports feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#e0e7ff' }]}>
                <Text style={styles.moduleMenuIcon}>📊</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Reports</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => setCurrentScreen('OrderManagementModule')}>
            <Text style={styles.navIcon}>📋</Text>
            <Text style={[styles.navText, styles.navTextActive]}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('CRMModule')}>
            <Text style={styles.navIcon}>👥</Text>
            <Text style={styles.navText}>CRM</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============= CRM MODULE =============
  if (currentScreen === 'CRMModule') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.moduleHeader, { justifyContent: 'center' }]}>
          <Text style={styles.moduleHeaderTitle}>CRM</Text>
        </View>

        <ScrollView style={styles.moduleContent}>
          {/* Module Menu Cards */}
          <View style={styles.moduleMenuGrid}>
            {/* Customers */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Customers feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#cffafe' }]}>
                <Text style={styles.moduleMenuIcon}>👤</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Customers</Text>
            </TouchableOpacity>

            {/* Contacts */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Contacts feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.moduleMenuIcon}>📇</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Contacts</Text>
            </TouchableOpacity>

            {/* Leads */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Leads feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.moduleMenuIcon}>🎯</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Leads</Text>
            </TouchableOpacity>

            {/* Activities */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Activities feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.moduleMenuIcon}>📅</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Activities</Text>
            </TouchableOpacity>

            {/* Opportunities */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => Alert.alert('Coming Soon', 'Opportunities feature coming soon')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fce7f3' }]}>
                <Text style={styles.moduleMenuIcon}>💰</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Opportunities</Text>
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
            </TouchableOpacity>

            {/* Outbound Call */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => {
                navigateTo('OutboundCall');
                loadContacts();
              }}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.moduleMenuIcon}>📞</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Outbound Call</Text>
            </TouchableOpacity>

            {/* Call Logs */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => navigateTo('CallLogs')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.moduleMenuIcon}>📋</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Call Logs</Text>
            </TouchableOpacity>

            {/* Inbound Call */}
            <TouchableOpacity
              style={styles.moduleMenuCard}
              onPress={() => navigateTo('InboundCall')}
            >
              <View style={[styles.moduleMenuIconBg, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.moduleMenuIcon}>📲</Text>
              </View>
              <Text style={styles.moduleMenuTitle}>Inbound Call</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('OrderManagementModule')}>
            <Text style={styles.navIcon}>📋</Text>
            <Text style={styles.navText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => setCurrentScreen('CRMModule')}>
            <Text style={styles.navIcon}>👥</Text>
            <Text style={[styles.navText, styles.navTextActive]}>CRM</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============= OUTBOUND CALL SCREEN =============
  if (currentScreen === 'OutboundCall') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Outbound Call</Text>
        </View>

        {/* Call In Progress Banner */}
        {callInProgress && (
          <View style={{ backgroundColor: '#10B981', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                Call in Progress: {selectedContact?.name}
              </Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                {formatCallDuration(callTimer)}
              </Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
              onPress={stopCallTimer}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        <View style={{ padding: 16, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 12, fontSize: 16 }}
              placeholder="Search contacts..."
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
            />
            {contactSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setContactSearchQuery('')}>
                <Text style={{ fontSize: 18, color: '#9ca3af' }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contacts List */}
        {contactsLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C74634" />
            <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading contacts...</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 48 }}>📱</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16, color: '#374151' }}>
              {mobileContacts.length === 0 ? 'No contacts found' : 'No matching contacts'}
            </Text>
            <Text style={{ color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
              {mobileContacts.length === 0
                ? 'Grant contacts permission to see your mobile contacts'
                : 'Try a different search term'}
            </Text>
            {mobileContacts.length === 0 && (
              <TouchableOpacity
                style={{ backgroundColor: '#C74634', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 }}
                onPress={loadContacts}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Load Contacts</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#C74634', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                    {(item.name || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{item.name || 'Unknown'}</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                    {item.phoneNumbers?.[0]?.number || 'No phone'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#dbeafe', padding: 10, borderRadius: 8 }}
                    onPress={() => {
                      setSelectedContact(item);
                      setShowContactInfoModal(true);
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>ℹ️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#dcfce7', padding: 10, borderRadius: 8 }}
                    onPress={() => makePhoneCall(item)}
                    disabled={callInProgress}
                  >
                    <Text style={{ fontSize: 18, opacity: callInProgress ? 0.5 : 1 }}>📞</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        )}

        {/* Call Log Modal */}
        <Modal visible={showCallLogModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>Call Log</Text>

              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151' }}>{selectedContact?.name}</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                  {selectedContact?.phoneNumbers?.[0]?.number}
                </Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#C74634', marginTop: 8 }}>
                  Duration: {formatCallDuration(callTimer)}
                </Text>
              </View>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Call Notes:</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 16 }}
                placeholder="Enter call notes..."
                value={callLogNotes}
                onChangeText={setCallLogNotes}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setShowCallLogModal(false);
                    setCallLogNotes('');
                    setCallTimer(0);
                    setSelectedContact(null);
                  }}
                >
                  <Text style={{ fontWeight: '600', color: '#374151' }}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#C74634', padding: 14, borderRadius: 8, alignItems: 'center' }}
                  onPress={saveCallLog}
                >
                  <Text style={{ fontWeight: '600', color: '#fff' }}>Save Log</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Contact Info Modal */}
        <Modal visible={showContactInfoModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Contact Info</Text>
                <TouchableOpacity onPress={() => setShowContactInfoModal(false)}>
                  <Text style={{ fontSize: 24, color: '#9ca3af' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 20 }}>
                {/* Contact Header */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#C74634', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                      {(selectedContact?.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 12, color: '#1f2937' }}>{selectedContact?.name}</Text>
                  <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 4 }}>{selectedContact?.phoneNumbers?.[0]?.number}</Text>
                </View>

                {/* Customer Summary */}
                {(() => {
                  const customerData = getCustomerData(selectedContact);
                  return (
                    <>
                      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                        <View style={{ flex: 1, backgroundColor: '#dcfce7', borderRadius: 12, padding: 16, marginRight: 8 }}>
                          <Text style={{ fontSize: 12, color: '#166534' }}>Total Spent</Text>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#166534' }}>${customerData.totalSpent.toFixed(2)}</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#dbeafe', borderRadius: 12, padding: 16, marginLeft: 8 }}>
                          <Text style={{ fontSize: 12, color: '#1e40af' }}>Member Since</Text>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e40af' }}>{customerData.memberSince}</Text>
                        </View>
                      </View>

                      {/* Recent Invoices */}
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Recent Invoices</Text>
                      {customerData.invoices.map(inv => (
                        <View key={inv.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <View>
                            <Text style={{ fontWeight: '600', color: '#374151' }}>{inv.id}</Text>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{inv.date}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>${inv.amount.toFixed(2)}</Text>
                            <View style={{ backgroundColor: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Pending' ? '#fef3c7' : '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                              <Text style={{ fontSize: 10, fontWeight: '600', color: inv.status === 'Paid' ? '#166534' : inv.status === 'Pending' ? '#92400e' : '#dc2626' }}>{inv.status}</Text>
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Recent Payments */}
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 16, marginBottom: 12 }}>Recent Payments</Text>
                      {customerData.payments.map(pay => (
                        <View key={pay.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <View>
                            <Text style={{ fontWeight: '600', color: '#374151' }}>{pay.id}</Text>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{pay.date} - {pay.method}</Text>
                          </View>
                          <Text style={{ fontWeight: 'bold', color: '#10B981' }}>+${pay.amount.toFixed(2)}</Text>
                        </View>
                      ))}

                      {/* Recent Orders */}
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 16, marginBottom: 12 }}>Recent Orders</Text>
                      {customerData.orders.map(ord => (
                        <View key={ord.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <View>
                            <Text style={{ fontWeight: '600', color: '#374151' }}>{ord.id}</Text>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{ord.items} items</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>${ord.total.toFixed(2)}</Text>
                            <Text style={{ fontSize: 10, color: '#6b7280' }}>{ord.status}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  );
                })()}

                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Call Button */}
              <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' }}
                  onPress={() => {
                    setShowContactInfoModal(false);
                    makePhoneCall(selectedContact);
                  }}
                  disabled={callInProgress}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>📞 Call Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ============= CALL LOGS SCREEN =============
  if (currentScreen === 'CallLogs') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Call Logs</Text>
        </View>

        {callLogs.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 48 }}>📋</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16, color: '#374151' }}>No call logs yet</Text>
            <Text style={{ color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
              Make calls from Outbound Call to see your call history
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#C74634', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 }}
              onPress={() => {
                navigateTo('OutboundCall');
                loadContacts();
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Calling</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={callLogs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#C74634', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {(item.contact?.name || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>{item.contact?.name || 'Unknown'}</Text>
                      <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        {item.contact?.phoneNumbers?.[0]?.number}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#166534' }}>
                        {formatCallDuration(item.duration)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                {item.notes && (
                  <View style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Notes:</Text>
                    <Text style={{ fontSize: 14, color: '#374151' }}>{item.notes}</Text>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        )}
      </View>
    );
  }

  // ============= INBOUND CALL SCREEN =============
  if (currentScreen === 'InboundCall') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#C74634" />

        {/* Header */}
        <View style={[styles.screenHeader, { justifyContent: 'center' }]}>
          <Text style={styles.screenTitle}>Inbound Call</Text>
        </View>

        {/* Call Active Banner */}
        {inboundCallActive && (
          <View style={{ backgroundColor: '#10B981', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                Call Active: {inboundCustomerData?.name || 'Unknown'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                {formatCallDuration(inboundCallTimer)}
              </Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
              onPress={endInboundCall}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>End Call</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={{ flex: 1 }}>
          {/* Phone Number Input */}
          <View style={{ backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>
              Enter Caller's Phone Number
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>📞</Text>
              <TextInput
                style={{ flex: 1, paddingVertical: 14, fontSize: 18 }}
                placeholder="+1234567890"
                value={inboundPhoneNumber}
                onChangeText={setInboundPhoneNumber}
                keyboardType="phone-pad"
              />
              {inboundPhoneNumber.length > 0 && (
                <TouchableOpacity onPress={() => setInboundPhoneNumber('')}>
                  <Text style={{ fontSize: 18, color: '#9ca3af' }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#C74634', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 }}
              onPress={handleGetInboundDetails}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Get Details</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              Tip: Use +1234567890 to see sample customer data
            </Text>
          </View>

          {/* Customer Details */}
          {inboundCustomerData && (
            <View style={{ marginHorizontal: 16 }}>
              {/* Customer Header Card */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: inboundCustomerData.customerType === 'Premium' ? '#C74634' : '#6b7280', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                      {(inboundCustomerData.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>{inboundCustomerData.name}</Text>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>{inboundCustomerData.company}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={{ backgroundColor: inboundCustomerData.customerType === 'Premium' ? '#fef3c7' : '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: inboundCustomerData.customerType === 'Premium' ? '#92400e' : '#6b7280' }}>
                          {inboundCustomerData.customerType}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quick Stats */}
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Credit Limit</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937' }}>${inboundCustomerData.creditLimit?.toLocaleString()}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Outstanding</Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: inboundCustomerData.outstandingBalance > 0 ? '#dc2626' : '#10B981' }}>
                      ${inboundCustomerData.outstandingBalance?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#e5e7eb' }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Last Contact</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>{inboundCustomerData.lastContact}</Text>
                  </View>
                </View>
              </View>

              {/* Contact Info */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Contact Information</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📧</Text>
                  <Text style={{ color: '#374151' }}>{inboundCustomerData.email}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📞</Text>
                  <Text style={{ color: '#374151' }}>{inboundPhoneNumber}</Text>
                </View>
              </View>

              {/* Notes */}
              {inboundCustomerData.notes && (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#92400e', marginBottom: 8 }}>⚠️ Important Notes</Text>
                  <Text style={{ color: '#92400e' }}>{inboundCustomerData.notes}</Text>
                </View>
              )}

              {/* Invoices */}
              {inboundCustomerData.invoices?.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Recent Invoices</Text>
                  {inboundCustomerData.invoices.map(inv => (
                    <View key={inv.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#374151' }}>{inv.id}</Text>
                        <Text style={{ fontSize: 11, color: '#6b7280' }}>{inv.date} • Due: {inv.dueDate}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>${inv.amount.toLocaleString()}</Text>
                        <View style={{ backgroundColor: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Pending' ? '#fef3c7' : '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: inv.status === 'Paid' ? '#166534' : inv.status === 'Pending' ? '#92400e' : '#dc2626' }}>{inv.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Payments */}
              {inboundCustomerData.payments?.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Recent Payments</Text>
                  {inboundCustomerData.payments.map(pay => (
                    <View key={pay.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#374151' }}>{pay.id}</Text>
                        <Text style={{ fontSize: 11, color: '#6b7280' }}>{pay.date} • {pay.method}</Text>
                      </View>
                      <Text style={{ fontWeight: 'bold', color: '#10B981' }}>+${pay.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Orders */}
              {inboundCustomerData.orders?.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>Recent Orders</Text>
                  {inboundCustomerData.orders.map(ord => (
                    <View key={ord.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <View>
                        <Text style={{ fontWeight: '600', color: '#374151' }}>{ord.id}</Text>
                        <Text style={{ fontSize: 11, color: '#6b7280' }}>{ord.date} • {ord.items} items</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', color: '#1f2937' }}>${ord.total.toLocaleString()}</Text>
                        <Text style={{ fontSize: 10, color: '#6b7280' }}>{ord.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* No Data Message */}
              {inboundCustomerData.invoices?.length === 0 && inboundCustomerData.payments?.length === 0 && (
                <View style={{ backgroundColor: '#f3f4f6', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 32 }}>📭</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 8 }}>No History Found</Text>
                  <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 4 }}>This caller is not in our customer database</Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </View>
          )}

          {/* Empty State */}
          {!inboundCustomerData && (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 64 }}>📲</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginTop: 16 }}>Receiving a Call?</Text>
              <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
                Enter the caller's phone number above and tap "Get Details" to see their customer information
              </Text>
            </View>
          )}
        </ScrollView>
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

  // ========== DASHBOARD/HOME HEADER ==========
  dashboardHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  homeHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 36,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
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
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.85,
  },
  homeUserName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
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
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  homeOrgBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  homeOrgText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  homeHeaderRight: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  homeHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 16,
  },
  homeContent: {
    flex: 1,
  },

  // ========== KPI SECTION ==========
  kpiSection: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  kpiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  kpiLoadingText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    minHeight: 70,
  },
  kpiIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  kpiIcon: {
    fontSize: 12,
  },
  kpiValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  kpiLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 2,
  },

  // ========== MODULES SECTION ==========
  modulesSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },

  // ========== QUICK ACTIONS ==========
  quickActionsSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: SPACING.sm,
    alignItems: 'center',
    width: '23%',
    borderWidth: 1,
    borderColor: COLORS.neutral100,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
    justifyContent: 'center',
    padding: SPACING.lg,
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

  // Compact Module Cards (Home Page)
  compactModulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactModuleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    alignItems: 'center',
    width: '31%',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  compactModuleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  compactIconText: {
    fontSize: 20,
  },
  compactModuleTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Compact Menu Cards (Inside Modules)
  compactMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactMenuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.sm,
    alignItems: 'center',
    width: '31%',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  compactMenuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  compactMenuIcon: {
    fontSize: 18,
  },
  compactMenuTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
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
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C74634',
  },
  moduleHeaderCenter: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  moduleHeaderTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: '#fff',
  },
  moduleHeaderSubtitle: {
    fontSize: FONT_SIZES.xs,
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
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
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
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ========== SCREEN HEADER ==========
  screenHeader: {
    backgroundColor: '#C74634',
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '500',
  },
  screenTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#fff',
    marginLeft: SPACING.sm,
  },
  screenSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.85,
    marginLeft: SPACING.sm,
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
  notificationIconSmall: {
    fontSize: 20,
    color: COLORS.primary,
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

  // Organization Selection
  lotsOrgList: {
    padding: SPACING.md,
  },
  lotsOrgCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral100,
    ...SHADOWS.sm,
  },
  lotsOrgIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  lotsOrgIconText: {
    fontSize: 20,
  },
  lotsOrgInfo: {
    flex: 1,
  },
  lotsOrgName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  lotsOrgCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
  },
  lotsOrgArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral400,
  },

  // Organization Section Styles
  orgSectionContainer: {
    marginBottom: SPACING.lg,
  },
  orgSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orgChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  orgChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    minWidth: 80,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  orgChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  orgChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
  orgChipTextSelected: {
    color: COLORS.surface,
  },
  orgChipSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
  },
  orgChipSubtextSelected: {
    color: COLORS.neutral100,
  },
  orgSelectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  orgSelectionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    marginRight: SPACING.xs,
  },
  orgSelectionValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  getDataButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  getDataButtonText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },

  // Global View Button
  globalViewButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    ...SHADOWS.sm,
  },
  globalViewButtonIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  globalViewButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  globalViewButtonHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
  },

  // Breadcrumb Navigation
  breadcrumbContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  breadcrumbItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  breadcrumbText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
  },
  breadcrumbTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral300,
    marginHorizontal: 4,
  },

  // Level Info
  levelInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral50,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  levelInfoBadge: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  levelInfoBadgeText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  levelInfoStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelInfoStatsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral700,
    fontWeight: '500',
  },
  levelInfoQtyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral500,
  },

  // Global View Content
  globalViewContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Hierarchy Grid
  hierarchyGrid: {
    padding: SPACING.md,
  },
  hierarchyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  hierarchyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  hierarchyCardIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  hierarchyCardIconText: {
    fontSize: 18,
  },
  hierarchyCardInfo: {
    flex: 1,
  },
  hierarchyCardName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.neutral900,
  },
  hierarchyCardLevel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hierarchyCardArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.neutral400,
  },
  hierarchyCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  hierarchyCardStat: {
    alignItems: 'center',
  },
  hierarchyCardStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.neutral800,
  },
  hierarchyCardStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
  },
  hierarchyProgressBar: {
    height: 4,
    backgroundColor: COLORS.neutral100,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  hierarchyProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Leaf Items (at deepest level)
  leafItemsContainer: {
    padding: SPACING.md,
  },
  leafItemsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral700,
    marginBottom: SPACING.sm,
  },
  leafItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    ...SHADOWS.sm,
  },
  leafItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  leafItemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral900,
  },
  leafItemQtyBadge: {
    backgroundColor: COLORS.successLight,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  leafItemQtyText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.success,
  },
  leafItemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral600,
    marginBottom: SPACING.xs,
  },
  leafItemMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  leafItemMetaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
  },

  // Warehouse Map
  warehouseMapContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral200,
  },
  warehouseMapTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  warehouseMapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  warehouseMapCell: {
    width: 70,
    height: 50,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  warehouseMapCellText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.neutral900,
  },
  warehouseMapCellQty: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral900,
  },

  // Organization Selector (in header)
  lotsOrgSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsOrgSelectorIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  lotsOrgSelectorText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  lotsOrgSelectorArrow: {
    fontSize: 10,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },

  // Tab Navigation
  lotsTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  lotsTabActive: {
    borderBottomColor: COLORS.primary,
  },
  lotsTabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.neutral500,
  },
  lotsTabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Filters
  lotsFilterContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsFilterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  lotsFilterField: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  lotsFilterLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.neutral600,
    marginBottom: 4,
  },
  lotsAutocompleteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
  },
  lotsFilterInput: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral900,
  },
  lotsFilterClear: {
    paddingHorizontal: SPACING.sm,
  },
  lotsFilterClearText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral400,
  },
  lotsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.neutral200,
    marginTop: 4,
    zIndex: 100,
    ...SHADOWS.md,
  },
  lotsDropdownItem: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
  },
  lotsDropdownText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral900,
  },
  lotsDropdownSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginTop: 2,
  },
  lotsSearchRow: {
    marginTop: SPACING.sm,
  },

  // Locator Badge
  locatorBadge: {
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  locatorBadgeText: {
    fontSize: FONT_SIZES.xxs,
    fontWeight: '600',
    color: COLORS.info,
  },

  // Status Badge Small
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusBadgeSmallText: {
    fontSize: FONT_SIZES.xxs,
    fontWeight: '600',
  },

  // Expiration Text
  lotExpirationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    marginVertical: SPACING.xs,
  },

  // Qty Box
  lotQtyBox: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  lotQtyBoxValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  lotQtyBoxLabel: {
    fontSize: FONT_SIZES.xxs,
    color: COLORS.success,
  },

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
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  shipAllButtonText: {
    color: COLORS.success,
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
    justifyContent: 'flex-start',
  },
  shipSummaryItem: {
    flex: 1,
    alignItems: 'flex-start',
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  pickLineButtonText: {
    color: COLORS.success,
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
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  pickConfirmButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },

  // ========== LOCATOR VISUALIZATION ==========
  locatorFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral100,
  },
  locatorViewButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  locatorViewButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.info,
  },
  locatorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  locatorModalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  locatorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral100,
    backgroundColor: COLORS.info,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  locatorModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  locatorModalClose: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: '600',
  },
  locatorModalContent: {
    padding: SPACING.md,
  },
  locatorModalLocatorName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.neutral900,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  locatorSegmentsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  locatorSegmentBox: {
    backgroundColor: COLORS.neutral50,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 60,
  },
  locatorSegmentLabel: {
    fontSize: FONT_SIZES.xxs,
    color: COLORS.neutral500,
    fontWeight: '600',
  },
  locatorSegmentValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  locatorVisualization: {
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  locatorVisTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.neutral700,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  locatorGrid: {
    alignItems: 'center',
  },
  locatorGridInner: {
    alignItems: 'center',
  },
  locatorGridRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  locatorGridCell: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.neutral200,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locatorGridCellActive: {
    backgroundColor: COLORS.success,
  },
  locatorGridCellText: {
    fontSize: FONT_SIZES.xxs,
    color: COLORS.neutral500,
    fontWeight: '600',
  },
  locatorGridCellTextActive: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
  },
  locatorShelfIndicator: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
  },
  locatorShelfText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.info,
  },
  locator3DContainer: {
    backgroundColor: COLORS.neutral50,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  locator3DShelf: {
    alignItems: 'center',
  },
  locator3DShelfLevel: {
    width: '80%',
    height: 36,
    backgroundColor: COLORS.neutral200,
    marginBottom: 4,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neutral300,
  },
  locator3DShelfLevelActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  locator3DShelfText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral500,
    fontWeight: '500',
  },
  locator3DShelfTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  locatorModalCloseButton: {
    backgroundColor: COLORS.neutral100,
    padding: SPACING.md,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  locatorModalCloseButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.neutral700,
  },
});
