import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { StorageUtils, StorageKey } from "./Storage";
import { PresetUtils } from "./PresetUtils";
import { Preset } from "@/screens/PresetsScreen";

export interface DeletedMessage {
  id: string;
  subject: string;
  sender: string;
  deletedAt: number;
  presetUsed: string;
}

export interface BackgroundTaskState {
  isRunning: boolean;
  totalProcessed: number;
  totalDeleted: number;
  startedAt?: number;
  lastError?: string;
  currentPhase?: string;
  estimatedTimeRemaining?: number;
}

export interface TaskProgress {
  processed: number;
  deleted: number;
  currentAction?: string;
  percentage?: number;
}

const BACKGROUND_SYNC_TASK = "background-sync-task";
const NOTIFICATION_CHANNEL_ID = "email-cleaning";

// Configure notifications
Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
  name: "Email Cleaning",
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: "#2D9CDB",
  enableLights: true,
  enableVibrate: true,
  showBadge: true,
});

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class BackgroundTaskManager {
  private static progressNotificationId: string | null = null;
  private static syncInProgress: boolean = false;
  private static shouldContinueInBackground: boolean = false;

  /**
   * Check if app is in background
   */
  private static isAppInBackground(): boolean {
    return AppState.currentState !== "active";
  }

  /**
   * Set background continuation flag
   */
  static setShouldContinueInBackground(shouldContinue: boolean) {
    this.shouldContinueInBackground = shouldContinue;
  }

  /**
   * Check if sync should continue in background
   */
  static getShouldContinueInBackground(): boolean {
    return this.shouldContinueInBackground;
  }

  /**
   * Request notification permissions with enhanced settings
   */
  static async requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: false,
        },
        android: {
          useExactAlarm: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === "granted";
  }

  /**
   * Send a local notification with enhanced features
   */
  static async sendNotification(
    title: string,
    body: string,
    data?: any,
    options?: {
      persistent?: boolean;
      ongoing?: boolean;
      priority?: "default" | "high" | "max";
      identifier?: string;
    }
  ) {
    const hasPermission = await this.requestNotificationPermissions();
    if (!hasPermission) return null;

    const notificationContent: Notifications.NotificationContentInput = {
      title,
      body,
      data,
      categoryIdentifier: NOTIFICATION_CHANNEL_ID,
      priority:
        options?.priority === "high"
          ? Notifications.AndroidNotificationPriority.HIGH
          : options?.priority === "max"
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.DEFAULT,
      sticky: options?.persistent || false,
      ...(options?.ongoing && {
        autoDismiss: false,
      }),
    };

    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Send immediately
      identifier: options?.identifier,
    });

    return identifier;
  }

  /**
   * Send progress notification with ongoing status
   */
  static async sendProgressNotification(
    processed: number,
    deleted: number,
    currentAction?: string,
    phase?: string
  ) {
    const title = phase
      ? `Email Cleaning - ${phase}`
      : "Email Cleaning in Progress";
    const body =
      currentAction || `Processed ${processed} emails, deleted ${deleted}`;

    // Cancel previous progress notification if exists
    if (this.progressNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        this.progressNotificationId
      );
    }

    this.progressNotificationId = await this.sendNotification(
      title,
      body,
      {
        type: "progress",
        processed,
        deleted,
        phase,
        currentAction,
      },
      {
        persistent: true,
        ongoing: true,
        priority: "default",
        identifier: "email-cleaning-progress",
      }
    );
  }

  /**
   * Clear progress notification
   */
  static async clearProgressNotification() {
    if (this.progressNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(
        this.progressNotificationId
      );
      this.progressNotificationId = null;
    }
  }

  /**
   * Save deleted message to storage
   */
  static saveDeletedMessage(message: DeletedMessage) {
    const existingMessages =
      StorageUtils.get<DeletedMessage[]>(StorageKey.DELETED_MESSAGES) || [];
    const updatedMessages = [...existingMessages, message];

    // Keep only last 1000 messages to prevent storage bloat
    if (updatedMessages.length > 1000) {
      updatedMessages.splice(0, updatedMessages.length - 1000);
    }

    StorageUtils.set(StorageKey.DELETED_MESSAGES, updatedMessages);
  }

  /**
   * Get all deleted messages
   */
  static getDeletedMessages(): DeletedMessage[] {
    return (
      StorageUtils.get<DeletedMessage[]>(StorageKey.DELETED_MESSAGES) || []
    );
  }

  /**
   * Clear deleted messages log
   */
  static clearDeletedMessages() {
    StorageUtils.delete(StorageKey.DELETED_MESSAGES);
  }

  /**
   * Update background task state with enhanced tracking
   */
  static updateBackgroundTaskState(state: Partial<BackgroundTaskState>) {
    const currentState = this.getBackgroundTaskState();
    const newState = { ...currentState, ...state };

    // Calculate estimated time remaining if we have progress data
    if (state.totalProcessed && currentState.startedAt) {
      const elapsed = Date.now() - currentState.startedAt;
      const processingRate = state.totalProcessed / (elapsed / 1000); // emails per second

      // Rough estimate based on typical email volumes
      const estimatedTotal = Math.max(state.totalProcessed * 3, 1000); // Conservative estimate
      const remaining = estimatedTotal - state.totalProcessed;

      if (processingRate > 0) {
        newState.estimatedTimeRemaining = Math.round(
          remaining / processingRate
        );
      }
    }

    StorageUtils.set(StorageKey.BACKGROUND_TASK_STATE, newState);
  }

  /**
   * Get background task state
   */
  static getBackgroundTaskState(): BackgroundTaskState {
    return (
      StorageUtils.get<BackgroundTaskState>(
        StorageKey.BACKGROUND_TASK_STATE
      ) || {
        isRunning: false,
        totalProcessed: 0,
        totalDeleted: 0,
      }
    );
  }

  /**
   * Update sync progress with enhanced tracking
   */
  static updateSyncProgress(progress: TaskProgress) {
    StorageUtils.set(StorageKey.SYNC_PROGRESS, progress);
  }

  /**
   * Get sync progress
   */
  static getSyncProgress(): TaskProgress {
    return (
      StorageUtils.get<TaskProgress>(StorageKey.SYNC_PROGRESS) || {
        processed: 0,
        deleted: 0,
      }
    );
  }

  /**
   * Start background sync task with enhanced tracking
   */
  static async startBackgroundTask(token: string, preset: Preset) {
    try {
      // Set background continuation flag
      this.setShouldContinueInBackground(true);

      // Update task state
      this.updateBackgroundTaskState({
        isRunning: true,
        startedAt: Date.now(),
        totalProcessed: 0,
        totalDeleted: 0,
        lastError: undefined,
        currentPhase: "Initializing",
      });

      // Send start notification
      await this.sendNotification(
        "Email Cleaning Started",
        `Starting to clean emails using "${preset.name}" preset`,
        { type: "sync_started", presetName: preset.name },
        { priority: "high" }
      );

      // Start progress notification
      await this.sendProgressNotification(
        0,
        0,
        "Connecting to Gmail...",
        "Initializing"
      );

      // Register and start background task
      await this.registerAndStartBackgroundTask(token, preset);
    } catch (error) {
      console.error("Error starting background task:", error);
      this.updateBackgroundTaskState({
        isRunning: false,
        lastError: (error as Error).message,
      });

      await this.sendNotification(
        "Email Cleaning Failed to Start",
        `Error: ${(error as Error).message}`,
        { type: "sync_error", error: (error as Error).message },
        { priority: "high" }
      );

      await this.clearProgressNotification();
    }
  }

  /**
   * Register and start the actual background task
   */
  static async registerAndStartBackgroundTask(token: string, preset: Preset) {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async ({ data, error }) => {
        if (error) {
          console.error("Background task error:", error);
          BackgroundTaskManager.updateBackgroundTaskState({
            isRunning: false,
            lastError: error.message,
          });
          return;
        }

        console.log("Background task executing with data:", data);

        try {
          // Type guard for data
          if (
            data &&
            typeof data === "object" &&
            "token" in data &&
            "preset" in data
          ) {
            // Run the sync task
            await BackgroundTaskManager.runSyncTask(
              (data as any).token,
              (data as any).preset
            );
          } else {
            throw new Error("Invalid background task data");
          }
        } catch (syncError) {
          console.error("Background sync error:", syncError);
          BackgroundTaskManager.updateBackgroundTaskState({
            isRunning: false,
            lastError: (syncError as Error).message,
          });
        }
      });

      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK
      );

      if (!isRegistered) {
        console.log("Background task registered, running sync directly...");
      } else {
        console.log("Background task already registered");
      }

      // Since expo-task-manager doesn't have startTaskAsync, we'll run the sync directly
      // but with the task registered for future background execution
      await this.runSyncTask(token, preset);
    } catch (error) {
      console.error("Failed to register background task:", error);
      // Fallback to direct execution
      await this.runSyncTask(token, preset);
    }
  }

  /**
   * Stop background task with cleanup
   */
  static async stopBackgroundTask() {
    try {
      // Stop sync in progress
      this.syncInProgress = false;

      // Update state first
      this.updateBackgroundTaskState({
        isRunning: false,
        currentPhase: "Stopped",
      });

      // Clear progress notification
      await this.clearProgressNotification();

      // Unregister background task if it exists
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_SYNC_TASK
      );
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
        console.log("Background task unregistered");
      }

      // Send stop notification
      await this.sendNotification(
        "Email Cleaning Stopped",
        "Background email cleaning has been stopped by user",
        { type: "sync_stopped" },
        { priority: "default" }
      );
    } catch (error) {
      console.error("Error stopping background task:", error);
    }
  }

  /**
   * Background task handler
   */
  static backgroundSyncTask = async ({
    data,
    error,
  }: {
    data: any;
    error?: TaskManager.TaskManagerError;
  }) => {
    if (error) {
      console.error("Background task error:", error);
      BackgroundTaskManager.updateBackgroundTaskState({
        isRunning: false,
        lastError: error.message,
      });
      return;
    }

    try {
      const { token, preset } = data;
      await BackgroundTaskManager.runSyncTask(token, preset);
    } catch (err) {
      console.error("Background sync error:", err);
      BackgroundTaskManager.updateBackgroundTaskState({
        isRunning: false,
        lastError: err.message,
      });
    }
  };

  /**
   * Main sync task logic with enhanced progress tracking
   */
  static async runSyncTask(token: string, preset: Preset) {
    let totalProcessed = 0;
    let totalDeleted = 0;
    let nextPageToken: string | undefined;
    let pageCount = 0;
    const startTime = Date.now();

    try {
      // Phase 1: Initial setup
      this.updateBackgroundTaskState({
        currentPhase: "Fetching email list",
        totalProcessed,
        totalDeleted,
      });

      await this.sendProgressNotification(
        totalProcessed,
        totalDeleted,
        "Fetching email list from Gmail...",
        "Setup"
      );

      do {
        pageCount++;

        // Update phase for each page
        this.updateBackgroundTaskState({
          currentPhase: `Processing page ${pageCount}`,
        });

        const { messages, nextPageToken: newToken } =
          await this.getGmailMessages(token, nextPageToken);

        if (!messages || messages.length === 0) {
          break;
        }

        await this.sendProgressNotification(
          totalProcessed,
          totalDeleted,
          `Processing page ${pageCount} (${messages.length} emails)`,
          "Processing"
        );

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];

          try {
            // Update current action every 10 messages
            if (i % 10 === 0) {
              await this.sendProgressNotification(
                totalProcessed,
                totalDeleted,
                `Checking email ${i + 1}/${
                  messages.length
                } on page ${pageCount}`,
                "Analyzing"
              );
            }

            const messageDetails = await this.parseGmailMessage(
              msg,
              token,
              preset
            );
            totalProcessed++;

            if (messageDetails.shouldDelete) {
              await this.deleteGmailMessage(msg.id, token);

              // Save deleted message
              const deletedMessage: DeletedMessage = {
                id: msg.id,
                subject: messageDetails.subject,
                sender: messageDetails.sender,
                deletedAt: Date.now(),
                presetUsed: preset.name,
              };

              this.saveDeletedMessage(deletedMessage);
              totalDeleted++;

              // Update progress notification for deletions
              if (totalDeleted % 5 === 0) {
                await this.sendProgressNotification(
                  totalProcessed,
                  totalDeleted,
                  `Deleted "${messageDetails.subject.substring(0, 30)}..."`,
                  "Cleaning"
                );
              }

              // Send milestone notifications
              if (totalDeleted > 0 && totalDeleted % 25 === 0) {
                await this.sendNotification(
                  "📧 Cleaning Progress",
                  `Great! Deleted ${totalDeleted} emails so far. Keep going!`,
                  {
                    type: "milestone",
                    deleted: totalDeleted,
                    processed: totalProcessed,
                  },
                  { priority: "default" }
                );
              }
            }

            // Update progress in storage
            this.updateSyncProgress({
              processed: totalProcessed,
              deleted: totalDeleted,
              currentAction: `Processing email ${totalProcessed}`,
              percentage: Math.min((pageCount / 10) * 100, 95), // Rough estimate
            });

            this.updateBackgroundTaskState({
              totalProcessed,
              totalDeleted,
            });

            // Small delay to prevent rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (msgError) {
            console.error("Error processing message:", msgError);
            // Continue with next message
          }
        }

        nextPageToken = newToken;

        // Delay between pages
        await new Promise((resolve) => setTimeout(resolve, 500));
      } while (nextPageToken);

      // Calculate final stats
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      const durationMinutes = Math.round(durationSeconds / 60);

      // Task completed successfully
      this.updateBackgroundTaskState({
        isRunning: false,
        totalProcessed,
        totalDeleted,
        currentPhase: "Completed",
      });

      this.updateSyncProgress({
        processed: totalProcessed,
        deleted: totalDeleted,
        currentAction: "Completed",
        percentage: 100,
      });

      await this.clearProgressNotification();

      // Send completion notification with stats
      const completionMessage =
        totalDeleted > 0
          ? `🎉 Successfully cleaned ${totalDeleted} emails in ${
              durationMinutes > 0
                ? `${durationMinutes}m`
                : `${durationSeconds}s`
            }!`
          : `✅ Scan complete! No emails matched your "${preset.name}" preset criteria.`;

      await this.sendNotification(
        "Email Cleaning Complete",
        completionMessage,
        {
          type: "sync_completed",
          processed: totalProcessed,
          deleted: totalDeleted,
          duration: durationSeconds,
          presetUsed: preset.name,
        },
        { priority: "high" }
      );
    } catch (error) {
      console.error("Sync task error:", error);

      this.updateBackgroundTaskState({
        isRunning: false,
        lastError: error.message,
        totalProcessed,
        totalDeleted,
        currentPhase: "Error",
      });

      await this.clearProgressNotification();

      await this.sendNotification(
        "Email Cleaning Error",
        `❌ An error occurred: ${error.message}`,
        {
          type: "sync_error",
          error: error.message,
          processed: totalProcessed,
          deleted: totalDeleted,
        },
        { priority: "high" }
      );

      throw error;
    }
  }

  /**
   * Get Gmail messages from API
   */
  static async getGmailMessages(token: string, pageToken?: string) {
    const baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
    let url = baseUrl + `?maxResults=50`; // Increased batch size for efficiency
    if (pageToken) url += `&pageToken=${pageToken}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to fetch Gmail messages: ${res.status} ${errorText}`
      );
    }

    const data = await res.json();
    return {
      messages: data.messages || [],
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Parse Gmail message and check if it should be deleted
   */
  static async parseGmailMessage(msg: any, token: string, preset: Preset) {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch message details: ${res.status}`);
    }

    const data = await res.json();
    let subject = "";
    let body = "";
    let sender = "";

    if (data.payload && data.payload.headers) {
      const subjectHeader = data.payload.headers.find(
        (h: any) => h.name.toLowerCase() === "subject"
      );
      if (subjectHeader) subject = subjectHeader.value;

      const fromHeader = data.payload.headers.find(
        (h: any) => h.name.toLowerCase() === "from"
      );
      if (fromHeader) sender = fromHeader.value;
    }

    // Extract body content
    if (data.payload && data.payload.parts) {
      for (const part of data.payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          try {
            body += atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          } catch (e) {
            // Handle decode error
          }
        }
      }
    } else if (data.payload && data.payload.body && data.payload.body.data) {
      try {
        body += atob(
          data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")
        );
      } catch (e) {
        // Handle decode error
      }
    }

    const shouldDelete = PresetUtils.doesEmailMatchPreset(
      subject,
      body,
      sender,
      preset
    );

    return {
      subject,
      sender,
      body,
      shouldDelete,
    };
  }

  /**
   * Delete Gmail message
   */
  static async deleteGmailMessage(messageId: string, token: string) {
    // First trash the message
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Then permanently delete it
    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}
