import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChipOption, Chips } from "../components/Chips";

const utilityTypes: ChipOption[] = [
  { label: "Rent", icon: "🏠" },
  { label: "Electricity", icon: "💡" },
  { label: "Cleaning", icon: "🧹" },
  { label: "Internet", icon: "🌐" },
  { label: "Maintenance", icon: "🛠️" },
  { label: "Laundry", icon: "🧺" },
  { label: "Other", icon: "📦" },
];

const frequencyTypes: ChipOption[] = [
  { label: "Monthly", icon: "🗓️" },
  { label: "Yearly", icon: "📅" },
  { label: "Other", icon: "❓" },
];

const popularDescriptions = [
  "Stationery",
  "Gift",
  "Charity",
  "Tips",
  "Snacks",
  "Parking",
  "Miscellaneous",
  "Donation",
  "Subscription",
  "Repair",
];

export default function UtilitiesExpense() {
  const [description, setDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [utilityType, setUtilityType] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount;

  const filteredSuggestions = description
    ? popularDescriptions.filter(opt => opt.toLowerCase().includes(description.toLowerCase()))
    : popularDescriptions;

  function handleDescriptionChange(text: string) {
    setDescription(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setDescription(suggestion);
    setShowSuggestions(false);
  }

  function handleSubmit() {
    Alert.alert(
      "Expense Submitted",
      `Utility: ${utilityType}\nFrequency: ${frequency}\nAmount: ₹${amount}${description ? `\nDescription: ${description}` : ""}`
    );
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Utilities Expense Details</Text>
            <Chips
              options={utilityTypes}
              selected={utilityType}
              onSelect={setUtilityType}
            />
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8, marginTop: 8 }}>Select Frequency</Text>
            <Chips
              options={frequencyTypes}
              selected={frequency}
              onSelect={setFrequency}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter description (optional)..."
                value={description}
                onChangeText={handleDescriptionChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {filteredSuggestions.slice(0,5).map(item => (
                    <TouchableOpacity key={item} onPress={() => handleSuggestionSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222', fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={{ backgroundColor: utilityType ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!utilityType}
              onPress={handleSubmit}
            >
              <Text style={{ color: utilityType ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
