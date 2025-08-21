/**
 * @jest-environment node
 */

// Mock modules before imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve())
}));

jest.mock('axios');

import { RecallService } from '../recallApi';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RecallService', () => {
  let recallService: RecallService;

  beforeEach(() => {
    recallService = RecallService.getInstance();
    jest.clearAllMocks();
    (AsyncStorage.clear as jest.Mock).mockClear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('searchByBarcode', () => {
    it('should return recall data when product is recalled', async () => {
      const mockBarcode = '1234567890';
      const mockResponse = {
        data: {
          records: [
            {
              recordid: 'test-id-1',
              fields: {
                nom_de_la_marque_du_produit: 'Test Product',
                noms_des_modeles_ou_references: 'Test Brand',
                identification_des_produits: mockBarcode,
                date_de_publication: '2024-01-15',
                motif_du_rappel: 'Contamination bactérienne',
                risques_encourus_par_le_consommateur: 'Risque sanitaire',
                description_complementaire_du_risque: 'Risque de salmonelle',
                conduites_a_tenir_par_le_consommateur: 'Ne pas consommer',
                distributeurs: 'Carrefour,Leclerc',
                numero_de_lot: 'LOT123,LOT456',
                liens_vers_les_images: 'https://example.com/image.jpg'
              }
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await recallService.searchByBarcode(mockBarcode);

      expect(result.isRecalled).toBe(true);
      expect(result.recalls).toHaveLength(1);
      expect(result.recalls[0].productName).toBe('Test Product');
      expect(result.recalls[0].reason).toBe('Contamination bactérienne');
      expect(result.recalls[0].distributors).toEqual(['Carrefour', 'Leclerc']);
      expect(result.recalls[0].batchNumbers).toEqual(['LOT123', 'LOT456']);
    });

    it('should return no recall when product is safe', async () => {
      const mockBarcode = '9876543210';
      const mockResponse = {
        data: {
          records: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await recallService.searchByBarcode(mockBarcode);

      expect(result.isRecalled).toBe(false);
      expect(result.recalls).toHaveLength(0);
      expect(result.lastChecked).toBeInstanceOf(Date);
    });

    it('should cache results', async () => {
      const mockBarcode = '1111111111';
      const mockResponse = {
        data: {
          records: []
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // First call
      await recallService.searchByBarcode(mockBarcode);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      
      // Setup cache return
      const cachedData = {
        isRecalled: false,
        recalls: [],
        lastChecked: new Date().toISOString()
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedData));

      // Second call should use cache
      await recallService.searchByBarcode(mockBarcode);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should handle API errors gracefully', async () => {
      const mockBarcode = '0000000000';
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(recallService.searchByBarcode(mockBarcode)).rejects.toThrow(
        'Failed to check recall status'
      );
    });
  });

  describe('searchByText', () => {
    it('should return search results', async () => {
      const searchQuery = 'chocolat';
      const mockResponse = {
        data: {
          records: [
            {
              recordid: 'test-id-1',
              fields: {
                nom_de_la_marque_du_produit: 'Chocolat Noir',
                noms_des_modeles_ou_references: 'MarqueA',
                date_de_publication: '2024-02-01',
                motif_du_rappel: 'Présence d\'allergènes non mentionnés',
                risques_encourus_par_le_consommateur: 'Risque allergique',
                description_complementaire_du_risque: 'Contient des arachides',
                conduites_a_tenir_par_le_consommateur: 'Rapporter au magasin',
                distributeurs: 'Auchan',
                liens_vers_les_images: 'https://example.com/choco.jpg'
              }
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await recallService.searchByText(searchQuery);

      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Chocolat Noir');
      expect(results[0].reason).toBe('Présence d\'allergènes non mentionnés');
    });

    it('should handle search API errors', async () => {
      const searchQuery = 'test';
      mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

      await expect(recallService.searchByText(searchQuery)).rejects.toThrow(
        'Failed to search recalls'
      );
    });
  });

  describe('clearCache', () => {
    it('should clear all cached results', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
        'recall_cache_123',
        'recall_cache_456',
        'other_key'
      ]);

      await recallService.clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'recall_cache_123',
        'recall_cache_456'
      ]);
    });
  });
});