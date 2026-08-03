const APEX_API_BASE = 'https://g827cd88c3cfc03-mitsumioracledb.adb.me-dubai-1.oraclecloudapps.com/ords/test/INVENTORY';
const FUSION_API_BASE = 'https://iacney-test.fa.ocs.oraclecloud.com/fscmRestApi/resources/11.13.18.05';

export const fetchWarehouseList = async () => {
  try {
    const url = `${APEX_API_BASE}/getorgnizationslist`;
    console.log('Fetching warehouses from:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('Full API Response:', JSON.stringify(data, null, 2));

    // Group by warehouse to get unique warehouses with their subinventories
    const warehouseMap = {};
    if (data.items && Array.isArray(data.items)) {
      console.log(`Processing ${data.items.length} items from API`);
      // Log first item to see field names
      if (data.items.length > 0) {
        console.log('First item structure:', JSON.stringify(data.items[0], null, 2));
      }

      data.items.forEach((item, index) => {
        // Use correct field names from API response
        const whCode = item.warehouse_code;
        const whName = item.warehouse_code; // Use warehouse_code as name too
        const subCode = item.subinventory_code;
        const subName = item.subinventory_name || subCode;

        if (index === 0) {
          console.log(`Debug - Item ${index}:`, { whCode, whName, subCode, subName });
        }

        // Create warehouse if not exists
        if (whCode && !warehouseMap[whCode]) {
          warehouseMap[whCode] = {
            id: whCode,
            code: whCode,
            name: whName,
            subinventories: []
          };
          console.log(`Created warehouse: ${whCode}`);
        }

        // Add subinventory if not already added
        if (whCode && subCode && warehouseMap[whCode]) {
          const exists = warehouseMap[whCode].subinventories.find(s => s.code === subCode);
          if (!exists) {
            warehouseMap[whCode].subinventories.push({
              id: subCode,
              code: subCode,
              name: subName
            });
            console.log(`Added subinventory ${subCode} to warehouse ${whCode}`);
          }
        }
      });

      console.log(`Grouped into ${Object.keys(warehouseMap).length} warehouses`);
    }

    const warehouses = Object.values(warehouseMap);
    console.log(`Total warehouses: ${warehouses.length}`, JSON.stringify(warehouses, null, 2));
    return warehouses;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

export const fetchSubinventories = async (warehouseId) => {
  // Subinventories are already loaded when fetching warehouses
  // This is a fallback in case they're needed separately
  const warehouses = await fetchWarehouseList();
  const warehouse = warehouses.find(w => w.id === warehouseId);
  return warehouse?.subinventories || [];
};

export const fetchSubinventoryItems = async (warehouseCode, subinventoryCode) => {
  try {
    // Fetch on-hand data from Oracle Fusion inventoryOnhandBalances API
    const fusionUrl = `${FUSION_API_BASE}/inventoryOnhandBalances?q=OrganizationCode=${warehouseCode};SubinventoryCode=${subinventoryCode}`;

    console.log('=== LOADING ITEMS FROM FUSION ===');
    console.log('Full URL:', fusionUrl);
    console.log('Warehouse Code:', warehouseCode);
    console.log('Subinventory Code:', subinventoryCode);

    const response = await fetch(fusionUrl);

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    console.log('=== FUSION API RESPONSE ===');
    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', { contentType, contentLength });
    console.log('Response OK:', response.ok);

    const responseText = await response.text();

    console.log('Raw Response Length:', responseText.length);
    console.log('Raw Response Text:', responseText);
    console.log('Response First 500 chars:', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('ERROR: Response not OK');
      throw new Error(`API returned status ${response.status} ${response.statusText}: ${responseText.substring(0, 300)}`);
    }

    if (!responseText || responseText.trim() === '') {
      console.error('ERROR: Empty response body');
      throw new Error('API returned empty response. Status: ' + response.status);
    }

    // Check if response looks like HTML (error page) instead of JSON
    if (responseText.trim().startsWith('<')) {
      console.error('ERROR: Response appears to be HTML, not JSON');
      throw new Error('API returned HTML instead of JSON (possibly authentication required or server error)');
    }

    let data;
    try {
      console.log('Attempting to parse JSON...');
      data = JSON.parse(responseText);
      console.log('JSON parse successful. Items count:', data.items ? data.items.length : 0);
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Error:', parseError.message);
      console.error('Response length:', responseText.length);
      console.error('Response first 300 chars:', responseText.substring(0, 300));
      console.error('Response last 100 chars:', responseText.substring(Math.max(0, responseText.length - 100)));
      throw new Error(`Failed to parse JSON: ${parseError.message}\nResponse length: ${responseText.length}\nFirst 200 chars: ${responseText.substring(0, 200)}`);
    }

    console.log('API Response received. Total items in response:', data.items ? data.items.length : 0);
    console.log('Full API Response:', JSON.stringify(data, null, 2));

    // Parse Fusion on-hand response
    const itemsArray = [];
    const itemsMap = {}; // Group by item number to avoid duplicates

    if (data.items && Array.isArray(data.items)) {
      console.log('Processing Fusion API items...');
      let processCount = 0;

      data.items.forEach((item, index) => {
        // Log first few items to see structure
        if (index < 3) {
          console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
        }

        processCount++;
        const itemNumber = item.ItemNumber;
        const itemDesc = item.ItemDescription || 'N/A';
        const quantity = parseFloat(item.PrimaryQuantity || 0);
        const uom = item.PrimaryUOMCode || 'PCS';
        const locatorId = item.LocatorId ? item.LocatorId.toString() : 'NO_LOCATOR';
        const locatorCode = item.Locator || locatorId; // Use Locator field for user-friendly display

        console.log(`Item ${processCount}: ${itemNumber} (Qty: ${quantity}, Locator: ${locatorCode})`);

        // Create entry for each unique item (first occurrence with that locator)
        const uniqueKey = `${itemNumber}-${locatorId}`;
        if (!itemsMap[uniqueKey]) {
          itemsMap[uniqueKey] = {
            id: uniqueKey,
            itemNumber: itemNumber,
            itemDescription: itemDesc,
            onHandQuantity: quantity,
            uomCode: uom,
            locatorId: locatorId,
            locatorCode: locatorCode,
            inventoryItemId: item.InventoryItemId,
            organizationId: item.OrganizationId,
            organizationCode: item.OrganizationCode,
            subinventoryCode: item.SubinventoryCode
          };
        }
      });

      console.log(`Total items processed: ${processCount}`);
    } else {
      console.warn('No items array in Fusion response!');
    }

    // Convert map to array
    Object.values(itemsMap).forEach(item => itemsArray.push(item));

    console.log(`=== Final loaded items: ${itemsArray.length} ===`);
    console.log(JSON.stringify(itemsArray, null, 2));

    return itemsArray;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const fetchLocators = async (warehouseCode, subinventoryCode) => {
  try {
    // Fetch locators from Fusion inventoryOnhandBalances API
    const fusionUrl = `${FUSION_API_BASE}/inventoryOnhandBalances?q=OrganizationCode=${warehouseCode};SubinventoryCode=${subinventoryCode}`;

    console.log('Fetching locators from:', fusionUrl);

    const response = await fetch(fusionUrl);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = JSON.parse(responseText);

    // Extract unique locators
    const locatorsMap = {};
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(row => {
        const locId = row.LocatorId ? row.LocatorId.toString() : 'NO_LOCATOR';
        const locCode = row.Locator || locId; // Use Locator field for user-friendly display
        if (!locatorsMap[locId]) {
          locatorsMap[locId] = {
            id: locId,
            code: locCode,
            name: locCode,
            description: locCode
          };
        }
      });
    }

    const locators = Object.values(locatorsMap);
    console.log(`Loaded ${locators.length} locators`, locators);
    return locators;
  } catch (error) {
    console.error('Error fetching locators:', error);
    throw error;
  }
};

export const submitSubinventoryTransfer = async (transferData) => {
  try {
    const url = `${APEX_API_BASE}/submitSubinventoryTransfer`;
    console.log('Submitting transfer to:', url);
    console.log('Transfer data:', transferData);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouseCode: transferData.warehouseCode,
        fromSubinventoryCode: transferData.fromSubinventory,
        toSubinventoryCode: transferData.toSubinventory,
        itemNumber: transferData.itemNumber,
        fromLocatorId: transferData.fromLocator,
        toLocatorId: transferData.toLocator,
        quantity: transferData.quantity,
        transactionType: 'SUBINVENTORY_TRANSFER',
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Transfer failed: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Transfer response:', data);
    return data;
  } catch (error) {
    console.error('Error submitting transfer:', error);
    throw error;
  }
};
