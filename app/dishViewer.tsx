import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { getDishById } from '../lib/foodRatingService';
import DishDetails, { DishDataShape } from './components/DishDetails';
import DishSearchBar from './components/DishSearchBar';

export default function DishViewer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dishData, setDishData] = useState<null | DishDataShape>(null);

  const handleView = async (dishTextParam?: string, selectedIdParam?: number | null) => {
    const inputText = (dishTextParam ?? '').trim() || '';
    const idToFetch = selectedIdParam != null ? selectedIdParam : null;
    if (!inputText) {
      Alert.alert('Missing Dish', 'Please enter a dish name');
      return;
    }
    try {
      setLoading(true);
      if (idToFetch != null) {
        const { data, error } = await getDishById(idToFetch);
        if (error || !data) {
          console.warn('getDishById error', error);
          Alert.alert('Error', 'Could not fetch dish details.');
        } else {
          setDishData({
            id: data.id,
            name: data.Item || inputText,
            restaurant: data.Place || 'Unknown Place',
            rating: typeof data.Rating === 'number' ? data.Rating : 0,
            price: typeof data.Price === 'number' ? data.Price : null,
            description: data.description ?? 'No description yet.',
            type: data.Type || 'Other',
            image: data.image
          });
        }
      } else {
        await new Promise(r => setTimeout(r, 500));
        setDishData({
          id: null,
          name: inputText,
          restaurant: 'Sample Restaurant',
          rating: 10.0,
          price: null,
          description: 'A delightful dish description will appear here once connected to your backend datasource.',
          type: 'Breads',
          image: null
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load dish information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <LinearGradient
        colors={['#2196F3', '#21CBF3', '#64B5F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
          {/* Top Input Section */}
          <DishSearchBar loading={loading} onView={handleView} />

          {/* Middle Content */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 12 }}>
            {loading && <ActivityIndicator size='large' color='#fff' />}
            {!loading && dishData && (
              <DishDetails dishData={dishData} setDishData={setDishData} loading={loading} />
            )}
            {!loading && !dishData && (
              <Text style={{ color: '#ffffffaa', textAlign: 'center', paddingHorizontal: 10 }}>Enter a dish name above and tap View to load its details.</Text>
            )}
          </View>

          {/* Bottom Back Button */}
          <View style={{ paddingBottom: 20 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 }}>
              <Text style={{ color: '#fff', textDecorationLine: 'underline', fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
