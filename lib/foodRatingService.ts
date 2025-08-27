import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';

export interface FoodRatingRow {
  Place: string;
  Item: string;
  Type: string;
  Price: number;
  Rating: number; // 0.5 - 10 (half steps)
}

export async function addFoodRating(data: FoodRatingRow) {
  return supabase.from('FoodRating').insert(data).select().single();
}

// Return popular places with usage counts (most frequent first)
export interface PopularPlace {
  place: string;
  count: number;
}

export async function getPopularPlaces(prefix?: string, limit = 5): Promise<{ data: PopularPlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularPlaceQuery = supabase
    .rpc('get_unique_places_count', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularPlaceQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

export interface DishSearchResult {
  id: number;
  name: string;
  place: string;
}

export async function getDishList(terms?: string[]): Promise<{ data: DishSearchResult[] | null; error: any }> {
  const trimmedTerms = terms?.map(t => t.trim()).filter(t => t.length) || [];
  if (trimmedTerms.length === 0) {
    return { data: [], error: null }; // no terms, return empty
  }

  let dishQuery = supabase
    .rpc('search_food_ratings', { p_search_terms: trimmedTerms })
    .select('*');

  const { data, error } = await dishQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

export interface FullDishRow extends FoodRatingRow {
  id: number;
  description: string | null;
  image: string | null;
}

export async function getDishById(id: number): Promise<{ data: FullDishRow | null; error: any }> {
  const { data, error } = await supabase
    .from('FoodRating')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

export async function uploadImageToStorage(fileUri: string, id: number): Promise<{ data: { Key: string } | null; error: any }> {
  // Extract the blob from the file URI
  console.log('Uploading image for id:', id, 'from uri:', fileUri);
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  const arrayBuffer = decode(base64);
  // Create the filename
  const fileName = `FR_${id}.jpg`;
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('ImageStorage')
    .upload(fileName, arrayBuffer, {
      upsert: true, // overwrite if exists
      contentType: 'image/jpeg',
    });

  if (error) {
    console.error('Error uploading image to storage:', error);
    return { data: null, error };
  }

  console.log('Image uploaded to storage:', data);

  return { data: { Key: data.path }, error: null };
}

export async function updateDishImage(id: number, fileName: string): Promise<{ data: FullDishRow | null; error: any }> {
  const { data, error } = await supabase
    .from('FoodRating')
    .update({ image: fileName })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

export function getDishImage(fileName: string): string {
  return `https://zvgdozooibldlxogqfnv.supabase.co/storage/v1/object/public/ImageStorage/${fileName}`;
}


export async function updateDishDescription(id: number, description: string): Promise<{ data: FullDishRow | null; error: any }> {
  const { data, error } = await supabase
    .from('FoodRating')
    .update({ description: description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}