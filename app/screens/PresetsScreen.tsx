import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { AppScreenProps } from "@/navigation/types";
import { StorageUtils, StorageKey } from "@/utils/Storage";
import { useFocusEffect } from "@react-navigation/native";
import { PresetUtils } from "@/utils/PresetUtils";

// Preset data structure
export type Preset = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  MINIMUM_MATCH_IN_SUBJECT: number;
  MINIMUM_MATCHES_IN_BODY: number;
};

export const mockPresets: Preset[] = [
  {
    id: "promotional",
    name: "🛍️ Promotional",
    description:
      "Filter and delete promotional offers, deals, and marketing emails.",
    keywords: [
      "sale",
      "discount",
      "deal",
      "promo",
      "limited time",
      "special offer",
      "bestseller",
      "coupon",
      "clearance",
      "exclusive",
      "flash sale",
      "save big",
      "bundle",
      "subscribe",
      "register now",
      "buy now",
      "bonus",
      "lowest price",
      "free shipping",
      "gift card",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "social_media",
    name: "📘 Social Media",
    description:
      "Filter and delete social media notifications, updates, and messages.",
    keywords: [
      "Facebook",
      "Twitter",
      "Instagram",
      "LinkedIn",
      "Snapchat",
      "TikTok",
      "Swiggy",
      "Zomato",
      "Reddit",
      "Pinterest",
      "YouTube",
      "WhatsApp",
      "Telegram",
      "Discord",
      "Jio",
      "Spotify",
      "Uber",
      "Snapdeal",
      "HDFC",
      "ICICI",
      "Axis Bank",
      "Paytm",
      "Amazon",
      "Flipkart",
      "Myntra",
      "BookMyShow",
      "Ola",
      "Blinkit",
      "Zepto",
      "Instamart",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 1,
  },
  {
    id: "likely_spam",
    name: "🚫 Likely Spam",
    description: "Auto-delete spammy and suspicious emails.",
    keywords: [
      "win",
      "prize",
      "lottery",
      "claim now",
      "urgent",
      "risk free",
      "guaranteed",
      "click here",
      "unsubscribe",
      "selected",
      "money",
      "miracle",
      "easy income",
      "no cost",
      "get rich",
      "act now",
      "confidential",
      "final notice",
      "urgent response",
      "investment scheme",
      "100% safe",
      "work from home",
      "you've been selected",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 3,
  },
  {
    id: "temporary_otp",
    name: "🔐 OTP & Security",
    description:
      "Delete temporary login OTP and authentication-related emails.",
    keywords: [
      "otp",
      "verification code",
      "one time password",
      "login attempt",
      "security code",
      "PIN",
      "auth code",
      "access code",
      "password reset",
      "device login",
      "new device",
      "2FA",
      "multi-factor",
      "login alert",
      "temporary code",
      "expires in",
      "valid for",
      "do not share",
      "session code",
      "identity verification",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "job_alerts",
    name: "💼 Job Alerts",
    description:
      "Clear job listings, recruitment emails and career site updates.",
    keywords: [
      "job",
      "career",
      "apply now",
      "interview",
      "resume",
      "CV",
      "hiring",
      "vacancy",
      "recruitment",
      "opportunity",
      "job match",
      "placement",
      "walk-in",
      "HR",
      "Shine",
      "Naukri",
      "LinkedIn",
      "Talent Acquisition",
      "Confidential Careers",
      "opening",
      "recruiter",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "ai_news",
    name: "🤖 AI & Tech News",
    description: "Auto-remove AI and tech newsletters or digest emails.",
    keywords: [
      "ChatGPT",
      "AI update",
      "machine learning",
      "data science",
      "newsletter",
      "Generative AI",
      "AI trends",
      "neural network",
      "deep learning",
      "AI project",
      "AI course",
      "automation",
      "robotics",
      "Serverless",
      "WebRTC",
      "TWIML",
      "AI jobs",
      "ML",
      "tech news",
      "AI research",
      "NLP",
      "vision",
      "Voice AI",
      "Deep Dive",
      "Tech Talent",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "finance_reports",
    name: "📊 Finance & Reports",
    description:
      "Remove emails about financial statements, reports, and stock alerts.",
    keywords: [
      "NSDL",
      "dividend",
      "annual report",
      "quarterly earnings",
      "portfolio update",
      "financial report",
      "investment",
      "NSE",
      "BSE",
      "market summary",
      "IPO",
      "tax",
      "audit",
      "balance sheet",
      "mutual fund",
      "shareholder",
      "profit",
      "loss",
      "expense",
      "income",
      "cash flow",
      "trading alert",
      "IndusInd Bank",
      "CBSSBI ALERT",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "personal_connects",
    name: "👥 Personal Connects",
    description: "Remove networking or cold-contact emails.",
    keywords: [
      "I want to connect",
      "friend request",
      "just messaged you",
      "invitation",
      "connect with me",
      "LinkedIn",
      "network",
      "contact me",
      "reach out",
      "hello",
      "catch up",
      "personal note",
      "private message",
      "DM",
      "chat",
      "inbox",
      "message",
      "reply back",
      "follow up",
      "conversation",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
  {
    id: "miscellaneous",
    name: "🧺 Miscellaneous",
    description: "Filter random updates, newsletters, and event notifications.",
    keywords: [
      "reminder",
      "update",
      "digest",
      "alert",
      "schedule",
      "calendar",
      "event",
      "info",
      "summary",
      "notification",
      "invite",
      "misc",
      "general",
      "random",
      "FYI",
      "announcement",
      "reference",
      "various",
      "cloudxlab",
      "Shanti Gold",
      "WELTEC",
      "lotus IPO",
      "Lote ne wapas",
    ],
    MINIMUM_MATCH_IN_SUBJECT: 1,
    MINIMUM_MATCHES_IN_BODY: 2,
  },
];

type PresetsScreenProps = AppScreenProps<"Presets">;

const PresetsScreen: React.FC<PresetsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(
    null
  );
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [presetInput, setPresetInput] = React.useState("");

  // Load presets (both default and custom)
  const loadPresets = React.useCallback(() => {
    const allPresets = PresetUtils.getAllPresets();
    setPresets(allPresets);

    // Load selected preset
    const currentPresetId = StorageUtils.get<string>(StorageKey.CURRENT_PRESET);
    if (currentPresetId) {
      setSelectedPresetId(currentPresetId);
    }
  }, []);

  // Reload presets when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPresets();
    }, [loadPresets])
  );

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    PresetUtils.setCurrentPreset(presetId);
  };

  const handleCreatePreset = () => {
    navigation.navigate("CreatePreset");
  };

  const handleEditPreset = (presetId: string) => {
    navigation.navigate("CreatePreset", { editPresetId: presetId });
  };

  const handleDeletePreset = (presetId: string, presetName: string) => {
    Alert.alert(
      "Delete Preset",
      `Are you sure you want to delete "${presetName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const success = PresetUtils.deleteCustomPreset(presetId);
            if (success) {
              loadPresets();
              // Clear selection if deleted preset was selected
              if (selectedPresetId === presetId) {
                setSelectedPresetId(null);
              }
            }
          },
        },
      ]
    );
  };

  const handleLongPressPreset = (preset: Preset) => {
    if (!PresetUtils.isCustomPreset(preset.id)) return;

    Alert.alert(preset.name, "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => handleEditPreset(preset.id),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeletePreset(preset.id, preset.name),
      },
    ]);
  };

  const handleAddPreset = () => {
    if (!presetInput.trim()) return;
    const newPreset: Preset = {
      id: `quick_${Date.now()}`,
      name: presetInput.trim(),
      description: "Quick custom preset",
      keywords: [],
      MINIMUM_MATCH_IN_SUBJECT: 1,
      MINIMUM_MATCHES_IN_BODY: 1,
    };

    PresetUtils.saveCustomPreset(newPreset);
    loadPresets();
    setPresetInput("");
  };

  const renderPresetItem = ({ item }: { item: (typeof mockPresets)[0] }) => {
    const isSelected = item.id === selectedPresetId;
    const isCustom = PresetUtils.isCustomPreset(item.id);

    return (
      <Button
        variant={isSelected ? "primary" : "outline"}
        style={[
          styles.presetItem,
          isSelected && { borderColor: theme.primary },
        ]}
        onPress={() => handleSelectPreset(item.id)}
        onLongPress={() => handleLongPressPreset(item)}
      >
        <View style={styles.presetContent}>
          <View style={styles.presetHeader}>
            <Text style={[styles.presetName, { color: theme.text }]}>
              {item.name}
            </Text>
            {isCustom && (
              <View
                style={[styles.customBadge, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.presetDescription, { color: theme.textSecondary }]}
          >
            {item.description}
          </Text>
          {item.keywords.length > 0 && (
            <Text style={[styles.keywordCount, { color: theme.textSecondary }]}>
              {item.keywords.length} keywords
            </Text>
          )}
          {isCustom && (
            <Text
              style={[styles.longPressHint, { color: theme.textSecondary }]}
            >
              Long press to edit or delete
            </Text>
          )}
        </View>
      </Button>
    );
  };

  return (
    <Screen useSafeArea>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Email Presets
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select a preset to use for cleaning your emails.
          </Text>
          <Button
            variant="primary"
            style={styles.createButton}
            onPress={handleCreatePreset}
          >
            <Text style={styles.createButtonText}>+ Create Custom Preset</Text>
          </Button>
        </View>
        <FlatList
          data={presets}
          renderItem={renderPresetItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  addPresetSection: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  presetItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  presetContent: {
    width: "100%",
  },
  presetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  presetName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  customBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  presetDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  keywordCount: {
    fontSize: 12,
    fontStyle: "italic",
  },
  longPressHint: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
    opacity: 0.7,
  },
  actionButton: {
    flex: 1,
  },
  addButton: {
    marginTop: 16,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default PresetsScreen;
