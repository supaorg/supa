# Supa iOS Support Proposal

## Overview

This proposal outlines the necessary modifications to adapt Supa for iOS, leveraging Tauri 2's iOS build capabilities. The mobile version will require adjustments to file system access strategies, interface layouts, and interaction patterns to provide a native-feeling iOS experience while maintaining feature parity with the desktop application where appropriate.

## Background

Supa is currently a desktop application built using TypeScript, SvelteKit, and Tauri. With Tauri 2's support for iOS, we have an opportunity to expand to mobile platforms using our existing codebase with targeted modifications.

## Implementation Plan

### 1. File System & Storage Strategy

#### Current Approach
- Supa currently uses the Tauri plugin-fs (`@tauri-apps/plugin-fs`) for file system access
- Spaces are stored in user-selected directories that can be local or cloud-synced
- Each space consists of:
  - A `space.json` file containing the space ID
  - Files for storing operations in JSONL format
  - An encrypted `secrets` file for storing API keys

#### iOS Adjustments
- **iCloud Integration**: 
  - Modify the space creation/opening flow to use iCloud container directories
  - Use `NSFileManager.defaultManager.URLForUbiquityContainerIdentifier` to access iCloud Drive container
  - Example iCloud path: `~/Library/Mobile Documents/iCloud~com~supa~app/Documents/`

##### iCloud Container Access Strategy
- **Be Explicit About Container IDs**: Always specify the exact container identifier when accessing the container:
  ```swift
  let containerURL = FileManager.default.url(forUbiquityContainerIdentifier: "iCloud.com.supa.app")?.appendingPathComponent("Documents")
  ```
  
- **Handle Container Access Issues**: Some users may experience container access issues after app updates. To mitigate:
  - Implement robust retry mechanisms with exponential backoff
  - Add diagnostics to detect when container access is lost
  - Create a recovery flow that guides users through re-authorizing iCloud access
  
- **Container Validation**: Implement a thorough validation routine:
  ```swift
  func validateICloudAccess() -> Bool {
    guard let containerURL = FileManager.default.url(forUbiquityContainerIdentifier: "iCloud.com.supa.app") else {
      // Container not available - iCloud may be disabled
      return false
    }
    
    let documentURL = containerURL.appendingPathComponent("Documents")
    
    // Check if directory exists, create if needed
    if !FileManager.default.fileExists(atPath: documentURL.path) {
      do {
        try FileManager.default.createDirectory(at: documentURL, withIntermediateDirectories: true)
      } catch {
        // Failed to create directory
        return false
      }
    }
    
    // Verify write access with canary file
    let canaryURL = documentURL.appendingPathComponent("canary.txt")
    do {
      try "test".write(to: canaryURL, atomically: true, encoding: .utf8)
      try FileManager.default.removeItem(at: canaryURL)
      return true
    } catch {
      // Write test failed
      return false
    }
  }
  ```

- **Monitor for Changes**: Subscribe to `NSUbiquitousKeyValueStore` and `NSFileManager` notifications to detect iCloud status changes:
  ```swift
  NotificationCenter.default.addObserver(
    self,
    selector: #selector(ubiquityIdentityDidChange),
    name: NSNotification.Name.NSUbiquityIdentityDidChange,
    object: nil
  )
  ```

- **Tauri File System Plugin Updates**:
  - Update Tauri file system capabilities in `capabilities/default.json` to work with iOS sandboxing
  - Target specific iOS-compatible directories using environment variables

- **Space Management**:
  - Add an iOS-specific option in the UI to store spaces in iCloud
  - Maintain the existing encryption approach for secrets
  - Implement file coordination to handle iCloud sync conflicts
  - Add diagnostic options in settings to verify iCloud access status

### 2. UI/UX Adaptations

#### TTabs for Mobile

Implement a Safari-style tab experience using our existing TTabs library:

- **Tab Bar Interface**: Position at bottom of screen for thumb accessibility
- **Tab Overview**: Implement grid view for tab management (similar to Safari)
- **Gesture Support**: Add swipe gestures for tab switching and management
- **Layout Adjustments**:
  - Compact header designs
  - Touch-optimized UI elements (larger tap targets)
  - Simplified navigation paths

```svelte
<!-- Conceptual implementation of mobile tab interface -->
<div class="mobile-tabs-container">
  <div class="tab-content">
    <!-- Current tab content -->
  </div>
  
  <nav class="tab-bar">
    <button on:click={showTabOverview}>
      <TabCountBadge count={openTabs.length} />
    </button>
    <!-- Tab controls -->
    <button on:click={newTab}>+</button>
  </nav>
</div>
```

### 3. AI Provider Integration

- **Key Storage**: Continue using Supa's existing encrypted secrets mechanism for storing API keys
  - The current approach of storing encrypted secrets in a separate file is already secure and compatible with iOS
  - No need to migrate to iOS keychain as our existing system provides sufficient security
- **Optimized Network Handling**: Improve request handling for mobile networks with intermittent connectivity
- **Background Processing**: Configure appropriate background modes for ongoing AI tasks that respect iOS power management

### 4. Mobile-Specific Features

- **Share Extension**: Allow sharing content from other apps to Supa
- **Keyboard Extensions**: Consider custom keyboard options for AI assistance
- **Shortcuts App Integration**: Create iOS shortcuts for common Supa actions
- **Widgets**: Provide home screen widgets for quick access to chats

### 5. Build & Distribution

Leverage Tauri's iOS build capabilities:

```shell
npm run tauri ios build -- --export-method app-store-connect
```

Distribution will follow the standard App Store submission process, requiring:

- App Store Developer account
- Provisioning profiles
- App Store Connect setup
- Review compliance preparations

## Technical Considerations

### Performance

- **Memory Management**: iOS has stricter memory limits than desktop
- **Battery Usage**: Optimize AI interactions to minimize battery drain
- **Network Efficiency**: Implement efficient caching and compression

### Device Support

- Focus initially on iPhone with modern iOS (15+)
- Plan iPad-specific layouts in a future iteration

### Offline Capabilities

- Ensure core functionality works offline
- Queue AI requests when connectivity is restored

## Project Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Research & Planning | 2 weeks | Finalize technical approach, set up iOS dev environment |
| Core Adaptations | 4 weeks | Implement file system changes, basic UI adaptations |
| Mobile UI | 3 weeks | Develop mobile-optimized UI, implement TTabs mobile version |
| Testing | 3 weeks | Device testing, performance optimization |
| App Store Prep | 2 weeks | Prepare submission, marketing materials |

## Success Metrics

- User retention on mobile vs desktop
- Feature parity percentage
- Average session length on mobile
- App Store rating

## Conclusion

The iOS version of Supa will extend our reach to mobile users while maintaining the core principles of privacy, flexibility, and open-source development. By carefully adapting our existing architecture rather than creating a separate codebase, we can efficiently deliver a high-quality mobile experience while keeping maintenance manageable.

## Appendix: Common iCloud Container Issues

Based on developer experiences, the following issues are commonly encountered with iCloud containers:

1. **Container Access After Updates**: Some users report losing access to iCloud containers after app updates. This appears to affect a small percentage of users but can be disruptive.

2. **Entitlement Mismatches**: Changes to iCloud container identifiers between builds can cause permission issues. Always maintain consistent container identifiers across app versions.

3. **Delayed Container Creation**: Initial container creation can take time to propagate through Apple's systems. Implement retry logic with appropriate timeouts.

4. **User Disabled iCloud**: Users may disable iCloud for the app or globally. Always provide graceful fallbacks to local storage.

5. **Quota Limitations**: Be mindful of iCloud storage quotas and implement appropriate error handling for when users exceed their storage limit. 