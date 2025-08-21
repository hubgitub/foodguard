import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import BarcodeScanner from '../BarcodeScanner';

jest.spyOn(Alert, 'alert');

describe('BarcodeScanner', () => {
  const mockOnScan = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isScanning is false', () => {
    const { queryByText } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={false}
        onClose={mockOnClose}
      />
    );

    expect(queryByText('Demande d\'autorisation pour la caméra...')).toBeNull();
  });

  it('should request camera permissions when isScanning is true', async () => {
    const mockRequestPermission = jest.fn();
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: false },
      mockRequestPermission
    ]);

    const { getByText } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('should show permission pending message while waiting', () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      null,
      jest.fn()
    ]);

    const { getByText } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Demande d\'autorisation pour la caméra...')).toBeTruthy();
  });

  it('should show no camera access message when permission denied', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: false },
      jest.fn()
    ]);

    const { getByText } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(getByText('Pas d\'accès à la caméra')).toBeTruthy();
    });
  });

  it('should render scanner and close button when permission granted', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      jest.fn()
    ]);

    const { getByText, UNSAFE_getByType } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const CameraView = require('expo-camera').CameraView;
      expect(UNSAFE_getByType(CameraView)).toBeTruthy();
      expect(getByText('Fermer')).toBeTruthy();
    });
  });

  it('should call onScan and show alert when barcode scanned', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      jest.fn()
    ]);

    const { UNSAFE_getByType } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    const CameraView = require('expo-camera').CameraView;
    await waitFor(() => {
      expect(UNSAFE_getByType(CameraView)).toBeTruthy();
    });

    const scanner = UNSAFE_getByType(CameraView);
    const mockBarcodeData = {
      type: 'ean13',
      data: '1234567890123'
    };

    await act(async () => {
      fireEvent(scanner, 'onBarcodeScanned', mockBarcodeData);
    });

    expect(mockOnScan).toHaveBeenCalledWith('1234567890123');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Code scanné!',
      'Code-barres: 1234567890123',
      expect.any(Array)
    );
  });

  it('should call onClose when close button pressed', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      jest.fn()
    ]);

    const { getByText } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(getByText('Fermer')).toBeTruthy();
    });

    fireEvent.press(getByText('Fermer'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset scanner when "Scanner à nouveau" is pressed in alert', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      jest.fn()
    ]);

    const { UNSAFE_getByType } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    const CameraView = require('expo-camera').CameraView;
    await waitFor(() => {
      expect(UNSAFE_getByType(CameraView)).toBeTruthy();
    });

    const scanner = UNSAFE_getByType(CameraView);
    
    // First scan
    await act(async () => {
      fireEvent(scanner, 'onBarcodeScanned', { type: 'ean13', data: '1111111111111' });
    });
    
    // Simulate pressing "Scanner à nouveau" button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const scanAgainButton = alertCall[2][0];
    
    await act(async () => {
      scanAgainButton.onPress();
    });

    // Should be able to scan again
    await act(async () => {
      fireEvent(scanner, 'onBarcodeScanned', { type: 'ean13', data: '2222222222222' });
    });
    
    expect(mockOnScan).toHaveBeenCalledTimes(2);
    expect(mockOnScan).toHaveBeenLastCalledWith('2222222222222');
  });

  it('should call onClose when OK is pressed in alert', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      jest.fn()
    ]);

    const { UNSAFE_getByType } = render(
      <BarcodeScanner
        onScan={mockOnScan}
        isScanning={true}
        onClose={mockOnClose}
      />
    );

    const CameraView = require('expo-camera').CameraView;
    await waitFor(() => {
      expect(UNSAFE_getByType(CameraView)).toBeTruthy();
    });

    const scanner = UNSAFE_getByType(CameraView);
    
    await act(async () => {
      fireEvent(scanner, 'onBarcodeScanned', { type: 'ean13', data: '3333333333333' });
    });

    // Simulate pressing "OK" button
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2][1];
    
    await act(async () => {
      okButton.onPress();
    });

    expect(mockOnClose).toHaveBeenCalled();
  });
});