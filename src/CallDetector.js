import { NativeModules, NativeEventEmitter, Platform, PermissionsAndroid } from 'react-native';

const { CallDetectorModule } = NativeModules;

class CallDetector {
  constructor() {
    this.eventEmitter = null;
    this.listeners = [];
    this.isListening = false;
  }

  // Request permissions (Android only)
  async requestPermissions() {
    if (Platform.OS !== 'android') {
      return { granted: false, message: 'Only supported on Android' };
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ]);

      const allGranted =
        granted['android.permission.READ_PHONE_STATE'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_CALL_LOG'] === PermissionsAndroid.RESULTS.GRANTED;

      return {
        granted: allGranted,
        permissions: granted,
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return { granted: false, error: error.message };
    }
  }

  // Check if permissions are granted
  async checkPermissions() {
    if (Platform.OS !== 'android') {
      return { allGranted: false, message: 'Only supported on Android' };
    }

    try {
      const result = await CallDetectorModule.checkPermissions();
      return result;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { allGranted: false, error: error.message };
    }
  }

  // Start listening for incoming calls
  async startListening(onIncomingCall, onCallStateChanged) {
    if (Platform.OS !== 'android') {
      console.warn('Call detection only supported on Android');
      return false;
    }

    if (this.isListening) {
      console.warn('Already listening for calls');
      return true;
    }

    try {
      // Request permissions first
      const permissions = await this.requestPermissions();
      if (!permissions.granted) {
        console.error('Permissions not granted');
        return false;
      }

      // Set up event emitter
      this.eventEmitter = new NativeEventEmitter(CallDetectorModule);

      // Listen for incoming calls
      if (onIncomingCall) {
        const incomingListener = this.eventEmitter.addListener('onIncomingCall', (event) => {
          console.log('Incoming call:', event);
          onIncomingCall(event.phoneNumber, event.state, event.timestamp);
        });
        this.listeners.push(incomingListener);
      }

      // Listen for call state changes
      if (onCallStateChanged) {
        const stateListener = this.eventEmitter.addListener('onCallStateChanged', (event) => {
          console.log('Call state changed:', event);
          onCallStateChanged(event.phoneNumber, event.state, event.timestamp);
        });
        this.listeners.push(stateListener);
      }

      // Start native listener
      await CallDetectorModule.startListening();
      this.isListening = true;
      console.log('Started listening for calls');
      return true;
    } catch (error) {
      console.error('Error starting call listener:', error);
      return false;
    }
  }

  // Stop listening for calls
  async stopListening() {
    if (!this.isListening) {
      return true;
    }

    try {
      // Remove all listeners
      this.listeners.forEach(listener => listener.remove());
      this.listeners = [];

      // Stop native listener
      if (Platform.OS === 'android') {
        await CallDetectorModule.stopListening();
      }

      this.isListening = false;
      console.log('Stopped listening for calls');
      return true;
    } catch (error) {
      console.error('Error stopping call listener:', error);
      return false;
    }
  }

  // Get the last incoming phone number
  async getLastIncomingNumber() {
    if (Platform.OS !== 'android') {
      return '';
    }

    try {
      const number = await CallDetectorModule.getLastIncomingNumber();
      return number;
    } catch (error) {
      console.error('Error getting last incoming number:', error);
      return '';
    }
  }
}

// Export singleton instance
export default new CallDetector();
