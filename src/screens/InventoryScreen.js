import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/colors';

// Sample data - replace with API call
const SAMPLE_INVENTORY = [
  { id: '1', sku: 'ITEM-001', name: 'Widget A', quantity: 150, location: 'A-01-01' },
  { id: '2', sku: 'ITEM-002', name: 'Widget B', quantity: 75, location: 'A-01-02' },
  { id: '3', sku: 'ITEM-003', name: 'Gadget X', quantity: 200, location: 'B-02-01' },
  { id: '4', sku: 'ITEM-004', name: 'Gadget Y', quantity: 50, location: 'B-02-02' },
  { id: '5', sku: 'ITEM-005', name: 'Tool Z', quantity: 120, location: 'C-03-01' },
];

export default function InventoryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState(SAMPLE_INVENTORY);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.quantity, item.quantity < 100 && styles.quantityLow]}>
          {item.quantity}
        </Text>
      </View>
      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
      <Text style={styles.itemLocation}>📍 {item.location}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredInventory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 8,
    fontSize: FONT_SIZES.md,
  },
  list: {
    padding: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
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
  quantity: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  quantityLow: {
    color: COLORS.warning,
  },
  itemSku: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
