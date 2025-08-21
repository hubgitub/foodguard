# GitHub Authentication Guide

## Option 1: Use GitHub CLI (Recommended)

Run this command and follow the prompts:
```bash
gh auth login
```

When prompted:
1. Choose: GitHub.com
2. Choose: HTTPS
3. Authenticate with: Login with a web browser
4. Copy the one-time code
5. Press Enter to open browser
6. Paste the code and authorize

Then push with:
```bash
gh repo create foodguard --private --source=. --push
```

## Option 2: Create Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Give it a name: "FoodGuard CLI Access"
3. Set expiration (90 days recommended)
4. Select scopes:
   - ✅ repo (full control)
   - ✅ workflow (optional)
5. Click "Generate token"
6. **COPY THE TOKEN NOW** (you won't see it again!)

Then use it:
```bash
# Set the remote (if not already set)
git remote add origin https://github.com/hubgitub/foodguard.git

# Push using token as password
git push -u origin main
# Username: hubgitub
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```

## Option 3: Store Credentials

After getting your token, store it permanently:
```bash
# Configure git to store credentials
git config --global credential.helper osxkeychain

# Push (it will ask for credentials once)
git push -u origin main
# Username: hubgitub
# Password: YOUR_PERSONAL_ACCESS_TOKEN
```

## Option 4: Use Token in URL (Less Secure)

```bash
# Add remote with token embedded
git remote set-url origin https://hubgitub:YOUR_TOKEN@github.com/hubgitub/foodguard.git

# Then push normally
git push -u origin main
```

## Verify Your Setup

Check your remote:
```bash
git remote -v
```

Check authentication:
```bash
gh auth status
```