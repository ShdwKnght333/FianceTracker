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
