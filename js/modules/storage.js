const STORAGE_KEYS = {
    BOOKMARKS: 'islas_favs',
    REVIEWS: 'islas_reviews',
    SAVED_TRIPS: 'islas_saved_trips'
};

const DEFAULT_REVIEWS = [
    {
        id: 'rev-1',
        name: 'Maria Santos',
        destination: 'El Nido Coves, Palawan',
        region: 'MIMAROPA',
        rating: 5,
        date: '2026-03-12',
        budget: 18500,
        text: 'The limestone karst towers in Secret Lagoon and Shimizu Island are otherworldly! Kayaking at dawn gave us the clearest waters with zero crowds.',
        tip: 'Rent a private outrigger bangka at 7:00 AM instead of joining group tours to have the lagoons all to yourself.',
        createdAt: '2026-03-14T09:30:00Z'
    },
    {
        id: 'rev-2',
        name: 'Carlos Mendoza',
        destination: 'Banaue Rice Terraces, Ifugao',
        region: 'CAR',
        rating: 5,
        date: '2026-02-18',
        budget: 6800,
        text: 'Trekking to Batad took endurance, but the viewpoint overlooking the emerald amphitheater is breathtaking. The native Ifugao community was exceptionally welcoming.',
        tip: 'Hire an official local guide from the Batad Information Center for safe navigation along narrow terrace walls.',
        createdAt: '2026-02-20T14:15:00Z'
    },
    {
        id: 'rev-3',
        name: 'Aira Del Rosario',
        destination: 'Cloud 9, Siargao',
        region: 'Caraga',
        rating: 4,
        date: '2026-01-25',
        budget: 12400,
        text: 'Vibrant surf culture and wonderful coconut smoothie bowls. The boardwalk at sunset is iconic. Surf instructors were patient with beginner lessons.',
        tip: 'Bring cash in PHP 50 and 100 notes because local tricycles and roadside carinderias rarely accept cards.',
        createdAt: '2026-01-27T18:00:00Z'
    }
];

function safeParse(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (err) {
        console.warn(`[IslasPhi] LocalStorage read failed for "${key}":`, err);
        return fallback;
    }
}

function safeSave(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        console.error(`[IslasPhi] LocalStorage write failed for "${key}":`, err);
        return false;
    }
}

export function getBookmarks() {
    return safeParse(STORAGE_KEYS.BOOKMARKS, []);
}

export function isBookmarked(spotId) {
    const list = getBookmarks();
    return list.includes(spotId);
}

export function toggleBookmark(spotId) {
    let list = getBookmarks();
    const index = list.indexOf(spotId);
    let added = false;

    if (index > -1) {
        list.splice(index, 1);
        added = false;
    } else {
        list.push(spotId);
        added = true;
    }

    safeSave(STORAGE_KEYS.BOOKMARKS, list);
    return { bookmarked: added, total: list.length };
}

export function getReviews() {
    const stored = safeParse(STORAGE_KEYS.REVIEWS, null);
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
        
        safeSave(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS);
        return DEFAULT_REVIEWS;
    }
    return stored;
}

export function addReview(newReview) {
    const reviews = getReviews();
    const reviewWithMeta = {
        id: 'rev-' + Date.now(),
        ...newReview,
        createdAt: new Date().toISOString()
    };
    reviews.unshift(reviewWithMeta);
    safeSave(STORAGE_KEYS.REVIEWS, reviews);
    return reviewWithMeta;
}

export function deleteReview(reviewId) {
    let reviews = getReviews();
    reviews = reviews.filter(r => r.id !== reviewId);
    safeSave(STORAGE_KEYS.REVIEWS, reviews);
    return reviews;
}

export function getSavedTrips() {
    const trips = safeParse(STORAGE_KEYS.SAVED_TRIPS, []);
    return Array.isArray(trips) ? trips : [];
}

export function saveTrip(trip) {
    const trips = getSavedTrips();
    const tripRecord = {
        id: 'trip-' + Date.now(),
        savedAt: new Date().toLocaleDateString('en-PH'),
        ...trip
    };
    trips.unshift(tripRecord);
    return safeSave(STORAGE_KEYS.SAVED_TRIPS, trips) ? tripRecord : null;
}

export function deleteSavedTrip(tripId) {
    let trips = getSavedTrips();
    trips = trips.filter(t => t.id !== tripId);
    safeSave(STORAGE_KEYS.SAVED_TRIPS, trips);
    return trips;
}
