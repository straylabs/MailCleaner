import React from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { AppScreenProps } from "@/navigation/types";
import { StorageUtils, StorageKey } from "@/utils/Storage";

// Mock data for presets - this would typically come from a backend or local storage
const mockPresets = [
  {
    id: "1",
    name: "Delete Promotional Emails",
    description: "Delete all emails from promotional senders.",
  },
  {
    id: "2",
    name: "Delete Newsletter Emails",
    description: "Delete all newsletter subscription emails.",
  },
  {
    id: "3",
    name: "Delete Social Updates",
    description: "Delete emails from social networks and updates.",
  },
  {
    id: "4",
    name: "Delete Spam Emails",
    description: "Delete all emails marked as spam.",
  },
  {
    id: "5",
    name: "Delete Old Emails",
    description: "Delete emails older than 6 months.",
  },
];

type PresetsScreenProps = AppScreenProps<"Presets">;

const PresetsScreen: React.FC<PresetsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(
    null
  );
  const [presets, setPresets] = React.useState<typeof mockPresets>(mockPresets);
  const [presetInput, setPresetInput] = React.useState("");
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    StorageUtils.set(StorageKey.CURRENT_PRESET, presetId);
  };

  const handleAddPreset = () => {
    if (!presetInput.trim()) return;
    const newPreset = {
      id: (presets.length + 1).toString(),
      name: presetInput.trim(),
      description: "Custom preset",
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
        <View style={styles.addPresetSection}>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Create a new preset..."
            placeholderTextColor={theme.textSecondary}
            value={presetInput}
            onChangeText={setPresetInput}
          />
          <Button
            variant="primary"
            style={styles.addButton}
            onPress={handleAddPreset}
          >
            Add Preset
          </Button>
        </View>
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
