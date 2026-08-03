import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/colors';
import {
  fetchWarehouseList,
  fetchSubinventories,
  fetchSubinventoryItems,
} from '../services/api';

export default function LocatorTransfersScreen({ navigation }) {
  const [warehouses, setWarehouses] = useState([]);
  const [subinventories, setSubinventories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedSubinventory, setSelectedSubinventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showSubinventoryDropdown, setShowSubinventoryDropdown] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    setLoading(true);
    setError('');
    setStatus('Loading warehouses...');
    try {
      const warehouseList = await fetchWarehouseList();
      setWarehouses(warehouseList);
      setStatus(`Loaded ${warehouseList.length} warehouses`);
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      const errorMsg = `Failed to load warehouses: ${error.message}`;
      setError(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSelect = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedSubinventory(null);
    setItems([]);
    setShowWarehouseDropdown(false);
    setLoading(true);
    setError('');
    setStatus(`Loading subinventories for ${warehouse.name}...`);
    try {
      const subList = await fetchSubinventories(warehouse.id);
      setSubinventories(subList);
      setStatus(`Loaded ${subList.length} subinventories`);
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      const errorMsg = `Failed to load subinventories: ${error.message}`;
      setError(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubinventorySelect = async (subinventory) => {
    setSelectedSubinventory(subinventory);
    setShowSubinventoryDropdown(false);
    setLoading(true);
    setError('');
    setStatus(`Loading items from ${subinventory.name}...`);
    try {
      const itemList = await fetchSubinventoryItems(selectedWarehouse.code, subinventory.code);
      setItems(itemList);
      setStatus(`Loaded ${itemList.length} items`);
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      const errorMsg = `Failed to load items: ${error.message}`;
      setError(errorMsg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemSelect = (item) => {
    navigation.navigate('ItemTransferDetail', {
      item,
      warehouse: selectedWarehouse,
      subinventory: selectedSubinventory,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemSelect(item)}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNumber}>{item.itemNumber}</Text>
          <Text style={styles.itemDescription}>{item.itemDescription}</Text>
        </View>
        <Text style={styles.quantity}>{item.onHandQuantity}</Text>
      </View>
      <View style={styles.itemFooter}>
        <Text style={styles.uomLabel}>UOM: {item.uomCode}</Text>
        <Text style={styles.locatorLabel}>Locator: {item.locatorCode}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {status && (
        <View style={styles.statusBanner}>
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Warehouse Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Warehouse</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
          >
            <Text style={styles.dropdownText}>
              {selectedWarehouse?.name || 'Choose Warehouse'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showWarehouseDropdown && (
            <View style={styles.dropdownMenu}>
              {warehouses.map((warehouse) => (
                <TouchableOpacity
                  key={warehouse.id}
                  style={styles.dropdownItem}
                  onPress={() => handleWarehouseSelect(warehouse)}
                >
                  <Text style={styles.dropdownItemText}>{warehouse.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Subinventory Selector */}
        {selectedWarehouse && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Subinventory</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSubinventoryDropdown(!showSubinventoryDropdown)}
            >
              <Text style={styles.dropdownText}>
                {selectedSubinventory?.name || 'Choose Subinventory'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {showSubinventoryDropdown && (
              <View style={styles.dropdownMenu}>
                {subinventories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSubinventorySelect(sub)}
                  >
                    <Text style={styles.dropdownItemText}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Items List */}
        {selectedSubinventory && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Items in Subinventory</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : filteredItems.length > 0 ? (
              <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id?.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items found in this subinventory</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {loading && (
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  errorBanner: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  errorClose: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.md,
  },
  statusBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
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
  dropdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
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
    maxHeight: 200,
  },
  dropdownItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  quantity: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  uomLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  locatorLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  loadingContainer: {
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullLoadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
