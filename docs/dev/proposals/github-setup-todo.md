# GitHub Setup TODO for Electron Workflow

## Prerequisites
- [x] Apple Developer account ($99/year)
- [x] Code signing certificate from Apple Developer portal
- [x] App-specific password for Apple ID

## GitHub Secrets Setup

### 1. **Get Code Signing Certificate**
- [ ] Log into [Apple Developer Portal](https://developer.apple.com/account/)
- [ ] Go to Certificates, Identifiers & Profiles
- [ ] Create a new "Developer ID Application" certificate
- [ ] Download the certificate
- [ ] Export as p12 file with password:
  ```bash
  security export -k login.keychain -t identities -f pkcs12 -o certificate.p12
  ```
- [ ] Convert to base64:
  ```bash
  base64 -i certificate.p12
  ```

### 2. **Set up GitHub Repository Secrets**
Go to: `https://github.com/[username]/supa/settings/secrets/actions`

- [ ] **MACOS_CERTIFICATE_P12**
  - Value: Base64-encoded p12 certificate (from step 1)
  
- [ ] **MACOS_CERTIFICATE_PASSWORD**
  - Value: Password you set when exporting the p12 file
  
- [ ] **APPLE_ID**
  - Value: Your Apple Developer account email
  
- [ ] **APPLE_ID_PASSWORD**
  - Value: App-specific password (NOT your regular Apple ID password)
  - Generate at: https://appleid.apple.com/account/manage

### 3. **Generate App-Specific Password**
- [ ] Go to https://appleid.apple.com/account/manage
- [ ] Sign in with your Apple ID
- [ ] Go to "Security" → "App-Specific Passwords"
- [ ] Click "Generate Password"
- [ ] Use this password for `APPLE_ID_PASSWORD` secret

## Test the Workflow

### 4. **Create Test Tag**
- [ ] Create a test tag to trigger the workflow:
  ```bash
  git tag v0.1.0-test
  git push origin v0.1.0-test
  ```

### 5. **Monitor Workflow**
- [ ] Go to Actions tab in GitHub
- [ ] Check that all platforms build successfully
- [ ] Verify code signing works on macOS builds
- [ ] Check that GitHub release is created

## Troubleshooting

### If Code Signing Fails:
- [ ] Verify certificate is valid and not expired
- [ ] Check that p12 file is properly base64 encoded
- [ ] Ensure password matches the one used when exporting

### If Notarization Fails:
- [ ] Verify APPLE_ID and APPLE_ID_PASSWORD are correct
- [ ] Check that app-specific password is used (not regular password)
- [ ] Ensure Apple Developer account is active

## Cleanup
- [ ] Delete test tag after successful test:
  ```bash
  git tag -d v0.1.0-test
  git push origin --delete v0.1.0-test
  ```

## Notes
- Code signing is only required for macOS distribution
- Linux and Windows builds will work without signing
- The workflow will create both signed and unsigned artifacts
- GitHub releases will include all platform builds 