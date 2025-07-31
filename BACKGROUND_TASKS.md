# Background Task Management & Notifications

This document explains the enhanced background task management system implemented for the MailCleaner app.

## Overview

The app now supports both **foreground** and **background** email cleaning with real-time progress tracking and notifications.

## Features Implemented

### 1. Enhanced Background Task Manager (`BackgroundTaskManager.ts`)

- **Progressive Notifications**: Shows real-time progress with ongoing notifications
- **Phase Tracking**: Displays current operation phase (Initializing, Processing, Analyzing, Cleaning, etc.)
- **Estimated Time**: Calculates and shows estimated time remaining
- **Milestone Notifications**: Celebrates progress every 25 emails deleted
- **Error Handling**: Comprehensive error reporting with notifications
- **Rate Limiting**: Prevents API throttling with smart delays

### 2. Progress Tracking (`TaskProgress` interface)

```typescript
interface TaskProgress {
  processed: number; // Total emails processed
  deleted: number; // Total emails deleted
  currentAction?: string; // Current operation description
  percentage?: number; // Progress percentage (0-100)
}
```

### 3. Enhanced UI Components

#### Progress Bar

- Visual progress indicator in the HomeScreen
- Shows completion percentage
- Real-time updates during sync

#### Detailed Status Display

- Current phase indicator
- Estimated time remaining
- Background/foreground mode indicator
- Error messages with emoji indicators

### 4. Notification System

#### Notification Types:

- **Start Notification**: "📧 Email Cleaning Started"
- **Progress Updates**: Real-time cleaning status
- **Milestone Celebrations**: "🎉 Great! Deleted 25 emails!"
- **Completion**: "✅ Successfully cleaned X emails in Xm!"
- **Error Alerts**: "❌ An error occurred: [error message]"

#### Notification Features:

- High priority for important alerts
- Persistent progress notifications
- Custom notification channel for email cleaning
- Sound and vibration support

### 5. Storage Integration

Uses the existing `Storage.ts` system with new keys:

- `DELETED_MESSAGES`: Stores deleted email records
- `BACKGROUND_TASK_STATE`: Current task state
- `SYNC_PROGRESS`: Real-time progress data
- `NOTIFICATION_SETTINGS`: User notification preferences
- `TASK_HISTORY`: Historical task data

## Usage Examples

### Starting Background Sync

```typescript
// Request notification permissions first
await BackgroundTaskManager.requestNotificationPermissions();

// Start background task with current preset
const preset = PresetUtils.getCurrentPreset();
await BackgroundTaskManager.startBackgroundTask(token, preset);
```

### Monitoring Progress

```typescript
// Get current progress
const progress = BackgroundTaskManager.getSyncProgress();
console.log(`Processed: ${progress.processed}, Deleted: ${progress.deleted}`);

// Get task state
const state = BackgroundTaskManager.getBackgroundTaskState();
console.log(`Phase: ${state.currentPhase}, Running: ${state.isRunning}`);
```

### Managing Deleted Messages

```typescript
// Get all deleted messages
const deletedMessages = BackgroundTaskManager.getDeletedMessages();

// Clear deleted messages log
BackgroundTaskManager.clearDeletedMessages();

// Save a new deleted message
const deletedMessage: DeletedMessage = {
  id: "msg123",
  subject: "Promotional Email",
  sender: "promo@example.com",
  deletedAt: Date.now(),
  presetUsed: "Marketing Emails",
};
BackgroundTaskManager.saveDeletedMessage(deletedMessage);
```

## Configuration

### Expo Configuration (`app.config.ts`)

```typescript
[
  "expo-notifications",
  {
    icon: "./branding/icon.png",
    color: "#2D9CDB",
    defaultChannel: "email-cleaning",
  },
],
  [
    "expo-task-manager",
    {
      enabledServices: ["background-sync"],
    },
  ];
```

### Notification Channel

- **Channel ID**: `email-cleaning`
- **Importance**: High
- **Features**: Sound, vibration, lights, badges
- **Color**: `#2D9CDB` (app primary color)

## Error Handling

The system includes comprehensive error handling:

1. **Network Errors**: Gmail API connection issues
2. **Authentication Errors**: Token expiration
3. **Rate Limiting**: Automatic retry with delays
4. **Parsing Errors**: Malformed email data
5. **Storage Errors**: MMKV storage issues

All errors are:

- Logged to console for debugging
- Stored in the background task state
- Displayed to users via notifications
- Shown in the UI with clear error messages

## Performance Optimizations

1. **Batch Processing**: Processes emails in pages of 50
2. **Smart Delays**: 100ms between messages, 500ms between pages
3. **Memory Management**: Limits stored deleted messages to 1000
4. **Progress Throttling**: Updates UI every 5 messages in foreground
5. **Notification Throttling**: Progress notifications every 3-5 deletions

## Testing the System

### 1. Test Notification Permissions

```typescript
const hasPermission =
  await BackgroundTaskManager.requestNotificationPermissions();
console.log("Notifications enabled:", hasPermission);
```

### 2. Test Progress Notifications

```typescript
await BackgroundTaskManager.sendProgressNotification(
  10,
  5,
  "Testing progress...",
  "Test Phase"
);
```

### 3. Test Milestone Notifications

```typescript
await BackgroundTaskManager.sendNotification(
  "🎉 Test Milestone",
  "This is a test milestone notification",
  { type: "milestone", deleted: 25 },
  { priority: "default" }
);
```

## Best Practices

1. **Always request notification permissions** before starting background tasks
2. **Monitor the `canRunInBackground` state** to determine available features
3. **Handle errors gracefully** and provide user feedback
4. **Use the progress bar** to show visual feedback during operations
5. **Clear progress notifications** when tasks complete or are cancelled
6. **Respect rate limits** to avoid Gmail API throttling

## Future Enhancements

Potential improvements that could be added:

1. **Scheduling**: Allow users to schedule automatic cleanings
2. **Batch Size Configuration**: Let users adjust processing speed
3. **Custom Notification Sounds**: Per-preset notification sounds
4. **Analytics**: Track cleaning statistics over time
5. **Undo Functionality**: Restore accidentally deleted emails
6. **Smart Suggestions**: AI-powered cleanup recommendations

## Troubleshooting

### Common Issues:

1. **Notifications not appearing**: Check device notification settings
2. **Background tasks not running**: Verify notification permissions
3. **Progress not updating**: Check network connectivity
4. **High battery usage**: Consider reducing batch sizes
5. **Gmail API errors**: Verify authentication and API quotas

### Debug Commands:

```typescript
// Check current state
console.log("Sync State:", BackgroundTaskManager.getBackgroundTaskState());
console.log("Progress:", BackgroundTaskManager.getSyncProgress());
console.log(
  "Deleted Messages:",
  BackgroundTaskManager.getDeletedMessages().length
);

// Clear all data
BackgroundTaskManager.clearDeletedMessages();
StorageUtils.delete(StorageKey.BACKGROUND_TASK_STATE);
StorageUtils.delete(StorageKey.SYNC_PROGRESS);
```
