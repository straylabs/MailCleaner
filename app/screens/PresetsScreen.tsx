import React from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { AppScreenProps } from "@/navigation/types";
import { StorageUtils, StorageKey } from "@/utils/Storage";

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
  const [presets, setPresets] = React.useState<Preset[]>(mockPresets);
  const [presetInput, setPresetInput] = React.useState("");
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    StorageUtils.set(StorageKey.CURRENT_PRESET, presetId);
  };

  const handleAddPreset = () => {
    if (!presetInput.trim()) return;
    const newPreset: Preset = {
      id: presetInput.trim().toLowerCase().replace(/\s+/g, "_"),
      name: presetInput.trim(),
      description: "Custom preset",
      keywords: [],
      MINIMUM_MATCH_IN_SUBJECT: 1,
      MINIMUM_MATCHES_IN_BODY: 1,
    };
    setPresets([...presets, newPreset]);
    setPresetInput("");
  };

  const renderPresetItem = ({ item }: { item: (typeof mockPresets)[0] }) => {
    const isSelected = item.id === selectedPresetId;
    return (
      <Button
        variant={isSelected ? "primary" : "outline"}
        style={[
          styles.presetItem,
          isSelected && { borderColor: theme.primary },
        ]}
        onPress={() => handleSelectPreset(item.id)}
      >
        <View>
          <Text style={[styles.presetName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.presetDescription, { color: theme.textSecondary }]}
          >
            {item.description}
          </Text>
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
  presetName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    marginBottom: 0,
  },
  actionButton: {
    flex: 1,
  },
  addButton: {
    marginTop: 16,
  },
});

export default PresetsScreen;
