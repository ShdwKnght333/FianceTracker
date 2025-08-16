import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChipOption, Chips } from "../components/Chips";

const mealTypes: ChipOption[] = [
  { label: "Breakfast", icon: "🌅" },
  { label: "Lunch", icon: "🌞" },
  { label: "Snack", icon: "🍪" },
  { label: "Dinner", icon: "🌙" },
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

export default function FoodExpense() {
  const [place, setPlace] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mealType, setMealType] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount;

  const filteredSuggestions = place
    ? popularDescriptions.filter(opt => opt.toLowerCase().includes(place.toLowerCase()))
    : popularDescriptions;

  function handlePlaceChange(text: string) {
    setPlace(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setPlace(suggestion);
    setShowSuggestions(false);
  }

  function handleSubmit() {
    Alert.alert(
      "Expense Submitted",
      `Meal: ${mealType}\nPlace: ${place}\nAmount: ₹${amount}`
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
        <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Food Expense Details</Text>
        <Chips
          options={mealTypes}
          selected={mealType}
          onSelect={setMealType}
        />
        <View style={{ width: '100%', marginBottom: 16 }}>
          <TextInput
            style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
            placeholder="Enter place..."
            value={place}
            onChangeText={handlePlaceChange}
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
          style={{ backgroundColor: place && mealType ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
          disabled={!place || !mealType}
          onPress={handleSubmit}
        >
          <Text style={{ color: place && mealType ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
