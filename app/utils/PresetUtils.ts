import { StorageUtils, StorageKey } from "./Storage";
import { Preset, mockPresets } from "@/screens/PresetsScreen";

export class PresetUtils {
  /**
   * Get all presets (both default and custom)
   */
  static getAllPresets(): Preset[] {
    const customPresets =
      StorageUtils.get<Preset[]>(StorageKey.CUSTOM_PRESETS) || [];
    return [...mockPresets, ...customPresets];
  }

  /**
   * Get the currently selected preset
   */
  static getCurrentPreset(): Preset | null {
    const currentPresetId = StorageUtils.get<string>(StorageKey.CURRENT_PRESET);
    if (!currentPresetId) return null;

    const allPresets = this.getAllPresets();
    return allPresets.find((preset) => preset.id === currentPresetId) || null;
  }

  /**
   * Get only custom presets
   */
  static getCustomPresets(): Preset[] {
    return StorageUtils.get<Preset[]>(StorageKey.CUSTOM_PRESETS) || [];
  }

  /**
   * Save a new custom preset
   */
  static saveCustomPreset(preset: Preset): void {
    const existingCustomPresets = this.getCustomPresets();
    const updatedPresets = [...existingCustomPresets, preset];
    StorageUtils.set(StorageKey.CUSTOM_PRESETS, updatedPresets);
  }

  /**
   * Update an existing custom preset
   */
  static updateCustomPreset(presetId: string, updatedPreset: Preset): boolean {
    const customPresets = this.getCustomPresets();
    const presetIndex = customPresets.findIndex(
      (preset) => preset.id === presetId
    );

    if (presetIndex === -1) return false;

    customPresets[presetIndex] = updatedPreset;
    StorageUtils.set(StorageKey.CUSTOM_PRESETS, customPresets);
    return true;
  }

  /**
   * Delete a custom preset
   */
  static deleteCustomPreset(presetId: string): boolean {
    const customPresets = this.getCustomPresets();
    const filteredPresets = customPresets.filter(
      (preset) => preset.id !== presetId
    );

    if (filteredPresets.length === customPresets.length) return false;

    StorageUtils.set(StorageKey.CUSTOM_PRESETS, filteredPresets);

    // If the deleted preset was selected, clear the selection
    const currentPresetId = StorageUtils.get<string>(StorageKey.CURRENT_PRESET);
    if (currentPresetId === presetId) {
      StorageUtils.delete(StorageKey.CURRENT_PRESET);
    }

    return true;
  }

  /**
   * Set the current preset
   */
  static setCurrentPreset(presetId: string): void {
    StorageUtils.set(StorageKey.CURRENT_PRESET, presetId);
  }

  /**
   * Check if a preset is custom (not default)
   */
  static isCustomPreset(presetId: string): boolean {
    const customPresets = this.getCustomPresets();
    return customPresets.some((preset) => preset.id === presetId);
  }

  /**
   * Check if an email matches a preset's criteria
   * This function can be used by the email processing logic
   */
  static doesEmailMatchPreset(
    emailSubject: string,
    emailBody: string,
    emailSender: string,
    preset: Preset
  ): boolean {
    if (!preset.keywords.length) return false;

    const subjectLower = emailSubject.toLowerCase();
    const bodyLower = emailBody.toLowerCase();
    const senderLower = emailSender.toLowerCase();

    // Count matches in subject
    const subjectMatches = preset.keywords.filter((keyword) =>
      subjectLower.includes(keyword.toLowerCase())
    ).length;

    // Count matches in sender
    const senderMatches = preset.keywords.filter((keyword) =>
      senderLower.includes(keyword.toLowerCase())
    ).length;

    // Count matches in body
    const bodyMatches = preset.keywords.filter((keyword) =>
      bodyLower.includes(keyword.toLowerCase())
    ).length;

    // Check if matches meet the minimum requirements
    // Subject and sender matches are combined for subject requirement
    const maxSubjectOrSenderMatches = Math.max(subjectMatches, senderMatches);

    return (
      maxSubjectOrSenderMatches >= preset.MINIMUM_MATCH_IN_SUBJECT &&
      bodyMatches >= preset.MINIMUM_MATCHES_IN_BODY
    );
  }

  /**
   * Get emails that should be processed based on current preset
   * This is a helper function for the email cleaning logic
   */
  static getEmailsToProcess(
    emails: Array<{
      subject: string;
      body: string;
      sender: string;
      id: string;
    }>,
    presetId?: string
  ): Array<{ subject: string; body: string; sender: string; id: string }> {
    const preset = presetId
      ? this.getAllPresets().find((p) => p.id === presetId)
      : this.getCurrentPreset();

    if (!preset) return [];

    return emails.filter((email) =>
      this.doesEmailMatchPreset(email.subject, email.body, email.sender, preset)
    );
  }

  /**
   * Get a summary of the preset for display purposes
   */
  static getPresetSummary(preset: Preset): string {
    const keywordCount = preset.keywords.length;
    const customLabel = this.isCustomPreset(preset.id) ? " (Custom)" : "";
    return `${keywordCount} keywords, ${preset.MINIMUM_MATCH_IN_SUBJECT} subject+sender matches, ${preset.MINIMUM_MATCHES_IN_BODY} body matches${customLabel}`;
  }

  /**
   * Check if there's a currently selected preset
   */
  static hasCurrentPreset(): boolean {
    return this.getCurrentPreset() !== null;
  }

  /**
   * Test function to verify case insensitive keyword matching
   * This can be used for debugging and testing purposes
   */
  static testKeywordMatching(
    testEmail: { subject: string; body: string; sender: string },
    testKeywords: string[]
  ): {
    subjectMatches: string[];
    senderMatches: string[];
    bodyMatches: string[];
    totalSubjectMatches: number;
    totalSenderMatches: number;
    totalBodyMatches: number;
  } {
    const subjectLower = testEmail.subject.toLowerCase();
    const bodyLower = testEmail.body.toLowerCase();
    const senderLower = testEmail.sender.toLowerCase();

    const subjectMatches = testKeywords.filter((keyword) =>
      subjectLower.includes(keyword.toLowerCase())
    );

    const senderMatches = testKeywords.filter((keyword) =>
      senderLower.includes(keyword.toLowerCase())
    );

    const bodyMatches = testKeywords.filter((keyword) =>
      bodyLower.includes(keyword.toLowerCase())
    );

    return {
      subjectMatches,
      senderMatches,
      bodyMatches,
      totalSubjectMatches: subjectMatches.length,
      totalSenderMatches: senderMatches.length,
      totalBodyMatches: bodyMatches.length,
    };
  }
}
