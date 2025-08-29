import { supabase } from './supabaseClient';

export interface ExpenseRow {
  Date: string; // ISO date string
  Type: 'Food' | 'Drinks' | 'Shopping' | 'Groceries' | 'Travel' | 'Shopping' | 'Utilities' | 'Entertainment' | 'Medical' | 'Investments' | 'Personal' | 'Other';
  Amount: number;
  Description: string | null;
}

export interface ExpenseFoodRow extends ExpenseRow {
  Meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  Meal_place: string;
}

// MARK: - Food Expenses
export async function addFoodRating(data: ExpenseFoodRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export interface PopularExpensePlace {
  place: string;
  count: number;
}

export async function getPopularFoodPlaces(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularPlaceQuery = supabase
    .rpc('get_unique_food_place', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularPlaceQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

// MARK: - Drinks Expenses
export interface ExpenseDrinksRow extends ExpenseRow {
  Drink: 'Milk' | 'Juice' | 'Mocktails' | 'Other';
  Drink_place: string;
}

export async function addDrinksExpense(data: ExpenseDrinksRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularDrinkPlaces(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularPlaceQuery = supabase
    .rpc('get_unique_drink_place', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularPlaceQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Groceries Expenses
export interface ExpenseGroceriesRow extends ExpenseRow {
  Grocery: 'Store' | 'Online' | 'QuickCom' | 'Other';
  Grocery_description: string;
}

export async function addGroceriesExpense(data: ExpenseGroceriesRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularGroceryDescriptions(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularDescriptionQuery = supabase
    .rpc('get_unique_grocery_description', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularDescriptionQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Travel Expenses
export interface ExpenseTravelRow extends ExpenseRow {
  Travel: 'Cycle' | 'Metro' | 'Bus' | 'Cab' | 'Plane' | 'Hotels' | 'Travel Cash' | 'Other';
  Journey: string;
  Journey_details: string;
}

export async function addTravelExpense(data: ExpenseTravelRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularJourney(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularJourneyQuery = supabase
    .rpc('get_unique_journey', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularJourneyQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Shopping Expenses
export interface ExpenseShoppingRow extends ExpenseRow {
  Shopping: 'Amazon' | 'Flipkart' | 'D-Mart' | 'Online' | 'Shop' | 'Other';
  Need: 'Necessity' | 'Meh' | 'Impulse';
  Item: string;
}

export async function addShoppingExpense(data: ExpenseShoppingRow) {
  return supabase.from('expenses').insert(data).select().single();
}

//MARK: - Utilities Expenses
export interface ExpenseUtilitiesRow extends ExpenseRow {
  Utility: 'Electricity' | 'Maintenance' | 'Internet' | 'Cleaning' | 'Rent' | 'Laundry' | 'Other';
  Frequency: 'Monthly' | 'Yearly' | 'Other';
  Utility_description: string;
}

export async function addUtilitiesExpense(data: ExpenseUtilitiesRow) {
  return supabase.from('expenses').insert(data).select().single();
}

//MARK: - Entertainment Expenses
export interface ExpenseEntertainmentRow extends ExpenseRow {
  Entertainment: 'Movie' | 'Event' | 'Games' | 'Subscription' | 'Matches' | 'Sports' | 'Other';
  Entertainment_description: string;
}

export async function addEntertainmentExpense(data: ExpenseEntertainmentRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularEntertainmentDescriptions(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularDescriptionQuery = supabase
    .rpc('get_unique_entertainment_description', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularDescriptionQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Health Expenses
export interface ExpenseHealthRow extends ExpenseRow {
  Health: 'Hospital' | 'Consultation' | 'Testing' | 'Medicine' | 'Other';
  Health_item: string;
  Health_description: string;
}

export async function addHealthExpense(data: ExpenseHealthRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularHealthItems(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularItemQuery = supabase
    .rpc('get_unique_health_item', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularItemQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Investments Expenses
export interface ExpenseInvestmentsRow extends ExpenseRow {
  Investments: 'Kotak Shares' | 'Mutual Funds' | 'ICICI Shares' | 'Bonds' | 'Insurance' | 'Options' | 'FD' | 'Other';
  Medium: string;
}

export async function addInvestmentExpense(data: ExpenseInvestmentsRow) {
  return supabase.from('expenses').insert(data).select().single();
}

export async function getPopularInvestmentMediums(prefix?: string, limit = 5): Promise<{ data: PopularExpensePlace[] | null; error: any }> {
  const trimmed = prefix?.trim().length ? prefix.trim() : '';
  
  let popularMediumQuery = supabase
    .rpc('get_unique_medium', { search_term: trimmed })
    .select('*')
    .limit(limit);
  
  const { data, error } = await popularMediumQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data, error: null };
}

//MARK: - Default Expenses
export async function addDefaultExpense(data: ExpenseRow) {
  return supabase.from('expenses').insert(data).select().single();
}

//MARK: - Charts and Aggregations
export interface ExpenseAggregation {
  Type: string; // "Groceries", "Entertainment" etc
  Date: string; // "2023-10-05"
  Amount: number;
}

export async function getExpensesAggregation(startDate: string, endDate: string, types: string[]): Promise<{ data: ExpenseAggregation[] | null; error: any }> {
  let aggregationQuery = supabase
    .from('expenses')
    .select('Type, Date, Amount')
    .gte('Date', startDate)
    .lte('Date', endDate);

  if (types.length > 0) {
    aggregationQuery = aggregationQuery.in('Type', types);
  }

  const { data, error } = await aggregationQuery;

  if (error) {
    return { data: null, error };
  }
  return { data: data as ExpenseAggregation[], error: null };
}