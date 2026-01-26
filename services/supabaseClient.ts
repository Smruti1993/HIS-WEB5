import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'https://svfmxmesdgazkivvqeiy.supabase.co';
const STORAGE_KEY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Zm14bWVzZGdhemtpdnZxZWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjAxMTksImV4cCI6MjA4NDk5NjExOX0.tygzE17-hKn1DEj4kLhVtmsei2KXuMGocnBpEiKZeX4';

export const getStoredCredentials = () => ({
  url: localStorage.getItem(STORAGE_KEY_URL) || '',
  key: localStorage.getItem(STORAGE_KEY_KEY) || ''
});

const isValidUrl = (u: string) => {
    try { return !!new URL(u); } catch { return false; }
};

// Helper to check config status
export const checkConfigured = () => {
    const { url, key } = getStoredCredentials();
    return !!(url && key && isValidUrl(url));
};

// Singleton instance
let client: SupabaseClient | null = null;

export const getSupabase = () => {
    if (client) return client;
    
    const { url, key } = getStoredCredentials();
    if (checkConfigured()) {
        client = createClient(url, key);
    } else {
        // Fallback client that allows the app to load but will fail requests
        client = createClient('https://setup-required.supabase.co', 'placeholder');
    }
    return client;
};

// Reset the client (used when credentials change)
export const resetSupabaseClient = () => {
    client = null;
};

export const saveCredentialsToStorage = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_KEY, key);
  resetSupabaseClient();
};

export const clearCredentialsFromStorage = () => {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    resetSupabaseClient();
};