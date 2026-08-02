import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/colors';
import { fetchLocators, submitSubinventoryTransfer } from '../services/api';

export default function ItemTransferDetailScreen({ route, navigation }) {
  const { item, warehouse, subinventory } = route.params;
  const [locators, setLocators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSourceLocator, setSelectedSourceLocator] = useState(null);
  const [selectedDestLocator, setSelectedDestLocator] = useState(null);
  const [transferQuantity, setTransferQuantity] = useState(
    item.onHandQuantity?.toString() || '0'
  );
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    loadLocators();
  }, []);

  const loadLocators = async () => {
    setLoading(true);
    try {
      const locatorList = await fetchLocators(warehouse.id, subinventory.code);
      setLocators(locatorList);
      if (locatorList.length > 0) {
        setSelectedSourceLocator(locatorList[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load locators');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validateTransfer = () => {
    const qty = parseFloat(transferQuantity);

    if (!selectedSourceLocator) {
      Alert.alert('Error', 'Please select a source locator');
      return false;
    }

    if (!selectedDestLocator) {
      Alert.alert('Error', 'Please select a destination locator');
      return false;
    }

    if (selectedSourceLocator.id === selectedDestLocator.id) {
      Alert.alert('Error', 'Source and destination locators must be different');
      return false;
    }

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return false;
    }

    if (qty > (item.onHandQuantity || 0)) {
      Alert.alert('Error', `Cannot transfer more than available quantity (${item.onHandQuantity})`);
      return false;
    }

    return true;
  };

  const handleTransfer = async () => {
    if (!validateTransfer()) {
      return;
    }

    setSubmitting(true);
    try {
      const transferData = {
        warehouseId: warehouse.id,
        fromSubinventory: subinventory.code,
        toSubinventory: subinventory.code,
        itemId: item.id,
        itemNumber: item.itemNumber,
        quantity: parseFloat(transferQuantity),
        fromLocator: selectedSourceLocator.id,
        toLocator: selectedDestLocator.id,
      };

      const response = await submitSubinventoryTransfer(transferData);

      if (response.success || response.status === 'SUCCESS') {
        Alert.alert(
          'Success',
          'Transfer submitted successfully. Reference: ' + (response.referenceNumber || 'N/A'),
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit transfer');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit transfer: ' + error.message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Item Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item Number:</Text>
              <Text style={styles.detailValue}>{item.itemNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{item.itemDescription}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>On Hand Quantity:</Text>
              <Text style={[styles.detailValue, { color: COLORS.success, fontWeight: 'bold' }]}>
                {item.onHandQuantity} {item.uomCode}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Warehouse:</Text>
              <Text style={styles.detailValue}>{warehouse.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subinventory:</Text>
              <Text style={styles.detailValue}>{subinventory.name}</Text>
            </View>
          </View>
        </View>

        {/* Source Locator Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Locator</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSourceDropdown(!showSourceDropdown)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                {selectedSourceLocator?.code || 'Select Source Locator'}
              </Text>
              <Text style={styles.dropdownSubtext}>
                {selectedSourceLocator?.description || ''}
              </Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showSourceDropdown && (
            <View style={styles.dropdownMenu}>
              {locators.map((locator) => (
                <TouchableOpacity
                  key={locator.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedSourceLocator(locator);
                    setShowSourceDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemCode}>{locator.code}</Text>
                  <Text style={styles.dropdownItemDesc}>{locator.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Destination Locator Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination Locator</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDestDropdown(!showDestDropdown)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                {selectedDestLocator?.code || 'Select Destination Locator'}
              </Text>
              <Text style={styles.dropdownSubtext}>
                {selectedDestLocator?.description || ''}
              </Text>
            </View>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showDestDropdown && (
            <View style={styles.dropdownMenu}>
              {locators.map((locator) => (
                <TouchableOpacity
                  key={locator.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedDestLocator(locator);
                    setShowDestDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemCode}>{locator.code}</Text>
                  <Text style={styles.dropdownItemDesc}>{locator.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Transfer Quantity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfer Quantity</Text>
          <View style={styles.quantityInputContainer}>
            <TextInput
              style={styles.quantityInput}
              placeholder="Enter quantity"
              value={transferQuantity}
              onChangeText={setTransferQuantity}
              keyboardType="decimal-pad"
              editable={!submitting}
            />
            <Text style={styles.quantityUnit}>{item.uomCode}</Text>
          </View>
          <Text style={styles.quantityHint}>
            Max available: {item.onHandQuantity} {item.uomCode}
          </Text>
        </View>

        {/* Transfer Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={handleTransfer}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Transfer</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  dropdownSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  dropdownArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
  },
  dropdownMenu: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -1,
    zIndex: 100,
    maxHeight: 250,
  },
  dropdownItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemCode: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  dropdownItemDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
  },
  quantityInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  quantityUnit: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  quantityHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
