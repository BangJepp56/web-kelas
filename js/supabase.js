// Supabase configuration and client setup
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database helper functions
export const db = {
    // Gallery Images
    async uploadImage(file, caption) {
        if (!supabase) throw new Error('Supabase not configured');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gallery-images')
            .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('gallery-images')
            .getPublicUrl(fileName);
        
        // Save to database
        const { data, error } = await supabase
            .from('gallery_images')
            .insert([{
                image_url: publicUrl,
                caption: caption,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    async getGalleryImages() {
        if (!supabase) return [];
        
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // Comments
    async addComment(name, email, message) {
        if (!supabase) throw new Error('Supabase not configured');
        
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                name: name,
                email: email || null,
                message: message,
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    async getComments(limit = 10) {
        if (!supabase) return [];
        
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data;
    }
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Initialize database tables (for development)
export const initializeDatabase = async () => {
    if (!supabase) {
        console.warn('Supabase not configured. Database features will not work.');
        return false;
    }
    
    try {
        // Test connection
        const { data, error } = await supabase.from('comments').select('count').limit(1);
        if (error && error.code === 'PGRST116') {
            console.warn('Database tables not found. Please set up the database schema.');
            return false;
        }
        
        console.log('Database connection successful');
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
};