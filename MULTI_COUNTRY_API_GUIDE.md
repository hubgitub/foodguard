# Multi-Country Food Recall API Integration Guide

## Overview

FoodGuard now supports multiple countries with internationalization (i18n) for English, French, Italian, and Spanish languages, along with recall checking for UK, France, Italy, and Spain.

## Current API Status

### ✅ France (Fully Functional)
- **API**: RappelConso (Government Official)
- **Endpoint**: `https://data.economie.gouv.fr/api/records/1.0/search/`
- **Status**: ✅ Fully implemented and working
- **Features**: 
  - Barcode search
  - Text search
  - Complete recall details
  - No API key required

### ⚠️ United Kingdom (Requires Registration)
- **API**: Food Standards Agency (FSA)
- **Website**: https://data.food.gov.uk/
- **Status**: ⚠️ Placeholder implementation
- **Required Actions**:
  1. Register at https://data.food.gov.uk/
  2. Obtain API key
  3. Update `multiCountryRecallApi.ts` with API key
  4. Implement API calls following FSA documentation

### ⚠️ Italy (No Official API)
- **Authority**: Ministry of Health (Ministero della Salute)
- **Website**: https://www.salute.gov.it/
- **Status**: ⚠️ No direct API available
- **Alternative Solutions**:
  1. Web scraping (requires additional libraries)
  2. Check for CSV/JSON data exports
  3. RSS feed integration
  4. Contact ministry for data access

### ⚠️ Spain (No Official API)
- **Authority**: AESAN (Agencia Española de Seguridad Alimentaria)
- **Website**: https://www.aesan.gob.es/
- **Status**: ⚠️ No direct API available
- **Alternative Solutions**:
  1. Web scraping
  2. RSS feed if available
  3. Data export files
  4. Contact AESAN for API access

## Implementation Details

### Language Support
The app supports 4 languages:
- 🇬🇧 English
- 🇫🇷 French
- 🇮🇹 Italian
- 🇪🇸 Spanish

### Country Selection
Users can select their country for recall checks:
- 🇬🇧 United Kingdom
- 🇫🇷 France
- 🇮🇹 Italy
- 🇪🇸 Spain

### File Structure
```
src/
├── i18n/
│   ├── index.ts          # i18n configuration
│   └── locales/
│       ├── en.json       # English translations
│       ├── fr.json       # French translations
│       ├── it.json       # Italian translations
│       └── es.json       # Spanish translations
├── services/
│   ├── recallApi.ts      # Original French API service
│   └── multiCountryRecallApi.ts  # Multi-country API service
└── components/
    └── Settings.tsx       # Language & country settings
```

## How to Complete UK Integration

1. **Register for API Access**:
   ```
   Visit: https://data.food.gov.uk/
   Sign up for developer account
   Request API key
   ```

2. **Update the API Service**:
   ```typescript
   // In multiCountryRecallApi.ts
   private async fetchUKRecalls(barcode: string): Promise<RecallInfo[]> {
     const API_KEY = 'YOUR_API_KEY_HERE';
     const response = await axios.get(API_ENDPOINTS.UK.url, {
       params: { search: barcode },
       headers: { 'Authorization': `Bearer ${API_KEY}` }
     });
     // Map response to RecallInfo format
   }
   ```

## How to Add Italy/Spain Support

Since these countries don't have official APIs, you have several options:

### Option 1: Web Scraping
```bash
npm install cheerio axios
```

```typescript
import * as cheerio from 'cheerio';

private async fetchItalianRecalls(barcode: string): Promise<RecallInfo[]> {
  const response = await axios.get(ITALIAN_RECALL_URL);
  const $ = cheerio.load(response.data);
  // Parse HTML and extract recall data
}
```

### Option 2: RSS Feed Integration
```bash
npm install rss-parser
```

```typescript
import Parser from 'rss-parser';

private async fetchSpanishRecalls(barcode: string): Promise<RecallInfo[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(SPANISH_RSS_URL);
  // Filter and map RSS items to RecallInfo
}
```

### Option 3: Contact Authorities
Reach out to the respective government agencies:
- Italy: urp@sanita.it
- Spain: informacion@aesan.gob.es

Request API access or data export options.

## Testing Different Countries

1. **Change Language**:
   - Tap the settings icon (⚙️)
   - Select your preferred language
   - The app will update immediately

2. **Change Country**:
   - In settings, select the target country
   - This changes which recall database is queried

3. **Test Barcodes by Country**:
   - France: Use any French product barcode
   - UK: Will need valid UK product barcodes
   - Italy/Spain: Currently returns empty results

## Future Enhancements

1. **Implement UK API** once registered
2. **Add web scraping** for Italy and Spain
3. **Cache country-specific data** separately
4. **Add more countries** (Germany, Netherlands, etc.)
5. **Implement fallback** to Open Food Facts for all countries
6. **Add notification system** for new recalls

## Environment Variables

For production, store API keys securely:

```javascript
// .env file
UK_FSA_API_KEY=your_uk_api_key_here
ITALY_SCRAPER_URL=italian_recall_page_url
SPAIN_RSS_FEED=spanish_rss_feed_url
```

## Contributing

To add support for a new country:

1. Add country code to `countries` array in Settings.tsx
2. Add translations in all locale files
3. Implement fetch method in multiCountryRecallApi.ts
4. Add API endpoint configuration
5. Test thoroughly with real product barcodes

## Resources

- **Open Food Facts API**: https://world.openfoodfacts.org/data
- **EU RASFF**: https://webgate.ec.europa.eu/rasff-window/screen/search
- **FDA (USA)**: https://www.fda.gov/food/recalls-outbreaks-emergencies
- **CFIA (Canada)**: https://www.inspection.gc.ca/en

## Support

For questions about API integration:
- Open an issue on GitHub
- Contact the respective government agencies
- Check the API documentation for each country