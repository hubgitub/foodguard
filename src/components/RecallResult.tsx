import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RecallCheckResult } from '../types/recall';

interface RecallResultProps {
  result: RecallCheckResult | null;
  onClose: () => void;
}

export default function RecallResult({ result, onClose }: RecallResultProps) {
  const { t, i18n } = useTranslation();
  if (!result) return null;

  const openLink = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, result.isRecalled ? styles.danger : styles.safe]}>
          <Text style={styles.statusText}>
            {result.isRecalled ? t('recall.status.recalled') : t('recall.status.safe')}
          </Text>
        </View>
      </View>

      {result.isRecalled && result.recalls.length > 0 && (
        <View style={styles.recallsContainer}>
          <Text style={styles.sectionTitle}>{t('recall.details_title')}</Text>
          {result.recalls.map((recall, index) => (
            <View key={recall.id || index} style={styles.recallCard}>
              <Text style={styles.productName}>{recall.productName}</Text>
              {recall.brand && <Text style={styles.brand}>{t('recall.brand')}: {recall.brand}</Text>}
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>{t('recall.date')}:</Text>
                <Text style={styles.value}>
                  {new Date(recall.recallDate).toLocaleDateString(i18n.language === 'en' ? 'en-GB' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'es' ? 'es-ES' : 'fr-FR')}
                </Text>
              </View>

              {recall.reason && (
                <View style={styles.section}>
                  <Text style={styles.sectionSubtitle}>{t('recall.reason')}:</Text>
                  <Text style={styles.text}>{recall.reason}</Text>
                </View>
              )}

              {recall.risk && (
                <View style={styles.section}>
                  <Text style={styles.sectionSubtitle}>{t('recall.risks')}:</Text>
                  <Text style={styles.dangerText}>{recall.risk}</Text>
                </View>
              )}

              {recall.actions && (
                <View style={styles.section}>
                  <Text style={styles.sectionSubtitle}>{t('recall.actions')}:</Text>
                  <Text style={styles.actionText}>{recall.actions}</Text>
                </View>
              )}

              {recall.batchNumbers && recall.batchNumbers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionSubtitle}>{t('recall.batch_numbers')}:</Text>
                  <Text style={styles.text}>{recall.batchNumbers.join(', ')}</Text>
                </View>
              )}

              {recall.distributors && recall.distributors.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionSubtitle}>{t('recall.distributors')}:</Text>
                  <Text style={styles.text}>{recall.distributors.join(', ')}</Text>
                </View>
              )}

              {recall.imageUrl && (
                <TouchableOpacity onPress={() => openLink(recall.imageUrl!)}>
                  <Text style={styles.link}>{t('recall.view_image')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {!result.isRecalled && (
        <View style={styles.safeContainer}>
          {result.product && (
            <View style={styles.productInfo}>
              {result.product.imageUrl && (
                <Image 
                  source={{ uri: result.product.imageUrl }} 
                  style={styles.productImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.productName}>{result.product.name}</Text>
              {result.product.brand && (
                <Text style={styles.brand}>{t('recall.brand')}: {result.product.brand}</Text>
              )}
              <View style={styles.nutritionInfo}>
                {result.product.nutriScore && (
                  <View style={[styles.nutriScoreBadge, styles[`nutriScore${result.product.nutriScore}`]]}>
                    <Text style={styles.nutriScoreText}>{t('nutrition.nutriscore')}</Text>
                    <Text style={styles.nutriScoreGrade}>{result.product.nutriScore}</Text>
                  </View>
                )}
                {result.product.isVegan && (
                  <View style={styles.veganBadge}>
                    <Text style={styles.veganIcon}>🌿</Text>
                    <Text style={styles.veganText}>{t('nutrition.vegan')}</Text>
                  </View>
                )}
              </View>
              {result.product.barcode && (
                <Text style={styles.barcode}>{t('recall.barcode')}: {result.product.barcode}</Text>
              )}
            </View>
          )}
          <Text style={styles.safeMessage}>
            {t('recall.no_recalls')}
          </Text>
          <Text style={styles.disclaimer}>
            {t('recall.last_checked')}: {new Date(result.lastChecked).toLocaleString(i18n.language === 'en' ? 'en-GB' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'es' ? 'es-ES' : 'fr-FR')}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>{t('recall.close')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
  },
  danger: {
    backgroundColor: '#dc3545',
  },
  safe: {
    backgroundColor: '#28a745',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recallsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  recallCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
    color: '#666',
  },
  value: {
    color: '#333',
  },
  section: {
    marginTop: 10,
  },
  sectionSubtitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  text: {
    color: '#666',
    lineHeight: 20,
  },
  dangerText: {
    color: '#dc3545',
    lineHeight: 20,
  },
  actionText: {
    color: '#007bff',
    lineHeight: 20,
    fontWeight: '500',
  },
  link: {
    color: '#007bff',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  safeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  productInfo: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  productImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  barcode: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    gap: 15,
  },
  nutriScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  nutriScoreText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  nutriScoreGrade: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  nutriScoreA: {
    backgroundColor: '#038141',
  },
  nutriScoreB: {
    backgroundColor: '#85BB2F',
  },
  nutriScoreC: {
    backgroundColor: '#FECB02',
  },
  nutriScoreD: {
    backgroundColor: '#EE8100',
  },
  nutriScoreE: {
    backgroundColor: '#E63E11',
  },
  veganBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  veganIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  veganText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  safeMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#007bff',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});