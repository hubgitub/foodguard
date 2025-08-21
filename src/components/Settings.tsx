import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSelectedCountry, saveSelectedCountry } from '../i18n';

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChange: (language: string) => void;
  onCountryChange: (country: string) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

const countries = [
  { code: 'UK', flag: '🇬🇧' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'IT', flag: '🇮🇹' },
  { code: 'ES', flag: '🇪🇸' },
];

export default function Settings({
  visible,
  onClose,
  onLanguageChange,
  onCountryChange,
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedCountry, setSelectedCountry] = useState('FR');
  const [showAbout, setShowAbout] = useState(false);

  // Auto-updating build date - will be the current date when the app is built
  const buildDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadSelectedCountry();
  }, []);

  const loadSelectedCountry = async () => {
    const country = await getSelectedCountry();
    setSelectedCountry(country);
  };

  const handleLanguageChange = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem('app_language', languageCode);
    onLanguageChange(languageCode);
  };

  const handleCountryChange = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    await saveSelectedCountry(countryCode);
    onCountryChange(countryCode);
  };

  const handleSave = () => {
    // Simply close the modal - settings are already saved in real-time
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('settings.title')}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.optionsContainer}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.option,
                    selectedLanguage === lang.code && styles.selectedOption,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      selectedLanguage === lang.code && styles.selectedText,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.country')}</Text>
            <Text style={styles.helpText}>
              {t('settings.country_help', 'Select the country for product recall checks')}
            </Text>
            <View style={styles.optionsContainer}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.option,
                    selectedCountry === country.code && styles.selectedOption,
                  ]}
                  onPress={() => handleCountryChange(country.code)}
                >
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      selectedCountry === country.code && styles.selectedText,
                    ]}
                  >
                    {t(`countries.${country.code}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.apiNote}>
            <Text style={styles.apiNoteTitle}>ℹ️ API Availability:</Text>
            <Text style={styles.apiNoteText}>
              • 🇫🇷 France: ✅ Full API (Government){'\n'}
              • 🇬🇧 UK: ✅ JSON API (FSA){'\n'}
              • 🇮🇹 Italy: ⚠️ Limited (No API){'\n'}
              • 🇪🇸 Spain: ⚠️ Limited (No API)
            </Text>
          </View>

          <TouchableOpacity style={styles.aboutButton} onPress={() => setShowAbout(true)}>
            <Text style={styles.aboutButtonText}>{t('settings.about', 'About')}</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('settings.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t('settings.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aboutModalContent}>
            <Text style={styles.aboutTitle}>🛡️ FoodGuard</Text>
            <Text style={styles.aboutVersion}>{t('about.version', 'Version')}: 0.1</Text>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>{t('about.copyright', 'Copyright')}:</Text>
              <Text style={styles.aboutText}>© 2025 Gregware Claude Code</Text>
            </View>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>{t('about.build_date', 'Build Date')}:</Text>
              <Text style={styles.aboutText}>{buildDate}</Text>
            </View>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutLabel}>{t('about.description', 'Description')}:</Text>
              <Text style={styles.aboutDescription}>
                {t('about.app_description', 'FoodGuard helps you check product recalls from official government sources to ensure food safety.')}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.closeAboutButton} onPress={() => setShowAbout(false)}>
              <Text style={styles.closeAboutButtonText}>{t('settings.close', 'Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    paddingBottom: 20,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    minWidth: '45%',
    flex: 1,
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  apiNote: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  apiNoteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  apiNoteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  aboutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginTop: 10,
  },
  aboutButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  aboutModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  aboutSection: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
  },
  aboutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 5,
  },
  closeAboutButton: {
    marginTop: 20,
    padding: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  closeAboutButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});