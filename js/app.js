import { regions, realImageOverrides } from './regions-data.js';
import { initModal } from './modules/modal.js';
import { initTripPlanner } from './modules/planner.js';
import { initCommunityReviews } from './modules/community.js';
import { initExplore } from './modules/explore.js';
import { initViews } from './modules/views.js';

regions.forEach(region => {
    region.spots.forEach(spot => {
        if (realImageOverrides[spot.id]) {
            spot.image = realImageOverrides[spot.id];
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    
    const plannerModule = initTripPlanner();

    const navSearchInput = document.getElementById('searchInput');
    const homeSearchInput = document.getElementById('homeSearchInput');
    const restoreSearchButton = document.getElementById('restoreSearchButton');

    initModal((regionId) => {
        window.switchView('planner', { regionId });
    });

    let viewsModule = null;
    const exploreModule = initExplore(
        () => {
            if (viewsModule) viewsModule.updateFavBadges();
        },
        () => {
            if (navSearchInput) navSearchInput.value = '';
            if (homeSearchInput) homeSearchInput.value = '';
            if (viewsModule) viewsModule.setFavoritesSearch('');
        }
    );

    viewsModule = initViews(exploreModule, plannerModule);

    initCommunityReviews();

    function handleSearchInput(query) {
        exploreModule.setSearchQuery(query);
        if (viewsModule) viewsModule.setFavoritesSearch(query);

        if (navSearchInput && navSearchInput.value !== query) navSearchInput.value = query;
        if (homeSearchInput && homeSearchInput.value !== query) homeSearchInput.value = query;
    }

    function restoreLastSearch(input, focusInput = true) {
        const previousQuery = exploreModule.getLastSearchQuery();
        if (!previousQuery) return;

        if (navSearchInput) navSearchInput.value = previousQuery;
        if (homeSearchInput) homeSearchInput.value = previousQuery;
        if (focusInput && input) {
            input.focus();
            input.setSelectionRange(previousQuery.length, previousQuery.length);
        }
    }

    if (restoreSearchButton) {
        restoreSearchButton.addEventListener('click', () => restoreLastSearch(navSearchInput));
    }

    if (navSearchInput) {
        const syncNavSearch = (e) => {
            const query = e.target.value;
            handleSearchInput(query);
            if (
                query.trim().length > 0 &&
                viewsModule &&
                viewsModule.getCurrentView() !== 'explore' &&
                viewsModule.getCurrentView() !== 'favorites'
            ) {
                window.switchView('explore');
            }
        };
        navSearchInput.addEventListener('input', syncNavSearch);
        navSearchInput.addEventListener('search', syncNavSearch);
    }

    if (homeSearchInput) {
        homeSearchInput.addEventListener('focus', () => {
            if (!homeSearchInput.value) restoreLastSearch(homeSearchInput, false);
        });
        const syncHomeSearch = (e) => {
            const query = e.target.value;
            handleSearchInput(query);
            
            if (viewsModule.getCurrentView() === 'home' && query.trim().length > 0) {
                window.switchView('explore');
                setTimeout(() => {
                    if (navSearchInput) navSearchInput.focus();
                }, 50);
            }
        };
        homeSearchInput.addEventListener('input', syncHomeSearch);
        homeSearchInput.addEventListener('search', syncHomeSearch);
    }

    viewsModule.updateFavBadges();

    window.switchView('home');

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
