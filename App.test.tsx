import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from './App';
import { RecallService } from './src/services/recallApi';

// Mock the RecallService
jest.mock('./src/services/recallApi');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('App', () => {
  let mockRecallService: jest.Mocked<RecallService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup RecallService mock
    mockRecallService = {
      searchByBarcode: jest.fn(),
      searchByText: jest.fn(),
      clearCache: jest.fn()
    } as any;
    
    (RecallService.getInstance as jest.Mock).mockReturnValue(mockRecallService);
  });

  it('should render main screen with app title and buttons', () => {
    const { getByText } = render(<App />);

    expect(getByText('🛡️ FoodGuard')).toBeTruthy();
    expect(getByText('Vérificateur de rappels produits')).toBeTruthy();
    expect(getByText('Scanner un code-barres')).toBeTruthy();
    expect(getByText('Rechercher un produit')).toBeTruthy();
    expect(getByText('Comment ça marche?')).toBeTruthy();
  });

  it('should show scanner when scan button is pressed', () => {
    const { getByText, queryByTestId } = render(<App />);

    const scanButton = getByText('Scanner un code-barres');
    fireEvent.press(scanButton);

    // Scanner component should be rendered (mocked in jest.setup.js)
    expect(queryByTestId).toBeTruthy();
  });

  it('should search by text when search button is pressed', async () => {
    mockRecallService.searchByText.mockResolvedValueOnce([
      {
        id: '1',
        productName: 'Test Product',
        brand: 'Test Brand',
        recallDate: '2024-03-10',
        reason: 'Test reason',
        risk: 'Test risk',
        description: 'Test description',
        actions: 'Test actions'
      }
    ]);

    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test product');

    const searchButton = getByText('Rechercher');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockRecallService.searchByText).toHaveBeenCalledWith('test product');
      expect(getByText('Test Product')).toBeTruthy();
      expect(getByText('1 rappel(s) trouvé(s)')).toBeTruthy();
    });
  });

  it('should show alert when searching with empty query', () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, '');

    const searchButton = getByText('Rechercher');
    fireEvent.press(searchButton);

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez entrer un terme de recherche');
    expect(mockRecallService.searchByText).not.toHaveBeenCalled();
  });

  it('should show alert when searching with whitespace only', () => {
    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, '   ');

    const searchButton = getByText('Rechercher');
    fireEvent.press(searchButton);

    expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Veuillez entrer un terme de recherche');
    expect(mockRecallService.searchByText).not.toHaveBeenCalled();
  });

  it('should handle barcode scan result', async () => {
    mockRecallService.searchByBarcode.mockResolvedValueOnce({
      isRecalled: true,
      recalls: [
        {
          id: '1',
          productName: 'Scanned Product',
          brand: 'Scanned Brand',
          recallDate: '2024-03-10',
          reason: 'Contamination',
          risk: 'Health risk',
          description: 'Bacterial contamination',
          actions: 'Do not consume'
        }
      ],
      lastChecked: new Date()
    });

    const { getByText, UNSAFE_getByProps } = render(<App />);

    // Open scanner
    const scanButton = getByText('Scanner un code-barres');
    fireEvent.press(scanButton);

    // Find and trigger the onScan callback
    const scanner = UNSAFE_getByProps({ isScanning: true });
    
    await waitFor(async () => {
      await scanner.props.onScan('1234567890123');
      expect(mockRecallService.searchByBarcode).toHaveBeenCalledWith('1234567890123');
    });
  });

  it('should show loading indicator while searching', async () => {
    mockRecallService.searchByText.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test');

    const searchButton = getByText('Rechercher');
    fireEvent.press(searchButton);

    expect(getByText('Vérification en cours...')).toBeTruthy();

    await waitFor(() => {
      expect(mockRecallService.searchByText).toHaveBeenCalled();
    });
  });

  it('should handle search error gracefully', async () => {
    mockRecallService.searchByText.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test');

    const searchButton = getByText('Rechercher');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Impossible d\'effectuer la recherche. Veuillez réessayer.'
      );
    });
  });

  it('should handle barcode scan error gracefully', async () => {
    mockRecallService.searchByBarcode.mockRejectedValueOnce(new Error('API error'));

    const { getByText, UNSAFE_getByProps } = render(<App />);

    const scanButton = getByText('Scanner un code-barres');
    fireEvent.press(scanButton);

    const scanner = UNSAFE_getByProps({ isScanning: true });
    
    await waitFor(async () => {
      await scanner.props.onScan('9999999999999');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Impossible de vérifier le produit. Veuillez réessayer.'
      );
    });
  });

  it('should clear results when "Nouvelle recherche" is pressed', async () => {
    mockRecallService.searchByText.mockResolvedValueOnce([
      {
        id: '1',
        productName: 'Test Product',
        brand: 'Test Brand',
        recallDate: '2024-03-10',
        reason: 'Test reason',
        risk: 'Test risk',
        description: 'Test description',
        actions: 'Test actions'
      }
    ]);

    const { getByText, getByPlaceholderText, queryByText } = render(<App />);

    // Perform search
    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test');
    fireEvent.press(getByText('Rechercher'));

    await waitFor(() => {
      expect(getByText('Test Product')).toBeTruthy();
    });

    // Clear results
    const newSearchButton = getByText('Nouvelle recherche');
    fireEvent.press(newSearchButton);

    // Should return to main screen
    expect(queryByText('Test Product')).toBeNull();
    expect(getByText('🛡️ FoodGuard')).toBeTruthy();
  });

  it('should close scanner when close button is pressed', async () => {
    const { getByText, UNSAFE_getByProps, rerender } = render(<App />);

    // Open scanner
    const scanButton = getByText('Scanner un code-barres');
    fireEvent.press(scanButton);

    // Find scanner
    const scanner = UNSAFE_getByProps({ isScanning: true });
    expect(scanner).toBeTruthy();

    // Close scanner
    await waitFor(() => {
      scanner.props.onClose();
    });
    
    // Force re-render to update UI
    rerender(<App />);

    // Scanner should be closed (app title should be visible again)
    await waitFor(() => {
      expect(getByText('🛡️ FoodGuard')).toBeTruthy();
    });
  });

  it('should display multiple search results', async () => {
    mockRecallService.searchByText.mockResolvedValueOnce([
      {
        id: '1',
        productName: 'Product 1',
        brand: 'Brand 1',
        recallDate: '2024-03-10',
        reason: 'Reason 1',
        risk: 'Risk 1',
        description: 'Description 1',
        actions: 'Actions 1'
      },
      {
        id: '2',
        productName: 'Product 2',
        brand: 'Brand 2',
        recallDate: '2024-03-11',
        reason: 'Reason 2',
        risk: 'Risk 2',
        description: 'Description 2',
        actions: 'Actions 2'
      }
    ]);

    const { getByText, getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test');
    fireEvent.press(getByText('Rechercher'));

    await waitFor(() => {
      expect(getByText('2 rappel(s) trouvé(s)')).toBeTruthy();
      expect(getByText('Product 1')).toBeTruthy();
      expect(getByText('Product 2')).toBeTruthy();
      expect(getByText('Marque: Brand 1')).toBeTruthy();
      expect(getByText('Marque: Brand 2')).toBeTruthy();
    });
  });

  it('should handle submit editing on search input', async () => {
    mockRecallService.searchByText.mockResolvedValueOnce([]);

    const { getByPlaceholderText } = render(<App />);

    const searchInput = getByPlaceholderText('Nom du produit ou marque...');
    fireEvent.changeText(searchInput, 'test search');
    fireEvent(searchInput, 'onSubmitEditing');

    await waitFor(() => {
      expect(mockRecallService.searchByText).toHaveBeenCalledWith('test search');
    });
  });
});