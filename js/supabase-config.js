// supabase-config.js

/**
 * =========================================================================
 * ROYAL FUNERAL SUPPLIES - SUPABASE CONFIGURATION
 * =========================================================================
 * 
 * To connect your website to your live Supabase Database:
 * 1. Find your Project URL and Anon Key in your Supabase Dashboard:
 *    Go to Settings -> API.
 * 2. Paste the `anon` key inside the quotes below.
 * 
 * Example:
 * const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
 */

const SUPABASE_URL = 'https://vypnmrxybqluurizfxjx.supabase.co';

// ⚠️ PASTE YOUR SUPABASE ANON KEY HERE:
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cG5tcnh5YnFsdXVyaXpmeGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODI2NTAsImV4cCI6MjA5ODg1ODY1MH0.xBXM9gPOgBkGFv03NLwNPiJrgBHler-FdrCnUedcA44"; 


// =========================================================================
// Do not edit below this line
// =========================================================================

window.ROYAL_SUPABASE_URL = SUPABASE_URL;

window.getSupabaseAnonKey = () => {
    return SUPABASE_ANON_KEY.trim();
};

window.initSupabase = () => {
    const anonKey = window.getSupabaseAnonKey();
    if (anonKey && window.supabase) {
        return window.supabase.createClient(window.ROYAL_SUPABASE_URL, anonKey);
    }
    return null;
};
