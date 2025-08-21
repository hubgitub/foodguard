# FoodGuard - Store Deployment Guide

## Prerequisites

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo Account
```bash
eas login
```

### 3. Configure your project
```bash
eas build:configure
```

## Important Configuration Updates

### Update Bundle Identifiers
In `app.json`, replace:
- `com.yourcompany.foodguard` with your actual bundle identifier
- Update both iOS `bundleIdentifier` and Android `package`

### Create App Icons and Splash Screens

You need to create the following images:
1. **icon.png** - 1024x1024px (App icon)
2. **splash.png** - 1284x2778px (Splash screen)
3. **adaptive-icon.png** - 1024x1024px (Android adaptive icon)

You can use tools like:
- Figma, Sketch, or Canva for design
- https://www.appicon.co/ for generating different sizes
- https://apetools.webprofusion.com/app/#/ for splash screens

## iOS App Store Deployment

### 1. Apple Developer Account Requirements
- Active Apple Developer account ($99/year)
- App Store Connect access
- Apple ID configured

### 2. Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: FoodGuard
   - Primary Language: French
   - Bundle ID: com.yourcompany.foodguard
   - SKU: foodguard-001

### 3. Build for iOS
```bash
# Build for production
eas build --platform ios --profile production
```

### 4. Submit to App Store
```bash
# Submit automatically
eas submit --platform ios

# Or manually upload the .ipa file through Transporter app
```

### 5. App Store Requirements
- **Screenshots**: 
  - iPhone 6.7" (1290 × 2796)
  - iPhone 6.5" (1284 × 2778) 
  - iPhone 5.5" (1242 × 2208)
  - iPad Pro 12.9" (2048 × 2732) if supporting iPad

- **App Information**:
  - Description (French & English)
  - Keywords
  - Support URL
  - Privacy Policy URL (Required)
  - Category: Food & Drink or Utilities

- **Review Information**:
  - Demo account (if needed)
  - Notes for reviewer

## Android Google Play Store Deployment

### 1. Google Play Developer Account Requirements
- Active Google Play Developer account ($25 one-time)
- Google Play Console access

### 2. Create App in Google Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: FoodGuard
   - Default language: French
   - App type: App
   - Category: Food & Drink
   - Free/Paid: Free

### 3. Build for Android
```bash
# Build for production (AAB for Play Store)
eas build --platform android --profile production
```

### 4. Submit to Google Play
```bash
# Submit automatically (requires service account setup)
eas submit --platform android

# Or manually upload the .aab file through Play Console
```

### 5. Google Play Requirements
- **Screenshots**:
  - Phone: At least 2 (up to 8)
  - 7-inch tablet: Optional
  - 10-inch tablet: Optional

- **Graphics**:
  - Feature graphic: 1024 × 500
  - Icon: 512 × 512

- **Store Listing**:
  - Short description (80 characters)
  - Full description (4000 characters)
  - Privacy Policy URL (Required)

- **Content Rating**:
  - Complete questionnaire
  - Expected: Everyone

- **Target Audience**:
  - Age groups
  - Content guidelines

## Privacy Policy

You must create a privacy policy. Here's a template structure:

```
Privacy Policy for FoodGuard

Last updated: [Date]

1. Information We Collect
   - Camera access for barcode scanning only
   - No personal data collected
   - Cached product data stored locally

2. How We Use Information
   - Barcode scanning for product identification
   - Checking against French government recall database
   - Local caching for performance

3. Data Storage
   - All data stored locally on device
   - No server-side storage
   - Cache can be cleared by user

4. Third-Party Services
   - French Government Recall API (RappelConso)
   - Open Food Facts API (product information)

5. Contact
   - [Your contact email]
```

Host this on a service like:
- GitHub Pages (free)
- Netlify (free)
- Your own website

## Testing Before Submission

### 1. Test Production Build Locally
```bash
# Create preview build
eas build --platform all --profile preview

# Test on real devices using Expo Go or TestFlight/Internal Testing
```

### 2. Pre-submission Checklist
- [ ] All features working properly
- [ ] No crashes or errors
- [ ] Performance optimized
- [ ] Privacy policy published and linked
- [ ] App icons and splash screens created
- [ ] Store listings prepared in both languages
- [ ] Screenshots captured
- [ ] Content rating completed
- [ ] Testing on multiple devices

## Common Issues and Solutions

### Issue: Build fails with "bundleIdentifier not set"
**Solution**: Update app.json with your actual bundle identifier

### Issue: iOS submission rejected for missing usage descriptions
**Solution**: Ensure NSCameraUsageDescription is set in app.json

### Issue: Android build fails with duplicate permissions
**Solution**: Check for duplicate permissions in app.json

### Issue: App rejected for privacy policy
**Solution**: Create and host a privacy policy, add URL to store listings

## Estimated Timeline

1. **Preparation**: 1-2 days
   - Creating assets
   - Writing descriptions
   - Privacy policy

2. **Building**: 1-2 hours
   - EAS builds take 20-40 minutes each

3. **Review Process**:
   - iOS: 24-48 hours typically
   - Android: 2-3 hours typically

4. **Total**: 3-5 days from start to live

## Support Resources

- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/guidelines/
- Google Play Guidelines: https://play.google.com/console/about/policy/

## Next Steps

1. **Update Configuration**:
   - Change bundle identifier in app.json
   - Update EAS project ID

2. **Create Assets**:
   - Design app icon
   - Create splash screen
   - Capture screenshots

3. **Build and Test**:
   ```bash
   # Initialize EAS
   eas build:configure
   
   # Build for both platforms
   eas build --platform all --profile production
   ```

4. **Submit**:
   ```bash
   # Submit to both stores
   eas submit --platform all
   ```

Good luck with your app submission!