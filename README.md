# MobileWMS - Warehouse Management System

A mobile warehouse management system built with React Native and Expo.

## Features

- **Authentication** - User login/logout system
- **Dashboard** - Central hub for warehouse operations
- **Inventory Management** - View and search inventory items
- **Barcode Scanner** - Scan items using device camera
- **Item Details** - View and edit item information
- **Receive Goods** - Process incoming shipments (coming soon)
- **Ship Orders** - Process outgoing orders (coming soon)

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Expo Barcode Scanner** - Barcode scanning capability

## Project Structure

```
MobileWMS/
├── src/
│   ├── screens/          # All screen components
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── InventoryScreen.js
│   │   ├── ScannerScreen.js
│   │   ├── ItemDetailScreen.js
│   │   ├── ReceiveScreen.js
│   │   └── ShipScreen.js
│   ├── navigation/       # Navigation configuration
│   │   └── AppNavigator.js
│   ├── context/          # React Context for state management
│   │   └── AuthContext.js
│   ├── components/       # Reusable components
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   └── constants/        # Constants (colors, config)
│       └── colors.js
├── assets/               # Images and fonts
├── App.js               # Root component
└── package.json         # Dependencies

```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd MobileWMS
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running the App

After starting the development server, you can run the app:

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with the Expo Go app

### Testing the App

**Login Credentials:**
- Username: Any non-empty string
- Password: Any non-empty string

(Note: This is for demo purposes. Replace with actual authentication in production)

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Features Walkthrough

### 1. Login Screen
- Simple authentication interface
- Enter any username/password to access the app

### 2. Dashboard
- Main menu with cards for different operations:
  - **Inventory** - Browse all items
  - **Scan Item** - Use camera to scan barcodes
  - **Receive Goods** - Process incoming shipments
  - **Ship Orders** - Process outgoing orders

### 3. Inventory
- List all warehouse items
- Search by item name or SKU
- Click items to view details
- Color-coded quantities (low stock warning)

### 4. Barcode Scanner
- Real-time camera scanning
- Automatic item lookup after scan
- Option to view item details or scan again

### 5. Item Details
- View item information
- Edit quantity
- Quick action buttons for stock adjustments
- Location information

## Next Steps for Development

1. **Backend Integration**
   - Connect to real API endpoints
   - Implement actual authentication
   - Add data persistence

2. **Enhanced Features**
   - Implement Receive Goods workflow
   - Implement Ship Orders workflow
   - Add offline mode support
   - Implement data synchronization

3. **UI Improvements**
   - Add loading states
   - Improve error handling
   - Add animations and transitions

4. **Additional Features**
   - Reports and analytics
   - Multi-warehouse support
   - Role-based access control
   - Print labels and receipts

## Camera Permissions

The barcode scanner requires camera permissions. The app will request permission when you first access the scanner screen.

## Customization

### Colors
Edit `src/constants/colors.js` to customize the app's color scheme.

### Mock Data
Sample inventory data is in `src/screens/InventoryScreen.js`. Replace with API calls for production.

## Troubleshooting

**Camera not working:**
- Ensure you've granted camera permissions
- Check that you're testing on a physical device or simulator with camera support

**App won't start:**
- Clear cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## License

MIT

## Support

For issues and questions, please create an issue in the GitHub repository.
