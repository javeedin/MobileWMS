const API_BASE_URL = 'https://your-oracle-fusion-instance.com/api';
const API_VERSION = '/fscmRestApi/resources/v1';

export const fetchSubinventories = async (warehouseId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/Subinventories?organizationId=${warehouseId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      }
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching subinventories:', error);
    throw error;
  }
};

export const fetchWarehouseList = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/Organizations?type=Warehouse`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      }
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const fetchSubinventoryItems = async (warehouseId, subinventoryId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/OnHandQuantities?organizationId=${warehouseId}&subinventoryCode=${subinventoryId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      }
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const fetchLocators = async (warehouseId, subinventoryId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/Locators?organizationId=${warehouseId}&subinventoryCode=${subinventoryId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
      }
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching locators:', error);
    throw error;
  }
};

export const submitSubinventoryTransfer = async (transferData) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}/SubinventoryTransfers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
        },
        body: JSON.stringify({
          organizationId: transferData.warehouseId,
          fromSubinventoryCode: transferData.fromSubinventory,
          toSubinventoryCode: transferData.toSubinventory,
          inventoryItemId: transferData.itemId,
          itemNumber: transferData.itemNumber,
          quantity: transferData.quantity,
          fromLocatorId: transferData.fromLocator,
          toLocatorId: transferData.toLocator,
          transactionDate: new Date().toISOString(),
          transactionType: 'SUBINVENTORY_TRANSFER',
        }),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting transfer:', error);
    throw error;
  }
};
