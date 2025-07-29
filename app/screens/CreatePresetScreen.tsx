import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import Header from "@/components/Header";
import { AppScreenProps } from "@/navigation/types";
import { Preset } from "@/screens/PresetsScreen";
import { PresetUtils } from "@/utils/PresetUtils";

type CreatePresetScreenProps = AppScreenProps<"CreatePreset">;

const CreatePresetScreen: React.FC<CreatePresetScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { editPresetId } = route.params || {};
  const isEditing = !!editPresetId;

  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [minSubjectMatches, setMinSubjectMatches] = useState("1");
  const [minBodyMatches, setMinBodyMatches] = useState("2");

  // Load preset data if editing
  React.useEffect(() => {
    if (isEditing && editPresetId) {
      const customPresets = PresetUtils.getCustomPresets();
      const presetToEdit = customPresets.find((p) => p.id === editPresetId);

      if (presetToEdit) {
        setPresetName(presetToEdit.name);
        setPresetDescription(presetToEdit.description);
        setKeywords(presetToEdit.keywords);
        setMinSubjectMatches(presetToEdit.MINIMUM_MATCH_IN_SUBJECT.toString());
        setMinBodyMatches(presetToEdit.MINIMUM_MATCHES_IN_BODY.toString());
      }
    }
  }, [isEditing, editPresetId]);

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      Alert.alert("Error", "Please enter a preset name");
      return;
    }

    if (keywords.length === 0) {
      Alert.alert("Error", "Please add at least one keyword");
      return;
    }

    if (isEditing && editPresetId) {
      // Update existing preset
      const updatedPreset: Preset = {
        id: editPresetId,
        name: presetName.trim(),
        description: presetDescription.trim() || "Custom preset",
        keywords,
        MINIMUM_MATCH_IN_SUBJECT: parseInt(minSubjectMatches) || 1,
        MINIMUM_MATCHES_IN_BODY: parseInt(minBodyMatches) || 2,
      };

      const success = PresetUtils.updateCustomPreset(
        editPresetId,
        updatedPreset
      );

      if (success) {
        Alert.alert("Success", "Preset updated successfully!", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to update preset");
      }
    } else {
      // Create new preset
      const newPreset: Preset = {
        id: `custom_${Date.now()}`,
        name: presetName.trim(),
        description: presetDescription.trim() || "Custom preset",
        keywords,
        MINIMUM_MATCH_IN_SUBJECT: parseInt(minSubjectMatches) || 1,
        MINIMUM_MATCHES_IN_BODY: parseInt(minBodyMatches) || 2,
      };

      // Get existing custom presets
      const existingCustomPresets = PresetUtils.getCustomPresets();

      // Add new preset
      PresetUtils.saveCustomPreset(newPreset);

      Alert.alert("Success", "Preset created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  return (
    <Screen useSafeArea>
      <Header
        title={isEditing ? "Edit Preset" : "Create Preset"}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {/* Preset Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Preset Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                },
              ]}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="e.g., My Custom Filter"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBackground,
                },
              ]}
              value={presetDescription}
              onChangeText={setPresetDescription}
              placeholder="Describe what this preset will filter..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Keywords */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Keywords *
            </Text>
            <View style={styles.keywordInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.keywordInput,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
                value={newKeyword}
                onChangeText={setNewKeyword}
                placeholder="Add a keyword"
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={addKeyword}
              />
              <Button
                variant="primary"
                style={styles.addButton}
                onPress={addKeyword}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </Button>
            </View>

            {/* Keywords List */}
            <View style={styles.keywordsList}>
              {keywords.map((keyword, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.keywordChip,
                    { backgroundColor: theme.primary + "20" },
                  ]}
                  onPress={() => removeKeyword(keyword)}
                >
                  <Text style={[styles.keywordText, { color: theme.primary }]}>
                    {keyword}
                  </Text>
                  <Text style={[styles.removeText, { color: theme.primary }]}>
                    ×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Matching Rules */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Matching Rules
            </Text>

            <View style={styles.ruleContainer}>
              <Text style={[styles.ruleLabel, { color: theme.textSecondary }]}>
                Minimum matches in subject:
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
                value={minSubjectMatches}
                onChangeText={setMinSubjectMatches}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.ruleContainer}>
              <Text style={[styles.ruleLabel, { color: theme.textSecondary }]}>
                Minimum matches in body:
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                  },
                ]}
                value={minBodyMatches}
                onChangeText={setMinBodyMatches}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          {/* Save Button */}
          <Button
            variant="primary"
            style={styles.saveButton}
            onPress={savePreset}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Update Preset" : "Create Preset"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  keywordInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  keywordInput: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  keywordsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  keywordChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  keywordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  removeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  ruleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ruleLabel: {
    fontSize: 14,
    flex: 1,
  },
  numberInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    textAlign: "center",
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CreatePresetScreen;
