import { FlashList, ListRenderItem } from '@shopify/flash-list';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DishSearchResult, getDishList } from '../../lib/foodRatingService';

interface DishSearchBarProps {
  loading: boolean;
  onView: (dishText: string, selectedDishId: number | null) => void;
}

export default function DishSearchBar({ loading, onView }: DishSearchBarProps) {
  const [dish, setDish] = useState('');
  const [suggestions, setSuggestions] = useState<DishSearchResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = dish.trim();
    if (!term) {
      setSuggestions([]);
      setSelectedDishId(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      const parts = term.split(/\s+/).filter(p => p.length);
      const { data, error } = await getDishList(parts);
      if (!error && data) {
        setSuggestions(data.slice(0, 8));
      } else {
        setSuggestions([]);
      }
      setSuggestionsLoading(false);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dish]);

  const handleSelectSuggestion = useCallback((s: DishSearchResult) => {
    setDish(`${s.name} - ${s.place}`);
    setSelectedDishId(s.id);
    setSuggestions([]);
  }, []);

  const handleViewPress = useCallback(() => {
    const trimmed = dish.trim();
    if (!trimmed || loading) return;
    onView(trimmed, selectedDishId);
    // reset local state after delegating
    setDish('');
    setSuggestions([]);
    setSelectedDishId(null);
  }, [dish, selectedDishId, loading, onView]);

  const renderSuggestion: ListRenderItem<DishSearchResult> = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      style={{ paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eeeeee' }}
    >
      <Text style={{ fontWeight: '600', color: '#0D47A1' }}>{item.name}</Text>
      <Text style={{ fontSize: 12, color: '#555' }}>{item.place}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TextInput
        style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '100%' }}
        placeholder="Enter dish name..."
        value={dish}
        onChangeText={t => { setDish(t); setSelectedDishId(null); }}
        autoCapitalize='words'
        editable={!loading}
      />
      <TouchableOpacity
        style={{ backgroundColor: dish && !loading ? '#1976D2' : '#90CAF9', borderRadius: 8, padding: 14, width: '100%', alignItems: 'center', marginTop: 12 }}
        disabled={!dish || loading}
        onPress={handleViewPress}
      >
        <Text style={{ color: dish && !loading ? '#fff' : '#eee', fontSize: 16, fontWeight: 'bold' }}>{loading ? 'Loading...' : 'View'}</Text>
      </TouchableOpacity>
      {suggestionsLoading && dish && (
        <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>Searching...</Text>
      )}
      {!!suggestions.length && !loading && (
        (() => {
          const suggestionsHeight = Math.min(220, Math.max(1, suggestions.length) * 54);
          return (
            <View style={{ marginTop: 8, width: '100%' }}>
              <View style={{ backgroundColor: '#ffffffdd', borderRadius: 8, overflow: 'hidden', width: '100%', height: suggestionsHeight }}>
                <FlashList
                  data={suggestions}
                  estimatedItemSize={50}
                  renderItem={renderSuggestion}
                  keyExtractor={(i: DishSearchResult) => String(i.id)}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  ListEmptyComponent={!suggestionsLoading ? (
                    <View style={{ padding: 12 }}><Text style={{ fontSize: 12, color: '#555' }}>No matches</Text></View>
                  ) : null}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          );
        })()
      )}
    </View>
  );
}
