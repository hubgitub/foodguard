import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecallInfo, Product, RecallCheckResult } from '../types/recall';

// API Endpoints for different countries
const API_ENDPOINTS = {
  FR: {
    // French Government API (RappelConso)
    url: 'https://data.economie.gouv.fr/api/records/1.0/search/',
    dataset: 'rappelconso0',
    searchField: 'q',
    facets: ['categorie_de_produit', 'sous_categorie_de_produit', 'nom_de_la_marque_du_produit'],
  },
  UK: {
    // UK Food Standards Agency - JSON endpoint (public, no key required)
    jsonUrl: 'https://data.food.gov.uk/food-alerts/search.json',
  },
  IT: {
    // Italian data currently limited - fallback to basic search
    dataPortal: 'https://www.salute.gov.it/portale/news/p3_2_1_1_1.jsp?menu=notizie&id=2454',
  },
  ES: {
    // Spanish data currently limited - fallback to basic search
    alertsUrl: 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/alertas_alimentarias.htm',
  },
};

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product/';
const CACHE_KEY = 'recall_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours


export class MultiCountryRecallService {
  private static instance: MultiCountryRecallService;
  private currentCountry: string = 'FR';

  constructor() {
    // Initialize service
  }

  static getInstance(): MultiCountryRecallService {
    if (!MultiCountryRecallService.instance) {
      MultiCountryRecallService.instance = new MultiCountryRecallService();
    }
    return MultiCountryRecallService.instance;
  }

  setCountry(country: string) {
    this.currentCountry = country;
  }

  async searchByBarcode(barcode: string, country?: string): Promise<RecallCheckResult> {
    const targetCountry = country || this.currentCountry;
    
    // Check cache first
    const cached = await this.getCachedResult(barcode, targetCountry);
    if (cached) {
      return cached;
    }

    try {
      // Fetch product info and recall data in parallel
      const [productInfo, recalls] = await Promise.all([
        this.fetchProductInfo(barcode),
        this.fetchRecallsByCountry(barcode, targetCountry),
      ]);

      const result: RecallCheckResult = {
        isRecalled: recalls.length > 0,
        recalls,
        product: productInfo || { barcode, name: `Product (Code: ${barcode})` },
        lastChecked: new Date(),
      };

      // Cache the result
      await this.cacheResult(barcode, targetCountry, result);

      return result;
    } catch (error) {
      // Silent error - handled by returning empty result
      throw new Error('Failed to check recall status');
    }
  }

  async searchByText(query: string, country?: string): Promise<RecallInfo[]> {
    const targetCountry = country || this.currentCountry;
    
    switch (targetCountry) {
      case 'FR':
        return this.searchFrenchRecalls(query);
      case 'UK':
        return this.searchUKRecalls(query);
      case 'IT':
        return this.searchItalianRecalls(query);
      case 'ES':
        return this.searchSpanishRecalls(query);
      default:
        return this.searchFrenchRecalls(query);
    }
  }

  private async fetchRecallsByCountry(barcode: string, country: string): Promise<RecallInfo[]> {
    switch (country) {
      case 'FR':
        return this.fetchFrenchRecalls(barcode);
      case 'UK':
        return this.fetchUKRecalls(barcode);
      case 'IT':
        return this.fetchItalianRecalls(barcode);
      case 'ES':
        return this.fetchSpanishRecalls(barcode);
      default:
        return this.fetchFrenchRecalls(barcode);
    }
  }

  // FRANCE - RappelConso API (fully functional)
  private async fetchFrenchRecalls(barcode: string): Promise<RecallInfo[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FR.url, {
        params: {
          dataset: API_ENDPOINTS.FR.dataset,
          q: barcode,
          rows: 100,
          facet: API_ENDPOINTS.FR.facets,
        },
      });

      return response.data.records.map((record: any) => ({
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
    } catch (error) {
      // Silent error - handled by returning empty array
      return [];
    }
  }

  private async searchFrenchRecalls(query: string): Promise<RecallInfo[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FR.url, {
        params: {
          dataset: API_ENDPOINTS.FR.dataset,
          q: query,
          rows: 50,
          sort: '-date_de_publication',
          facet: API_ENDPOINTS.FR.facets,
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
      // Silent error - handled by returning empty array
      return [];
    }
  }

  // UK - Food Standards Agency (using public JSON endpoint)
  private async fetchUKRecalls(barcode: string): Promise<RecallInfo[]> {
    try {
      // Try the public JSON endpoint first
      const response = await axios.get(API_ENDPOINTS.UK.jsonUrl, {
        params: {
          search: barcode,
          limit: 100,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any) => ({
          id: item.id || `uk-${Date.now()}`,
          productName: item.title || item.productName || '',
          brand: item.brand || '',
          barcode: barcode,
          recallDate: item.created || item.alertDate || new Date().toISOString(),
          reason: item.reason || item.problem || '',
          risk: item.riskStatement || '',
          description: item.description || item.productDetails || '',
          actions: item.actionTaken || item.consumerAdvice || '',
          distributors: item.retailers ? item.retailers.split(',') : [],
          batchNumbers: item.batchCodes ? item.batchCodes.split(',') : [],
          imageUrl: item.productImageUrl,
        }));
      }

      // Return empty if JSON fails
      return [];
    } catch (error) {
      // Silent error - handled by returning empty array
      // Return empty on error
      return [];
    }
  }


  private async searchUKRecalls(query: string): Promise<RecallInfo[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.UK.jsonUrl, {
        params: {
          search: query,
          limit: 50,
        },
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.items) {
        return response.data.items.map((item: any) => ({
          id: item.id || `uk-${Date.now()}`,
          productName: item.title || item.productName || '',
          brand: item.brand || '',
          recallDate: item.created || item.alertDate || new Date().toISOString(),
          reason: item.reason || item.problem || '',
          risk: item.riskStatement || '',
          description: item.description || item.productDetails || '',
          actions: item.actionTaken || item.consumerAdvice || '',
          distributors: item.retailers ? item.retailers.split(',') : [],
          batchNumbers: item.batchCodes ? item.batchCodes.split(',') : [],
          imageUrl: item.productImageUrl,
        }));
      }
      return [];
    } catch (error) {
      // Silent error - handled by returning empty array
      return [];
    }
  }

  // ITALY - Ministry of Health (Limited support - JSON API not available)
  private async fetchItalianRecalls(barcode: string): Promise<RecallInfo[]> {
    // Currently no direct JSON API available for Italian recalls
    // Return empty array - users can check the official website
    // Italian recalls: Direct API not available
    return [];
  }

  private async searchItalianRecalls(query: string): Promise<RecallInfo[]> {
    // Currently no direct JSON API available for Italian recalls
    // Italian recalls: Direct API not available
    return [];
  }

  // SPAIN - AESAN (Limited support - JSON API not available)
  private async fetchSpanishRecalls(barcode: string): Promise<RecallInfo[]> {
    // Currently no direct JSON API available for Spanish recalls
    // Return empty array - users can check the official website
    // Spanish recalls: Direct API not available
    return [];
  }

  private async searchSpanishRecalls(query: string): Promise<RecallInfo[]> {
    // Currently no direct JSON API available for Spanish recalls
    // Spanish recalls: Direct API not available
    return [];
  }

  // Helper methods to extract information from RSS descriptions
  private extractBrandFromDescription(description: string): string {
    // Try to extract brand from common patterns
    const brandMatch = description.match(/(?:Brand|Marca|Marque|Marchio):\s*([^,\n]+)/i);
    return brandMatch ? brandMatch[1].trim() : '';
  }

  private extractReasonFromDescription(description: string): string {
    // Try to extract reason from common patterns
    const reasonMatch = description.match(/(?:Reason|Motivo|Raison|Motif|Ragione):\s*([^.\n]+)/i);
    if (reasonMatch) return reasonMatch[1].trim();
    
    // Return first sentence as fallback
    const firstSentence = description.split('.')[0];
    return firstSentence.substring(0, 200);
  }

  // Product info from Open Food Facts (works for all countries)
  private async fetchProductInfo(barcode: string): Promise<Product | null> {
    try {
      const response = await axios.get(`${OPEN_FOOD_FACTS_API}${barcode}.json`);
      
      if (response.data && response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        return {
          barcode: barcode,
          name: product.product_name || product.product_name_fr || product.generic_name || `Product (Code: ${barcode})`,
          brand: product.brands || undefined,
          imageUrl: product.image_url || product.image_front_url || undefined,
          nutriScore: product.nutriscore_grade?.toUpperCase() || undefined,
          isVegan: product.ingredients_analysis_tags?.includes('en:vegan') || false,
        };
      }
    } catch (error) {
      // Silent error - handled by returning null
    }

    return {
      barcode: barcode,
      name: `Product (Code: ${barcode})`,
      brand: undefined,
      imageUrl: undefined,
      nutriScore: undefined,
      isVegan: false,
    };
  }

  // Cache management
  private async getCachedResult(barcode: string, country: string): Promise<RecallCheckResult | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${country}_${barcode}`);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = new Date(data.lastChecked).getTime();
        if (Date.now() - cacheTime < CACHE_DURATION && data.product) {
          return data;
        }
      }
    } catch (error) {
      // Cache read error - will fetch fresh data
    }
    return null;
  }

  private async cacheResult(barcode: string, country: string, result: RecallCheckResult): Promise<void> {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}_${country}_${barcode}`, JSON.stringify(result));
    } catch (error) {
      // Cache write error - non-critical
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      // Clear cache error - non-critical
    }
  }
}