import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChipOption, Chips } from "../components/Chips";

const travelTypes: ChipOption[] = [
  { label: "Cycle", icon: "🚲" },
  { label: "Metro", icon: "🚇" },
  { label: "Bus", icon: "🚌" },
  { label: "Cab", icon: "🚕" },
  { label: "Plane", icon: "✈️" },
  { label: "Hotels", icon: "🏨" },
  { label: "Travel Cash", icon: "💵" },
  { label: "Other", icon: "🌍" },
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

export default function TravelExpense() {
  const [itenary, setItenary] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [travelType, setTravelType] = useState("");
  const [details, setDetails] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount;

  const filteredSuggestions = itenary
    ? popularDescriptions.filter(opt => opt.toLowerCase().includes(itenary.toLowerCase()))
    : popularDescriptions;

  function handleItenaryChange(text: string) {
    setItenary(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setItenary(suggestion);
    setShowSuggestions(false);
  }

  function handleSubmit() {
    Alert.alert(
      "Expense Submitted",
      `Travel Type: ${travelType}\nItenary: ${itenary}\nAmount: ₹${amount}${details ? `\nDetails: ${details}` : ""}`
    );
    router.back();
  }

  return (
    <LinearGradient
      colors={["#43cea2", "#185a9d", "#f7971e", "#e94057"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Travel Expense Details</Text>
        <Chips
          options={travelTypes}
          selected={travelType}
          onSelect={setTravelType}
        />
        <View style={{ width: '100%', marginBottom: 16 }}>
          <TextInput
            style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
            placeholder="Enter itenary..."
            value={itenary}
            onChangeText={handleItenaryChange}
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
        <TextInput
          style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%', marginBottom: 16 }}
          placeholder="Details (optional)"
          value={details}
          onChangeText={setDetails}
        />
        <TouchableOpacity
          style={{ backgroundColor: travelType && itenary ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
          disabled={!travelType || !itenary}
          onPress={handleSubmit}
        >
          <Text style={{ color: travelType && itenary ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
