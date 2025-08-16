import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

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

export default function OtherExpense() {
  const [description, setDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount;

  const filteredSuggestions = description
    ? popularDescriptions.filter(opt => opt.toLowerCase().includes(description.toLowerCase()))
    : popularDescriptions;

  function handleSubmit() {
    Alert.alert("Expense Submitted", `Description: ${description}\nAmount: ₹${amount}`);
    router.back();
  }

  function handleDescriptionChange(text: string) {
    setDescription(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setDescription(suggestion);
    setShowSuggestions(false);
  }

  return (
    <LinearGradient
      colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Other Expense Details</Text>
        <View style={{ width: '100%', marginBottom: 16 }}>
          <TextInput
            style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
            placeholder="Enter description..."
            value={description}
            onChangeText={handleDescriptionChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
              <FlatList
                data={filteredSuggestions}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => handleSuggestionSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Text style={{ color: '#222', fontSize: 16 }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
        <TouchableOpacity
          style={{ backgroundColor: '#FFA726', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
          onPress={handleSubmit}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
