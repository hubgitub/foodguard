import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecallInfo, Product, RecallCheckResult } from '../types/recall';

const RAPPEL_CONSO_API = 'https://data.economie.gouv.fr/api/records/1.0/search/';
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product/';
const CACHE_KEY = 'recall_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class RecallService {
  private static instance: RecallService;
  private cache: Map<string, RecallCheckResult> = new Map();

  static getInstance(): RecallService {
    if (!RecallService.instance) {
      RecallService.instance = new RecallService();
    }
    return RecallService.instance;
  }

  async searchByBarcode(barcode: string): Promise<RecallCheckResult> {
    // Check cache first
    const cached = await this.getCachedResult(barcode);
    if (cached) {
      return cached;
    }

    try {
      // Fetch product info and recall data in parallel for better performance
      const [productInfo, recallResponse] = await Promise.all([
        this.fetchProductInfo(barcode),
        axios.get(RAPPEL_CONSO_API, {
          params: {
            dataset: 'rappelconso0',
            q: barcode,
            rows: 100,
            facet: ['categorie_de_produit', 'sous_categorie_de_produit', 'nom_de_la_marque_du_produit'],
          },
        })
      ]);

      const recalls: RecallInfo[] = recallResponse.data.records.map((record: any) => ({
        id: record.recordid,
        productName: record.fields.nom_de_la_marque_du_produit || '',
        brand: record.fields.noms_des_modeles_ou_references || '',
        barcode: barcode,
        gtin: record.fields.identification_des_produits,
        recallDate: record.fields.date_de_publication,
        reason: record.fields.motif_du_rappel || '',
        risk: record.fields.risques_encourus_par_le_consommateur || '',
        description: record.fields.description_complementaire_du_risque || '',
        actions: record.fields.conduites_a_tenir_par_le_consommateur || '',
        distributors: record.fields.distributeurs ? record.fields.distributeurs.split(',') : [],
        batchNumbers: record.fields.numero_de_lot ? record.fields.numero_de_lot.split(',') : [],
        imageUrl: record.fields.liens_vers_les_images,
      }));

      // Use product info from Open Food Facts, or fall back to recall data if available
      const product: Product = productInfo || {
        barcode: barcode,
        name: recalls.length > 0 ? recalls[0].productName : `Produit (Code: ${barcode})`,
        brand: recalls.length > 0 ? recalls[0].brand : undefined,
      };

      const result: RecallCheckResult = {
        isRecalled: recalls.length > 0,
        recalls,
        product,
        lastChecked: new Date(),
      };

      // Cache the result
      await this.cacheResult(barcode, result);

      return result;
    } catch (error) {
      console.error('Error fetching recall data:', error);
      throw new Error('Failed to check recall status');
    }
  }

  async searchByText(query: string): Promise<RecallInfo[]> {
    try {
      const response = await axios.get(RAPPEL_CONSO_API, {
        params: {
          dataset: 'rappelconso0',
          q: query,
          rows: 50,
          sort: '-date_de_publication',
          facet: ['categorie_de_produit', 'sous_categorie_de_produit', 'nom_de_la_marque_du_produit'],
        },
      });

      return response.data.records.map((record: any) => ({
        id: record.recordid,
        productName: record.fields.nom_de_la_marque_du_produit || '',
        brand: record.fields.noms_des_modeles_ou_references || '',
        recallDate: record.fields.date_de_publication,
        reason: record.fields.motif_du_rappel || '',
        risk: record.fields.risques_encourus_par_le_consommateur || '',
        description: record.fields.description_complementaire_du_risque || '',
        actions: record.fields.conduites_a_tenir_par_le_consommateur || '',
        distributors: record.fields.distributeurs ? record.fields.distributeurs.split(',') : [],
        imageUrl: record.fields.liens_vers_les_images,
      }));
    } catch (error) {
      console.error('Error searching recalls:', error);
      throw new Error('Failed to search recalls');
    }
  }

  private async getCachedResult(barcode: string): Promise<RecallCheckResult | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${barcode}`);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = new Date(data.lastChecked).getTime();
        // Invalidate cache if it's old or doesn't have product field
        if (Date.now() - cacheTime < CACHE_DURATION && data.product) {
          return data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  }

  private async cacheResult(barcode: string, result: RecallCheckResult): Promise<void> {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${barcode}`, JSON.stringify(result));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  private async fetchProductInfo(barcode: string): Promise<Product | null> {
    try {
      // Try Open Food Facts API
      const response = await axios.get(`${OPEN_FOOD_FACTS_API}${barcode}.json`);
      
      if (response.data && response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        // Check if product is vegan (ingredients_analysis_tags contains "en:vegan")
        const isVegan = product.ingredients_analysis_tags?.includes('en:vegan') || 
                        product.ingredients_analysis_tags?.includes('en:vegan-status-unknown') === false &&
                        product.ingredients_analysis_tags?.includes('en:non-vegan') === false;
        
        return {
          barcode: barcode,
          name: product.product_name || product.product_name_fr || product.generic_name || `Produit (Code: ${barcode})`,
          brand: product.brands || undefined,
          imageUrl: product.image_url || product.image_front_url || undefined,
          nutriScore: product.nutriscore_grade?.toUpperCase() || undefined,
          isVegan: product.ingredients_analysis_tags?.includes('en:vegan') || false,
        };
      }
    } catch (error) {
      console.error('Error fetching product info from Open Food Facts:', error);
    }

    // If Open Food Facts fails or returns no product, return basic info
    return {
      barcode: barcode,
      name: `Produit (Code: ${barcode})`,
      brand: undefined,
      imageUrl: undefined,
      nutriScore: undefined,
      isVegan: false,
    };
  }
}