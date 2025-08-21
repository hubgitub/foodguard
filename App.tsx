import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import BarcodeScanner from './src/components/BarcodeScanner';
import RecallResult from './src/components/RecallResult';
import { RecallService } from './src/services/recallApi';
import { RecallCheckResult, RecallInfo } from './src/types/recall';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<RecallCheckResult | null>(null);
  const [searchResults, setSearchResults] = useState<RecallInfo[]>([]);
  const [showResults, setShowResults] = useState(false);

  const recallService = RecallService.getInstance();

  const handleBarcodeScan = async (barcode: string) => {
    setIsScanning(false);
    setIsLoading(true);
    try {
      const result = await recallService.searchByBarcode(barcode);
      setScanResult(result);
      setShowResults(true);
      setSearchResults([]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de vérifier le produit. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un terme de recherche');
      return;
    }

    setIsLoading(true);
    try {
      const results = await recallService.searchByText(searchQuery);
      setSearchResults(results);
      setScanResult(null);
      setShowResults(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'effectuer la recherche. Veuillez réessayer.');
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
    const recallService = RecallService.getInstance();
    await recallService.clearCache();
    Alert.alert('Cache vidé', 'Le cache a été vidé avec succès');
  };

  return (
    <SafeAreaView style={styles.container}>
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
                  <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Résultats de recherche</Text>
                  <Text style={styles.subtitle}>{searchResults.length} rappel(s) trouvé(s)</Text>
                </View>
              </View>
              {searchResults.map((recall, index) => (
                <View key={recall.id || index} style={styles.searchResultCard}>
                  <Text style={styles.productName}>{recall.productName}</Text>
                  {recall.brand && <Text style={styles.brand}>Marque: {recall.brand}</Text>}
                  <Text style={styles.date}>
                    Date: {new Date(recall.recallDate).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={styles.reason}>{recall.reason}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.button} onPress={clearResults}>
                <Text style={styles.buttonText}>Nouvelle recherche</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>🛡️ FoodGuard</Text>
            <Text style={styles.appSubtitle}>Vérificateur de rappels produits</Text>
          </View>

          <View style={styles.scanSection}>
            <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>Scanner un code-barres</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Rechercher un produit</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Nom du produit ou marque..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleTextSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleTextSearch}>
              <Text style={styles.buttonText}>Rechercher</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Comment ça marche?</Text>
            <Text style={styles.infoText}>
              1. Scannez le code-barres de votre produit{'\n'}
              2. Ou recherchez par nom/marque{'\n'}
              3. Consultez instantanément les rappels officiels{'\n'}
              4. Données officielles du gouvernement français
            </Text>
            <TouchableOpacity style={styles.cacheButton} onPress={clearCache}>
              <Text style={styles.cacheButtonText}>Vider le cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Vérification en cours...</Text>
        </View>
      )}
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
