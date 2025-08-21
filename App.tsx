import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import './src/i18n'; // Initialize i18n
import BarcodeScanner from './src/components/BarcodeScanner';
import RecallResult from './src/components/RecallResult';
import Settings from './src/components/Settings';
import { MultiCountryRecallService } from './src/services/multiCountryRecallApi';
import { RecallCheckResult, RecallInfo } from './src/types/recall';
import { getSelectedCountry } from './src/i18n';
import { validateBarcode, validateSearchQuery } from './src/utils/validation';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { t, i18n } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<RecallCheckResult | null>(null);
  const [searchResults, setSearchResults] = useState<RecallInfo[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentCountry, setCurrentCountry] = useState('FR');
  const [appIsReady, setAppIsReady] = useState(false);

  const recallService = MultiCountryRecallService.getInstance();

  useEffect(() => {
    async function prepare() {
      try {
        // Load country preference and any other initial data
        await loadCountryPreference();
        // Artificially delay for splash screen visibility (optional)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the app to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  const loadCountryPreference = async () => {
    const country = await getSelectedCountry();
    setCurrentCountry(country);
    recallService.setCountry(country);
  };

  const handleLanguageChange = (language: string) => {
    // Language change is handled by i18n
  };

  const handleCountryChange = (country: string) => {
    setCurrentCountry(country);
    recallService.setCountry(country);
  };

  const handleBarcodeScan = async (barcode: string) => {
    setIsScanning(false);
    
    // Validate barcode input
    const validBarcode = validateBarcode(barcode);
    if (!validBarcode) {
      Alert.alert(t('errors.invalid_barcode', 'Invalid barcode format'), '');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await recallService.searchByBarcode(validBarcode);
      setScanResult(result);
      setShowResults(true);
      setSearchResults([]);
    } catch (error) {
      Alert.alert(t('errors.check_failed'), '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async () => {
    // Validate and sanitize search query
    const validQuery = validateSearchQuery(searchQuery);
    if (!validQuery) {
      Alert.alert(t('errors.empty_search'), '');
      return;
    }

    setIsLoading(true);
    try {
      const results = await recallService.searchByText(validQuery);
      setSearchResults(results);
      setScanResult(null);
      setShowResults(true);
    } catch (error) {
      Alert.alert(t('errors.search_failed'), '');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setShowResults(false);
    setScanResult(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearCache = async () => {
    await recallService.clearCache();
    Alert.alert(t('messages.cache_cleared'), '');
  };

  return (
    <SafeAreaView style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="dark-content" />
      {isScanning ? (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          isScanning={isScanning}
          onClose={() => setIsScanning(false)}
        />
      ) : showResults ? (
        <>
          {scanResult ? (
            <RecallResult result={scanResult} onClose={clearResults} />
          ) : searchResults.length > 0 ? (
            <ScrollView style={styles.searchResultsContainer}>
              <View style={styles.resultsHeader}>
                <TouchableOpacity style={styles.backButton} onPress={clearResults}>
                  <Text style={styles.backButtonText}>{t('search.back')}</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>{t('search.results_title')}</Text>
                  <Text style={styles.subtitle}>{t('search.results_count', { count: searchResults.length })}</Text>
                </View>
              </View>
              {searchResults.map((recall, index) => (
                <View key={recall.id || index} style={styles.searchResultCard}>
                  <Text style={styles.productName}>{recall.productName}</Text>
                  {recall.brand && <Text style={styles.brand}>{t('recall.brand')}: {recall.brand}</Text>}
                  <Text style={styles.date}>
                    {t('recall.date')}: {new Date(recall.recallDate).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'es' ? 'es-ES' : 'fr-FR')}
                  </Text>
                  <Text style={styles.reason}>{recall.reason}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.button} onPress={clearResults}>
                <Text style={styles.buttonText}>{t('search.new_search')}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <Text style={styles.appTitle}>{t('app.title')}</Text>
            <Text style={styles.appSubtitle}>{t('app.subtitle')}</Text>
            <View style={styles.countryIndicator}>
              <Text style={styles.countryText}>
                {currentCountry === 'UK' ? '🇬🇧' : currentCountry === 'FR' ? '🇫🇷' : currentCountry === 'IT' ? '🇮🇹' : '🇪🇸'} {t(`countries.${currentCountry}`)}
              </Text>
            </View>
          </View>

          <View style={styles.scanSection}>
            <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>{t('scanner.button')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('search.or', 'OR')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>{t('search.title')}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleTextSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleTextSearch}>
              <Text style={styles.buttonText}>{t('search.button')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>{t('info.title')}</Text>
            <Text style={styles.infoText}>{t('info.steps')}</Text>
            <TouchableOpacity style={styles.cacheButton} onPress={clearCache}>
              <Text style={styles.cacheButtonText}>{t('info.clear_cache')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>{t('errors.loading')}</Text>
        </View>
      )}

      <Settings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLanguageChange={handleLanguageChange}
        onCountryChange={handleCountryChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 10,
  },
  settingsIcon: {
    fontSize: 24,
  },
  countryIndicator: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  countryText: {
    fontSize: 14,
    color: '#666',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  scanSection: {
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontWeight: 'bold',
  },
  searchSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  cacheButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignSelf: 'center',
  },
  cacheButtonText: {
    fontSize: 12,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchResultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultsHeader: {
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  searchResultCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  reason: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 5,
  },
});
