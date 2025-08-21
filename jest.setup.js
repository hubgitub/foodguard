import '@testing-library/jest-native/extend-expect';

// Mock Expo modules registry
global.__ExpoImportMetaRegistry = new Map();

// Mock TextEncoder/TextDecoder for React Native environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock clearImmediate for React Native environment
global.clearImmediate = jest.fn((id) => clearTimeout(id));

// Create a global Linking mock
global.LinkingMock = {
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null))
};

// Mock expo/src/winter/runtime.native
jest.mock('expo/src/winter/runtime.native', () => ({
  __ExpoImportMetaRegistry: global.__ExpoImportMetaRegistry
}));

// Silence warnings
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Animated') || 
       args[0].includes('useNativeDriver') ||
       args[0].includes('Expo'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
  
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
       args[0].includes('Expo'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([]))
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    CameraView: React.forwardRef((props, ref) => {
      return React.createElement('CameraView', { ...props, ref });
    }),
    useCameraPermissions: jest.fn(() => [
      { granted: true },
      jest.fn()
    ])
  };
});

// Mock expo modules
jest.mock('expo-status-bar', () => {
  const React = require('react');
  return {
    StatusBar: React.forwardRef((props, ref) => 
      React.createElement('StatusBar', { ...props, ref })
    )
  };
});

// Mock expo
jest.mock('expo', () => ({
  registerRootComponent: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => global.LinkingMock);

// Mock React Native StatusBar
jest.mock('react-native/Libraries/Components/StatusBar/StatusBar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => 
      React.createElement('StatusBar', { ...props, ref })
    ),
    _updatePropsStack: jest.fn(),
    pushStackEntry: jest.fn(),
    popStackEntry: jest.fn(),
    replaceStackEntry: jest.fn(),
    setBackgroundColor: jest.fn(),
    setBarStyle: jest.fn(),
    setHidden: jest.fn(),
    setNetworkActivityIndicatorVisible: jest.fn(),
    setTranslucent: jest.fn()
  };
});