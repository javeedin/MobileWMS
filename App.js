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

// Constants
const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1f2937',
  light: '#f3f4f6',
  white: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
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
  const [pickModalTab, setPickModalTab] = useState('details'); // 'details' or 'serials'
  const [allocatedLots, setAllocatedLots] = useState([]); // Individual serial allocations
  const [allocatedLotsSummary, setAllocatedLotsSummary] = useState([]); // Summary with serial range
  const [pickLocator, setPickLocator] = useState(''); // Editable locator for pick
  const [pickAllocating, setPickAllocating] = useState(false); // Loading state for auto-allocate
  const [pickSerialsLoading, setPickSerialsLoading] = useState(false); // Loading state for serial fetch
  const [scanningForPickLocator, setScanningForPickLocator] = useState(false); // Scanning locator for pick
  const [processedPickSlips, setProcessedPickSlips] = useState(new Set()); // Track confirmed pick slips
  const [pickConfirmResult, setPickConfirmResult] = useState(null); // Last API JSON response
  const [pickJsonExpanded, setPickJsonExpanded] = useState(false); // Collapsible JSON output
  const [showPickProgress, setShowPickProgress] = useState(false); // Progress popup visibility
  const [pickStep1Status, setPickStep1Status] = useState('idle'); // idle | loading | done | error
  const [pickStep2Status, setPickStep2Status] = useState('idle'); // idle | loading | done | error

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
  const [splitLines, setSplitLines] = useState([]); // Array of {id, qty, locator, scanned, lotNumber, serialFrom, serialTo}
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

  // Update any field on a split line (lotNumber, serialFrom, serialTo)
  const updateSplitLineField = (lineId, field, value) => {
    setSplitLines(prev => prev.map(line =>
      line.id === lineId ? { ...line, [field]: value } : line
    ));
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

        // Step 2: Check ReturnStatus
        const processingStatus = oracleData.ReturnStatus || oracleData.returnstatus;
        console.log('ReturnStatus:', processingStatus);

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
              {(() => {
                const itemFromSerial = parseSerialNumber(selectedItem.fromserialnumber || selectedItem.FROMSERIALNUMBER);
                const itemToSerial = parseSerialNumber(selectedItem.toserialnumber || selectedItem.TOSERIALNUMBER);
                const itemLot = selectedItem.lotnumber || selectedItem.LOTNUMBER || '';
                let runningSerialStart = itemFromSerial ? itemFromSerial.num : null;
                return splitLines.map((line, index) => {
                const isReceived = (selectedItem.processingstatuscode || selectedItem.PROCESSINGSTATUSCODE) === 'SUCCESS';
                // Compute serial range for this split
                let serialRangeText = '';
                if (runningSerialStart !== null && itemFromSerial) {
                  const serialEnd = runningSerialStart + line.qty - 1;
                  serialRangeText = `${itemFromSerial.prefix}${runningSerialStart} – ${itemFromSerial.prefix}${serialEnd}`;
                  runningSerialStart = serialEnd + 1;
                }
                return (
                  <View key={line.id} style={{ paddingVertical: 6, borderBottomWidth: index < splitLines.length - 1 ? 1 : 0, borderBottomColor: '#FFF59D' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        onBlur={() => {
                          // Validate split line locator when user finishes typing
                          if (line.locator && line.locator.trim().length > 2) {
                            validateLocatorIsFree(line.locator, line.id);
                          }
                        }}
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
                    </View>{/* end inner row */}
                    {/* Lot & Serial Range info row */}
                    {(itemLot || serialRangeText) && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 8, paddingLeft: 4 }}>
                        {itemLot ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Lot:</Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.text }}>{itemLot}</Text>
                          </View>
                        ) : null}
                        {serialRangeText ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>Serials:</Text>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.text }}>{serialRangeText}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>{/* end outer row */}
                );
              });
              })()}

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

              // Validate all locators before confirming
              const validateAndConfirm = async () => {
                if (splitLines.length > 0) {
                  // Split mode - validate all split locators
                  for (const line of splitLines) {
                    const isValid = await validateLocatorIsFree(line.locator, line.id);
                    if (!isValid) {
                      return; // Stop if any locator is not free
                    }
                  }
                  // All locators valid - show confirmation
                  const itemFromSerial = parseSerialNumber(selectedItem.fromserialnumber || selectedItem.FROMSERIALNUMBER);
                  const itemLot = selectedItem.lotnumber || selectedItem.LOTNUMBER || '';
                  let serialCursor = itemFromSerial ? itemFromSerial.num : null;
                  const splitSummary = splitLines.map(l => {
                    let line = `• Qty ${l.qty} → ${l.locator}`;
                    if (itemLot) line += `\n  Lot: ${itemLot}`;
                    if (serialCursor !== null && itemFromSerial) {
                      const serialEnd = serialCursor + l.qty - 1;
                      line += `\n  Serials: ${itemFromSerial.prefix}${serialCursor} – ${itemFromSerial.prefix}${serialEnd}`;
                      serialCursor = serialEnd + 1;
                    }
                    return line;
                  }).join('\n');
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
                  // Normal mode - validate single locator
                  const isValid = await validateLocatorIsFree(currentLocator);
                  if (!isValid) {
                    return; // Stop if locator is not free
                  }
                  // Locator valid - show confirmation
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
              };

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

  // Dashboard Styles
  dashboardHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
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
    fontSize: 28,
    color: COLORS.white,
  },
  dashboardGreeting: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.9,
  },
  dashboardUserName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  orgBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
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

  // Hamburger Menu
  hamburgerMenu: {
    position: 'absolute',
    top: 100,
    left: 0,
    backgroundColor: COLORS.white,
    width: 250,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: SPACING.lg,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  menuUserName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  menuUserRole: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  menuOrgText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
  },
  menuItem: {
    paddingVertical: SPACING.md,
  },
  menuItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },

  // Dashboard Content
  dashboardContent: {
    flex: 1,
  },
  orgDisplayContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  orgDisplayLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  orgDisplayValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardGrid: {
    padding: SPACING.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    width: '48%',
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
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
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Screen Header
  screenHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
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
