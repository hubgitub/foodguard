import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecallResult from '../RecallResult';
import { RecallCheckResult } from '../../types/recall';

// Mock Linking
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Linking = {
    openURL: jest.fn()
  };
  return RN;
});

describe('RecallResult', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when result is null', () => {
    const { UNSAFE_root } = render(
      <RecallResult result={null} onClose={mockOnClose} />
    );

    expect(UNSAFE_root.children.length).toBe(0);
  });

  it('should display safe status when product is not recalled', () => {
    const safeResult: RecallCheckResult = {
      isRecalled: false,
      recalls: [],
      lastChecked: new Date('2024-03-15T10:30:00')
    };

    const { getByText } = render(
      <RecallResult result={safeResult} onClose={mockOnClose} />
    );

    expect(getByText('✅ PRODUIT SÉCURISÉ')).toBeTruthy();
    expect(getByText(/Ce produit n'apparaît pas dans la liste des rappels/)).toBeTruthy();
    expect(getByText(/15\/03\/2024/)).toBeTruthy(); // French date format
  });

  it('should display recall warning when product is recalled', () => {
    const recalledResult: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Chocolat Noir 70%',
          brand: 'ChocoDelice',
          recallDate: '2024-03-10',
          reason: 'Présence de fragments de métal',
          risk: 'Risque de blessure',
          description: 'Fragments métalliques détectés',
          actions: 'Ne pas consommer, rapporter au magasin',
          distributors: ['Carrefour', 'Leclerc'],
          batchNumbers: ['LOT2024A', 'LOT2024B'],
          imageUrl: 'https://example.com/product.jpg'
        }
      ],
      lastChecked: new Date()
    };

    const { getByText } = render(
      <RecallResult result={recalledResult} onClose={mockOnClose} />
    );

    expect(getByText('⚠️ PRODUIT RAPPELÉ')).toBeTruthy();
    expect(getByText('Chocolat Noir 70%')).toBeTruthy();
    expect(getByText('Marque: ChocoDelice')).toBeTruthy();
    expect(getByText('Présence de fragments de métal')).toBeTruthy();
    expect(getByText('Risque de blessure')).toBeTruthy();
    expect(getByText('Ne pas consommer, rapporter au magasin')).toBeTruthy();
    expect(getByText('LOT2024A, LOT2024B')).toBeTruthy();
    expect(getByText('Carrefour, Leclerc')).toBeTruthy();
  });

  it('should handle multiple recalls', () => {
    const multipleRecallsResult: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Produit 1',
          brand: 'Marque 1',
          recallDate: '2024-03-10',
          reason: 'Raison 1',
          risk: 'Risque 1',
          description: 'Description 1',
          actions: 'Action 1',
          distributors: [],
          batchNumbers: []
        },
        {
          id: 'recall-2',
          productName: 'Produit 2',
          brand: 'Marque 2',
          recallDate: '2024-03-11',
          reason: 'Raison 2',
          risk: 'Risque 2',
          description: 'Description 2',
          actions: 'Action 2',
          distributors: [],
          batchNumbers: []
        }
      ],
      lastChecked: new Date()
    };

    const { getByText } = render(
      <RecallResult result={multipleRecallsResult} onClose={mockOnClose} />
    );

    expect(getByText('Produit 1')).toBeTruthy();
    expect(getByText('Produit 2')).toBeTruthy();
    expect(getByText('Raison 1')).toBeTruthy();
    expect(getByText('Raison 2')).toBeTruthy();
  });

  it.skip('should open image URL when link is pressed', () => {
    const resultWithImage: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Test Product',
          brand: 'Test Brand',
          recallDate: '2024-03-10',
          reason: 'Test reason',
          risk: 'Test risk',
          description: 'Test description',
          actions: 'Test actions',
          imageUrl: 'https://example.com/image.jpg'
        }
      ],
      lastChecked: new Date()
    };

    const { getByText } = render(
      <RecallResult result={resultWithImage} onClose={mockOnClose} />
    );

    const imageLink = getByText('Voir l\'image du produit');
    fireEvent.press(imageLink);

    const { Linking } = require('react-native');
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/image.jpg');
  });

  it('should not show image link when imageUrl is not provided', () => {
    const resultWithoutImage: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Test Product',
          brand: 'Test Brand',
          recallDate: '2024-03-10',
          reason: 'Test reason',
          risk: 'Test risk',
          description: 'Test description',
          actions: 'Test actions'
        }
      ],
      lastChecked: new Date()
    };

    const { queryByText } = render(
      <RecallResult result={resultWithoutImage} onClose={mockOnClose} />
    );

    expect(queryByText('Voir l\'image du produit')).toBeNull();
  });

  it('should call onClose when close button is pressed', () => {
    const result: RecallCheckResult = {
      isRecalled: false,
      recalls: [],
      lastChecked: new Date()
    };

    const { getByText } = render(
      <RecallResult result={result} onClose={mockOnClose} />
    );

    const closeButton = getByText('Fermer');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle recalls with missing optional fields', () => {
    const resultWithMissingFields: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Minimal Product',
          brand: '',
          recallDate: '2024-03-10',
          reason: '',
          risk: '',
          description: '',
          actions: '',
          distributors: undefined,
          batchNumbers: undefined
        }
      ],
      lastChecked: new Date()
    };

    const { getByText, queryByText } = render(
      <RecallResult result={resultWithMissingFields} onClose={mockOnClose} />
    );

    expect(getByText('Minimal Product')).toBeTruthy();
    expect(queryByText('Marque:')).toBeNull(); // Should not show empty brand
    expect(queryByText('Distributeurs:')).toBeNull(); // Should not show undefined distributors
    expect(queryByText('Numéros de lot:')).toBeNull(); // Should not show undefined batch numbers
  });

  it('should format date correctly in French locale', () => {
    const result: RecallCheckResult = {
      isRecalled: true,
      recalls: [
        {
          id: 'recall-1',
          productName: 'Test Product',
          brand: 'Test Brand',
          recallDate: '2024-01-15T12:00:00Z',
          reason: 'Test',
          risk: 'Test',
          description: 'Test',
          actions: 'Test'
        }
      ],
      lastChecked: new Date('2024-03-15T14:30:00')
    };

    const { getByText } = render(
      <RecallResult result={result} onClose={mockOnClose} />
    );

    // Check if date is formatted in French format (DD/MM/YYYY)
    expect(getByText(/15\/01\/2024/)).toBeTruthy();
  });
});