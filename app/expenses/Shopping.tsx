import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChipOption, Chips } from "../components/Chips";

const shoppingTypes: ChipOption[] = [
  { label: "Amazon", icon: "🛒" },
  { label: "Flipkart", icon: "📦" },
  { label: "D-mart", icon: "🏬" },
  { label: "Online", icon: "🌐" },
  { label: "Physical Shop", icon: "🏪" },
  { label: "Other", icon: "❓" },
];

const needTypes: ChipOption[] = [
  { label: "Necessary", icon: "✅" },
  { label: "Meh", icon: "😐" },
  { label: "Impulse", icon: "⚡" },
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

export default function ShoppingExpense() {
  const [item, setItem] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [shoppingType, setShoppingType] = useState("");
  const [needType, setNeedType] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount;

  const filteredSuggestions = item
    ? popularDescriptions.filter(opt => opt.toLowerCase().includes(item.toLowerCase()))
    : popularDescriptions;

  function handleItemChange(text: string) {
    setItem(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setItem(suggestion);
    setShowSuggestions(false);
  }

  function handleSubmit() {
    Alert.alert(
      "Expense Submitted",
      `Shopping Type: ${shoppingType}\nNeed: ${needType}\nItem: ${item}\nAmount: ₹${amount}`
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
            <Text style={{ color: '#fff', fontSize: 22, marginBottom: 24 }}>Shopping Expense Details</Text>
            
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 4, alignSelf: 'flex-start' }}>Select Shopping Type</Text>
            <Chips
              options={shoppingTypes}
              selected={shoppingType}
              onSelect={setShoppingType}
            />
            
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 4, alignSelf: 'flex-start' }}>Select Need of Purchase</Text>
            <Chips
              options={needTypes}
              selected={needType}
              onSelect={setNeedType}
            />
            <View style={{ width: '100%', marginBottom: 16 }}>
              <TextInput
                style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
                placeholder="Enter purchased item..."
                value={item}
                onChangeText={handleItemChange}
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
              style={{ backgroundColor: item && shoppingType ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!item || !shoppingType}
              onPress={handleSubmit}
            >
              <Text style={{ color: item && shoppingType ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
