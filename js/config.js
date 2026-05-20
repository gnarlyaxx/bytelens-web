// ============================================================
// ByteLens — Config & Global State
// ============================================================

// Create global namespace
window.ByteLens = window.ByteLens || {};

// --- Supabase Configuration ---
const supabaseUrl = 'https://nkrqcjmuhutoqdykgtml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcnFjam11aHV0b3FkeWtndG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzM5MjAsImV4cCI6MjA5Mjg0OTkyMH0.RHkrjUoAcorm7tZQbY0F68jlX-6bGa2nENqEGtNGQDQ';

let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized successfully.');
    } else {
        console.warn('Supabase JS library not loaded. Running in offline/demo mode.');
    }
} catch (err) {
    console.error('Failed to initialize Supabase client:', err);
}

// --- Shared Auth State ---
window.ByteLens.isLoggedIn = false;
window.ByteLens.currentUser = null;
window.ByteLens.supabaseClient = supabaseClient;

// --- Fallback Demo Data ---
window.ByteLens.demoPhotos = [
    {
        id: 1,
        title: 'Cyberpunk City Lights',
        author: '@neonshooter',
        price: 250000,
        filename: 'cyberpunk_city_1775482385155.png',
    },
    {
        id: 2,
        title: 'Mountain Sunrise',
        author: '@wildlens',
        price: 180000,
        filename: 'mountain_landscape_1775482399355.png',
    },
    {
        id: 3,
        title: 'Macro Flower Detail',
        author: '@macroworld',
        price: 120000,
        filename: 'macro_flower_1775482422461.png',
    },
    {
        id: 4,
        title: 'Street Life in Tokyo',
        author: '@streetframe',
        price: 300000,
        filename: 'street_photography_1775482444389.png',
    },
];

// --- Demo Profile Data for Sellers ---
window.ByteLens.demoProfiles = {
    '@neonshooter': {
        userId: '@neonshooter',
        name: 'Neon Shooter',
        email: 'neon@bytelens.com',
        bio: 'Urban photographer specializing in cyberpunk aesthetics and neon-lit cityscapes. Based in Tokyo. 📸✨',
        socialLinks: {
            instagram: 'https://instagram.com/neonshooter',
            twitter: 'https://x.com/neonshooter',
            website: 'https://neonshooter.com',
            github: '',
        },
        createdAt: '2025-08-12',
    },
    '@wildlens': {
        userId: '@wildlens',
        name: 'Wild Lens',
        email: 'wild@bytelens.com',
        bio: 'Landscape & nature photographer. Chasing golden hours across mountains and valleys. 🏔️🌅',
        socialLinks: {
            instagram: 'https://instagram.com/wildlens',
            twitter: '',
            website: 'https://wildlens.photography',
            github: '',
        },
        createdAt: '2025-06-20',
    },
    '@macroworld': {
        userId: '@macroworld',
        name: 'Macro World',
        email: 'macro@bytelens.com',
        bio: 'Exploring the tiny universe through macro photography. Every detail tells a story. 🔬🌸',
        socialLinks: {
            instagram: 'https://instagram.com/macroworld',
            twitter: 'https://x.com/macroworld',
            website: '',
            github: 'https://github.com/macroworld',
        },
        createdAt: '2025-09-03',
    },
    '@streetframe': {
        userId: '@streetframe',
        name: 'Street Frame',
        email: 'street@bytelens.com',
        bio: 'Documentary & street photographer. Capturing raw moments of everyday life in Asia. 🎞️🗼',
        socialLinks: {
            instagram: 'https://instagram.com/streetframe',
            twitter: 'https://x.com/streetframe',
            website: 'https://streetframe.io',
            github: '',
        },
        createdAt: '2025-04-15',
    },
};
