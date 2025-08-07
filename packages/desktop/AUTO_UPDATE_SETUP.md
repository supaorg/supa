# Auto-Update Setup for Sila Desktop

This document explains how the auto-update system works and how to use it.

## How it works

The auto-update system uses `electron-updater` with GitHub Releases as the distribution platform. When a new version is available, users will be prompted to download and install the update.

## Setup Requirements

1. **GitHub Token**: You need a GitHub token with `repo` permissions for publishing releases
2. **Repository Access**: The repository must be accessible for publishing releases

## Configuration

The auto-update is configured in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "mitkury",
      "repo": "sila"
    }
  }
}
```

## Building and Publishing

### Manual Build and Publish

```bash
# Build and publish immediately
npm run build:publish

# Build and publish as draft (for testing)
npm run build:publish-draft
```

### Automated Builds via GitHub Actions

The `.github/workflows/release.yml` workflow automatically builds and publishes when you:

1. Push a tag starting with `v` (e.g., `v1.0.1`)
2. Manually trigger the workflow

## Version Management

To release a new version:

1. Update the version in `package.json`
2. Create and push a tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

## User Experience

- **Automatic Checks**: The app checks for updates 3 seconds after startup (only in production)
- **Manual Checks**: Users can check for updates via Help → Check for Updates
- **Update Flow**: 
  1. User is notified of available update
  2. User chooses to download
  3. Download progress is shown
  4. User is prompted to restart for installation

## Development vs Production

- Auto-updates are **disabled** in development mode
- Auto-updates are **enabled** in production builds
- Update checks only happen in production builds

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure GitHub token has proper permissions
2. **Updates not found**: Check that releases are published to GitHub
3. **Download fails**: Verify network connectivity and GitHub access

### Debugging

Check the console logs for auto-updater events:
- `Checking for updates...`
- `Update available: [info]`
- `Update downloaded: [info]`
- `Auto updater error: [error]`

## Alternative Providers

You can change the provider in `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "s3",
      "bucket": "your-bucket-name",
      "region": "us-east-1"
    }
  }
}
```

Other supported providers include:
- `generic` (custom server)
- `bintray`
- `spaces` (DigitalOcean)
- `keygen` 