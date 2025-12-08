package com.mobilewms.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallDetectorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var callReceiver: BroadcastReceiver? = null
    private var lastIncomingNumber: String? = null
    private var isListening = false

    override fun getName(): String {
        return "CallDetectorModule"
    }

    // Check if permissions are granted
    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val context = reactApplicationContext
        val readPhoneState = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
        val readCallLog = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALL_LOG)

        val result = WritableNativeMap()
        result.putBoolean("READ_PHONE_STATE", readPhoneState == PackageManager.PERMISSION_GRANTED)
        result.putBoolean("READ_CALL_LOG", readCallLog == PackageManager.PERMISSION_GRANTED)
        result.putBoolean("allGranted", readPhoneState == PackageManager.PERMISSION_GRANTED && readCallLog == PackageManager.PERMISSION_GRANTED)

        promise.resolve(result)
    }

    // Start listening for incoming calls
    @ReactMethod
    fun startListening(promise: Promise) {
        if (isListening) {
            promise.resolve("Already listening")
            return
        }

        try {
            val context = reactApplicationContext

            callReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    if (intent?.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
                        val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
                        val phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

                        when (state) {
                            TelephonyManager.EXTRA_STATE_RINGING -> {
                                // Incoming call ringing
                                if (phoneNumber != null) {
                                    lastIncomingNumber = phoneNumber
                                    sendEvent("onIncomingCall", phoneNumber, "RINGING")
                                }
                            }
                            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                                // Call answered
                                sendEvent("onCallStateChanged", lastIncomingNumber ?: "", "OFFHOOK")
                            }
                            TelephonyManager.EXTRA_STATE_IDLE -> {
                                // Call ended
                                sendEvent("onCallStateChanged", lastIncomingNumber ?: "", "IDLE")
                                lastIncomingNumber = null
                            }
                        }
                    }
                }
            }

            val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
            context.registerReceiver(callReceiver, filter)
            isListening = true
            promise.resolve("Started listening for calls")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Stop listening for calls
    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            if (callReceiver != null) {
                reactApplicationContext.unregisterReceiver(callReceiver)
                callReceiver = null
            }
            isListening = false
            promise.resolve("Stopped listening")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // Get the last incoming phone number
    @ReactMethod
    fun getLastIncomingNumber(promise: Promise) {
        promise.resolve(lastIncomingNumber ?: "")
    }

    // Send event to React Native
    private fun sendEvent(eventName: String, phoneNumber: String, state: String) {
        val params = WritableNativeMap()
        params.putString("phoneNumber", phoneNumber)
        params.putString("state", state)
        params.putDouble("timestamp", System.currentTimeMillis().toDouble())

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    // Required for event emitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
