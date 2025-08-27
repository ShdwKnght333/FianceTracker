import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Button, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addFoodRating, getPopularPlaces } from '../lib/foodRatingService';
import { Chips, ChipStyles } from "./components/Chips";
import { foodTypes } from './constants/foodTypes';

// Dynamic place suggestions loaded from Supabase (FoodRating table)
// Fallback to empty list if fetch fails. Fetched again when user types (debounced)
// to provide type-ahead suggestions based on contains match.
// Uses getPopularPlaces(prefix) which returns most frequent matches.
// This replaces the previous hard-coded popularDescriptions array.

export default function FoodRating() {
  const [rating, setRating] = useState<number | null>(null);
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(13)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const starsCount = 10;
  const [containerX, setContainerX] = useState(0);
  const starsRef = useRef<any>(null);
  const [place, setPlace] = useState("");
  const [item, setItem] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [popularPlaces, setPopularPlaces] = useState<string[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipStyles: ChipStyles = {
    chipsRow: styles.chipsRow,
    chip: styles.chip,
    chipSelected: styles.chipSelected,
    chipIcon: styles.chipIcon,
    chipText: styles.chipText,
    chipTextSelected: styles.chipTextSelected,
  };

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  // Reset all form state when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setRating(null);
      setPlace("");
      setItem("");
      setPrice("");
      setType("");
      setContainerWidth(0);
      setContainerX(0);
      scaleAnim.setValue(13); // reset animation for mount
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      return () => {};
    }, [scaleAnim])
  );

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    if (!type || !place || !item || !price || !rating) {
      setSubmitError('All fields required including rating.');
      return;
    }
    setSubmitting(true);
    const { error } = await addFoodRating({
      Place: place,
      Item: item,
      Type: type,
      Price: parseFloat(price),
      Rating: rating,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSubmitSuccess(true);
    alert('Saved to Supabase');
    router.back();
  };

  // Map absolute pageX to rating using measured containerX/width (fixes stuck-at-0.5 issue)
  const setRatingFromPageX = (pageX: number) => {
    console.log("setRatingFromPageX", pageX, containerX, containerWidth);
    if (containerWidth <= 0) return;
    const localX = Math.max(0, Math.min(pageX - ((containerX - containerWidth) / 2), containerWidth));
    const fraction = localX / containerWidth; // 0..1
    const raw = fraction * starsCount; // 0..10
    const halfStepped = Math.min(starsCount, Math.max(0.5, Math.round(raw * 2) / 2));
    setRating(halfStepped);
  };

  const renderStar = (index: number) => {
    const STAR_SIZE = 32;
    const r = rating ?? 0;
    const fill = Math.max(0, Math.min(1, r - index)); // 0..1 (0, 0.5, 1)
    const activeIndex = r > 0 ? Math.ceil(r) - 1 : -1;
    const isActive = index === activeIndex;
    return (
      <View
        key={index}
        style={{
          width: STAR_SIZE,
          height: STAR_SIZE,
          marginHorizontal: 1,
          transform: [{ scale: isActive ? 1.3 : 1 }],
          zIndex: isActive ? 1 : 0,
          opacity: isActive ? 1 : 0.8,
        }}
      >
        <View style={{ width: STAR_SIZE, height: STAR_SIZE, position: 'relative' }}>
          {/* Base unselected star */}
          <Text style={[styles.starUnselected, { width: STAR_SIZE, lineHeight: STAR_SIZE, textAlign: 'center' }]}>★</Text>
          {/* Filled overlay with mask width based on fill */}
          {fill > 0 && (
            <View style={{ position: 'absolute', left: 0, top: 0, width: STAR_SIZE * fill, height: STAR_SIZE, overflow: 'hidden' }}>
              <Text style={[styles.starSelected, { width: STAR_SIZE, lineHeight: STAR_SIZE, textAlign: 'center' }]}>★</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Only allow numbers and a single decimal separator, limit to 2 decimals
  const sanitizePrice = (text: string) => {
    let t = text.replace(/,/g, "."); // normalize comma to dot
    t = t.replace(/[^0-9.]/g, ""); // keep digits and dot only
    if (t.indexOf(".") !== -1) {
      const [intPart, ...rest] = t.split(".");
      const decimals = rest.join(""); // remove extra dots
      t = intPart + "." + decimals;
      const [i, d] = t.split(".");
      t = d !== undefined ? `${i}.${d.slice(0, 2)}` : i; // max 2 decimals
    }
    if (t.startsWith(".")) t = "0" + t; // e.g. .5 -> 0.5
    return t;
  };

  const filteredSuggestions = popularPlaces;

  // Fetch popular places (debounced on input change)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingPlaces(true);
      const { data } = await getPopularPlaces(place || undefined, 5);
      if (data) setPopularPlaces(data.map(d => d.place));
      setLoadingPlaces(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [place]);

  function handlePlaceChange(text: string) {
    setPlace(text);
    setShowSuggestions(true);
  }

  function handleSuggestionSelect(suggestion: string) {
    setPlace(suggestion);
    setShowSuggestions(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={["#FFA726", "#FFEB3B", "#FFD600"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.formContainer, { transform: [{ scale: scaleAnim }] }]}> 
            <Text style={styles.title}>Rate the Food</Text>
            {/* Type Selector Chips with Icon */}
            <Chips
              options={foodTypes}
              selected={type}
              onSelect={setType}
              styles={chipStyles}
            />
            {/* Inputs */}
            <View style={{ width: '100%' }}>
              <TextInput
                style={styles.input}
                placeholder="Place"
                placeholderTextColor="#666"
                value={place}
                onChangeText={handlePlaceChange}
                returnKeyType="next"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10, maxHeight: 160 }}>
                  {loadingPlaces && (
                    <Text style={{ padding: 8, color: '#666' }}>Loading...</Text>
                  )}
                  {/* Replaced FlatList with direct mapping (<=5 items) */}
                  {filteredSuggestions.slice(0,5).map(item => (
                    <TouchableOpacity key={item} onPress={() => handleSuggestionSelect(item)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ color: '#222', fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Item"
              placeholderTextColor="#666"
              value={item}
              onChangeText={setItem}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#666"
              value={price}
              onChangeText={(t) => setPrice(sanitizePrice(t))}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            
          {/* Stars */}
            <View
              ref={starsRef}
              style={styles.starsContainer}
              onLayout={(e) => {
                setContainerWidth(e.nativeEvent.layout.width);
                setContainerX(Dimensions.get("window").width);
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => setRatingFromPageX(e.nativeEvent.pageX)}
              onResponderMove={(e) => setRatingFromPageX(e.nativeEvent.pageX)}
            >
              {[...Array(10)].map((_, i) => renderStar(i))}
            </View>
            {rating && <Text style={styles.ratingText}>Your Rating: {rating} Stars</Text>}
            {submitError && <Text style={{ color: 'red', marginTop: 4 }}>{submitError}</Text>}
            {submitSuccess && <Text style={{ color: 'green', marginTop: 4 }}>Saved!</Text>}
            {rating && place && item && price && type && (
              <View style={{ marginTop: 16, width: '100%' }}>
                <Button title={submitting ? 'Saving...' : 'Submit'} disabled={submitting} onPress={handleSubmit} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    // center handled by scrollContent so keyboard can push content
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: 280,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    color: "#222",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  starSelected: {
    fontSize: 32,
    color: "#FFA726",
    marginHorizontal: 1,
  },
  starUnselected: {
    fontSize: 32,
    color: "#bbb",
    marginHorizontal: 1,
  },
  ratingText: {
    fontSize: 18,
    marginTop: 16,
  },
  chipIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8E1', // soft light yellow
    margin: 1,
    borderWidth: 1,
    borderColor: '#FFE0B2', // subtle border
  },
  chipSelected: {
    backgroundColor: '#FFA726', // solid orange
    borderColor: '#FFA726',
  },
  chipText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
