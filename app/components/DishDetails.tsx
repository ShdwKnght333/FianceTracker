import React from 'react';
import { ScrollView, Text } from 'react-native';
import DishDescription from './DishDescription';
import DishImage from './DishImage';
import DishRating from './DishRating';

export interface DishDataShape {
  id: number | null;
  name: string;
  restaurant: string;
  rating: number;
  price: number | null;
  image: string | null;
  description: string;
  type: string;
}

interface DishDetailsProps {
  dishData: DishDataShape | null;
  setDishData: React.Dispatch<React.SetStateAction<DishDataShape | null>>;
  loading: boolean;
}

export default function DishDetails({ dishData, setDishData, loading }: DishDetailsProps) {

  if (loading) return null;
  if (!dishData) return null;

  
  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>{dishData.name}</Text>
      {dishData.restaurant ? (
        <Text style={{ color: '#E3F2FD', fontSize: 18, marginBottom: dishData.price != null ? 2 : 4 }}>
          {dishData.restaurant}
        </Text>
      ) : null}
      {dishData.price != null && (
        <Text style={{ color: '#E3F2FD', fontSize: 16, marginBottom: 4 }}>₹{dishData.price.toFixed(2)}</Text>
      )}
      <DishRating rating={dishData.rating} />
      <DishImage dishData={dishData} setDishData={setDishData} />
      <DishDescription dishData={dishData} setDishData={setDishData} />
    </ScrollView>
  );
}
