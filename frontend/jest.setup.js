// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);


// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
        hostUri: '127.0.0.1:8000'
    },
  },
  expoConfig: {
      hostUri: "127.0.0.1:8000"
  }
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  isDevice: false,
  modelName: 'iPhone Simulator',
}));

// Mock Socket.io
jest.mock('socket.io-client', () => {
    const emit = jest.fn();
    const on = jest.fn();
    const connect = jest.fn();
    const disconnect = jest.fn();
    const socket = { emit, on, connect, disconnect, id: 'mock-socket-id' };
    return jest.fn(() => socket);
});

// Mock Expo Image Picker & Document Picker (Basic)
jest.mock('expo-image-picker', () => ({
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    launchCameraAsync: jest.fn(),
    requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));
