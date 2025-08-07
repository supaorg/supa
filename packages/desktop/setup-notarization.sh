#!/bin/bash

# Sila macOS Notarization Setup Script
# This script helps set up environment variables for notarization

echo "🔐 Sila macOS Notarization Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo "📝 Please enter your Apple Developer account details:"
echo ""

# Get Apple ID
echo -n "Apple ID (email): "
read -r apple_id

# Get app-specific password
echo -n "App-specific password: "
read -s app_specific_password
echo ""

# Get optional Apple Team ID
echo -n "Apple Team ID (optional, e.g. UY76UFAS3C): "
read -r apple_team_id

# Validate inputs
if [ -z "$apple_id" ] || [ -z "$app_specific_password" ]; then
    echo "❌ Apple ID and app-specific password are required."
    exit 1
fi

# Create .env file
cat > .env << EOF
# Sila macOS Notarization Configuration
# Generated on $(date)
APPLE_ID=$apple_id
APPLE_ID_PASSWORD=$app_specific_password
${apple_team_id:+APPLE_TEAM_ID=$apple_team_id}
EOF

echo ""
echo "✅ Environment variables saved to .env file"
echo ""
echo "📋 Next steps:"
echo "1. Test the setup: npm run build"
echo "2. Check notarization status in the build output"
echo "3. Verify the app: codesign --verify --verbose --deep --strict dist/mac/Sila.app"
echo ""
echo "🔒 Security note: The .env file contains sensitive information."
echo "   Make sure it's in your .gitignore and never commit it to version control."
echo ""
echo "📖 For more information, see: docs/dev/macos-notarization-setup.md"
