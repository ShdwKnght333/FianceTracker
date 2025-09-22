import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addShoppingExpense } from "../../lib/expenseRatingService";
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

const shoppingLabelMap: Record<string, 'Amazon' | 'Flipkart' | 'D-Mart' | 'Online' | 'Shop' | 'Other'> = {
  'Amazon': 'Amazon',
  'Flipkart': 'Flipkart',
  'D-mart': 'D-Mart',
  'Online': 'Online',
  'Physical Shop': 'Shop',
  'Other': 'Other',
};

const needLabelMap: Record<string, 'Necessity' | 'Meh' | 'Impulse'> = {
  'Necessary': 'Necessity',
  'Meh': 'Meh',
  'Impulse': 'Impulse',
};

export default function ShoppingExpense() {
  const [item, setItem] = useState("");
  const [shoppingType, setShoppingType] = useState("");
  const [needType, setNeedType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const amount = params.amount as string | undefined;
  const date = params.date as string | undefined;

  function handleSubmit() {
    setSubmitError(null);
    if (!item || !shoppingType || !needType || !amount || !date) {
      Alert.alert('Missing Data', 'All fields including date are required');
      return;
    }
    setSubmitting(true);
    const payload = {
      Date: date,
      Type: 'Shopping' as const,
      Amount: Number(amount),
      Description: null,
      Shopping: shoppingLabelMap[shoppingType],
      Need: needLabelMap[needType],
      Item: item,
    };
    addShoppingExpense(payload).then(({ error }) => {
      setSubmitting(false);
      if (error) {
        setSubmitError(error.message || 'Failed to save');
        Alert.alert('Error', submitError || 'Failed to save');
        return;
      }
      Alert.alert('Saved', 'Shopping expense saved');
      router.back();
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'} keyboardVerticalOffset={60}>
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
                onChangeText={setItem}
              />
            </View>
            {submitError && <Text style={{ color: 'red', marginBottom: 8 }}>{submitError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: item && shoppingType && needType && !submitting ? '#FFA726' : '#FFE0B2', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center' }}
              disabled={!item || !shoppingType || !needType || submitting}
              onPress={handleSubmit}
            >
              <Text style={{ color: item && shoppingType && needType && !submitting ? '#fff' : '#aaa', fontSize: 16, fontWeight: 'bold' }}>{submitting ? 'Saving...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
