# 🚀 FoodGuard Deployment Guide

Your FoodGuard app is ready to share with friends! Here are several ways to deploy and share it:

## Option 1: Share via Expo Go (Easiest for Testing)
**Best for: Quick testing with friends who have smartphones**

1. Make sure Expo is running:
   ```bash
   npx expo start
   ```

2. Share the QR code that appears in the terminal
3. Your friends need to:
   - Install "Expo Go" app from App Store (iOS) or Google Play (Android)
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - The app will load instantly!

**Note**: This only works while your development server is running on your local network.

## Option 2: Deploy to Vercel (Free Web Hosting)
**Best for: Permanent web link anyone can access**

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy the web build:
   ```bash
   cd dist
   vercel --prod
   ```

3. Follow the prompts (create account if needed)
4. You'll get a URL like: `https://foodguard.vercel.app`
5. Share this link with anyone!

## Option 3: Deploy to GitHub Pages (Free)
**Best for: If you already use GitHub**

1. Create a new GitHub repository called `foodguard`

2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial FoodGuard app"
   git remote add origin https://github.com/YOUR_USERNAME/foodguard.git
   git push -u origin main
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm install --save-dev gh-pages
   ```

4. Add to package.json scripts:
   ```json
   "predeploy": "expo export --platform web --output-dir dist",
   "deploy": "gh-pages -d dist"
   ```

5. Run:
   ```bash
   npm run deploy
   ```

6. Your app will be at: `https://YOUR_USERNAME.github.io/foodguard`

## Option 4: Deploy to Netlify (Free)
**Best for: Quick deployment with drag & drop**

1. Go to [netlify.com](https://netlify.com)
2. Sign up for free account
3. Drag the `dist` folder to the Netlify dashboard
4. Get instant URL like: `https://foodguard.netlify.app`

## Option 5: Build Native Apps (Advanced)
**Best for: Publishing to App Stores**

For iOS App Store or Google Play Store:
```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

Note: This requires Apple Developer ($99/year) or Google Play Developer ($25 one-time) accounts.

## Quick Share Options

### For Web Version (Already Built!)
Your web version is ready in the `dist` folder. You can:
- Upload to any web hosting service
- Share via Vercel, Netlify, or GitHub Pages (see above)
- The web version works on any device with a modern browser

### For Mobile Testing
While your development server is running (`npx expo start`):
- **Local Network**: Share the `exp://192.168.x.x:8081` URL
- **Tunnel** (for remote access): Run `npx expo start --tunnel`
- Friends need Expo Go app installed

## Current Status
✅ Web build created in `/dist` folder
✅ Ready for deployment to any hosting service
✅ Can be shared via Expo Go for mobile testing

## Recommended: Quick Deploy to Vercel
This is the fastest way to get a permanent link:

```bash
# If you haven't installed Vercel CLI yet
npm i -g vercel

# Deploy (from the foodguard-app directory)
cd dist && vercel --prod
```

You'll get a link in ~1 minute that you can share with anyone!

---
Built with ❤️ using Claude Code