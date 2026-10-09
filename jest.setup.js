/* eslint-env jest */
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockWebView = props => React.createElement(View, props, props.children);
  return {
    WebView: MockWebView,
    default: MockWebView,
  };
});

jest.mock('react-native-bluetooth-classic', () => ({
  default: {
    requestEnable: jest.fn().mockResolvedValue(true),
    isBluetoothEnabled: jest.fn().mockResolvedValue(true),
    getBondedDevices: jest.fn().mockResolvedValue([]),
    startDiscovery: jest.fn().mockResolvedValue([]),
    cancelDiscovery: jest.fn().mockResolvedValue(true),
    connectToDevice: jest.fn().mockResolvedValue({
      isConnected: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      write: jest.fn().mockResolvedValue(true),
      onDataReceived: jest.fn(),
    }),
  },
}));
