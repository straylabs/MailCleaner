import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { AppScreenProps } from "@/navigation/types";

// Mock data for presets - this would typically come from a backend or local storage
const mockPresets = [
  { id: "1", name: "Delete Promotional Emails", description: "Automatically delete emails from promotional senders" },
  { id: "2", name: "Unsubscribe from Newsletters", description: "Automatically unsubscribe from newsletter emails" },
  { id: "3", name: "Archive Old Emails", description: "Archive emails older than 6 months" },
  { id: "4", name: "Delete Spam", description: "Permanently delete emails marked as spam" },
];

type PresetsScreenProps = AppScreenProps<"Presets">;

const PresetsScreen: React.FC<PresetsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const renderPresetItem = ({ item }: { item: typeof mockPresets[0] }) => (
    <View style={[styles.presetItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.presetName, { color: theme.text }]}>{item.name}</Text>
      <Text style={[styles.presetDescription, { color: theme.textSecondary }]}>{item.description}</Text>
      <View style={styles.presetActions}>
        <Button variant="outline" style={styles.actionButton}>
          Edit
        </Button>
        <Button variant="primary" style={styles.actionButton}>
          Run
        </Button>
      </View>
    </View>
  );

  return (
    <Screen useSafeArea>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Email Presets</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Manage your automated email cleaning presets
          </Text>
        </View>
        
        <FlatList
          data={mockPresets}
          renderItem={renderPresetItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
        
        <Button 
          variant="primary" 
          style={styles.addButton}
          onPress={() => {
            // Navigate to add preset screen (would be implemented later)
            console.log("Add new preset");
          }}
        >
          Add New Preset
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
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
    borderWidth: 1,
    marginBottom: 12,
  },
  presetName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  presetActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  addButton: {
    marginTop: 16,
  },
});

export default PresetsScreen;