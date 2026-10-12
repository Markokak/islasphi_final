import { regions } from '../regions-data.js';
import { getBookmarks, toggleBookmark } from './storage.js';
import { showToast, escapeHTML } from './helpers.js';

export function initViews(exploreModule, plannerModule) {
    const views = {
        home: document.getElementById('homeView'),
        explore: document.getElementById('exploreView'),
        planner: document.getElementById('plannerView'),
        favorites: document.getElementById('favoritesView'),
        community: document.getElementById('communityView')
    };

    const navButtons = {
        home: document.getElementById('btnNavHome'),
        explore: document.getElementById('btnNavExplore'),
        planner: document.getElementById('btnNavPlanner'),
        favorites: document.getElementById('btnNavFavorites'),
        community: document.getElementById('btnNavCommunity')
    };

    const regionNavContainer = document.getElementById('regionNavContainer');
    const navFavBadge = document.getElementById('navFavBadge');
    const mobileFavBadge = document.getElementById('mobileFavBadge');

    let currentView = 'home';
    let currentFavoritesSearch = '';

    function updateFavBadges() {
        const bookmarks = getBookmarks();
        const count = bookmarks.length;
        if (navFavBadge) {
            navFavBadge.textContent = count;
            navFavBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (mobileFavBadge) {
            mobileFavBadge.textContent = count;
            mobileFavBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    function renderFavorites() {
        const container = document.getElementById('favoritesSectionContent');
        if (!container) return;
        const bookmarks = getBookmarks();

        let bookmarkedSpots = [];
        regions.forEach(r => {
            r.spots.forEach(s => {
                if (bookmarks.includes(s.id)) {
                    bookmarkedSpots.push({ spot: s, rName: r.name });
                }
            });
        });

        if (currentFavoritesSearch) {
            const q = currentFavoritesSearch.toLowerCase();
            bookmarkedSpots = bookmarkedSpots.filter(item =>
                item.spot.name.toLowerCase().includes(q) ||
                item.spot.description.toLowerCase().includes(q) ||
                item.rName.toLowerCase().includes(q)
            );
        }

        if (bookmarkedSpots.length === 0) {
            container.innerHTML = `
                <div class="empty-favorites-container">
                    <i data-lucide="heart" class="text-white-30 pulse-heart mb-3" style="width: 48px; height: 48px; color: rgba(255,255,255,0.12)"></i>
                    <h3 class="text-white fw-bold h5">No Saved Spots Added</h3>
                    <p class="text-dim small mb-4" style="max-width:340px; line-height: 1.5;">
                        ${currentFavoritesSearch ? 'No bookmarked spots match your active search.' : 'You have not saved any destination yet. Click the heart icon on any spot card to bookmark it here!'}
                    </p>
                    <button class="btn btn-accent rounded-pill py-2.5 px-4 fw-black text-uppercase small" style="font-size:0.65rem; letter-spacing:1px;" onclick="switchView('explore')">Explore Regions Now</button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'row g-4';

        bookmarkedSpots.forEach(item => {
            const s = item.spot;
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6';
            col.innerHTML = `
                <div class="spot-card glass glass-hover">
                    <div class="card-img" style="background-image:url(${s.image})" onclick="window.openModal('${s.id}')">
                        <div class="fav-btn active" onclick="handleRemoveBookmark(event, '${s.id}', '${escapeHTML(s.name)}')">
                            <i data-lucide="heart" style="width:16px; fill:currentColor;"></i>
                        </div>
                    </div>
                    <div class="card-body-custom" onclick="window.openModal('${s.id}')">
                        <div class="card-tag">${escapeHTML(item.rName)}</div>
                        <div class="card-name text-white">${escapeHTML(s.name)}</div>
                        <div class="card-desc">${escapeHTML(s.description)}</div>
                    </div>
                </div>
            `;
            grid.appendChild(col);
        });

        container.appendChild(grid);
        if (window.lucide) window.lucide.createIcons();
    }

    window.handleRemoveBookmark = function(e, id, name) {
        e.stopPropagation();
        toggleBookmark(id);
        updateFavBadges();
        renderFavorites();
        showToast(`Removed "${name}" from saved spots`, 'info');
    };

    window.switchView = function(viewName, extraData = {}) {
        if (!views[viewName]) return;
        currentView = viewName;

        Object.values(views).forEach(v => {
            if (v) v.style.display = 'none';
        });

        Object.values(navButtons).forEach(b => {
            if (b) b.classList.remove('active');
        });

        views[viewName].style.display = viewName === 'explore' ? 'grid' : 'block';
        if (navButtons[viewName]) navButtons[viewName].classList.add('active');

        if (regionNavContainer) {
            regionNavContainer.style.display = viewName === 'explore' ? 'flex' : 'none';
        }
        
        if (viewName === 'explore') {
            if (extraData && extraData.allRegions) {
                exploreModule.showAllRegions();
            } else if (extraData && extraData.regionId) {
                exploreModule.setActiveRegionById(extraData.regionId);
            } else if (extraData && extraData.hub) {
                exploreModule.setActiveHubFilter(extraData.hub);
            } else {
                exploreModule.render();
            }
        } else if (viewName === 'favorites') {
            renderFavorites();
        } else if (viewName === 'planner' && extraData && extraData.regionId) {
            plannerModule.selectRegion(extraData.regionId);
        }

        updateFavBadges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (window.lucide) window.lucide.createIcons();
    };

    window.focusIslandGroup = function(hub) {
        window.switchView('explore', { hub });
    };

    window.toggleMobileNav = function() {
        const menu = document.getElementById('mobileNavMenu');
        const toggle = document.getElementById('mobileNavToggle');
        if (menu) {
            const isExpanded = menu.style.display === 'none';
            menu.style.display = isExpanded ? 'block' : 'none';
            if (toggle) toggle.setAttribute('aria-expanded', String(isExpanded));
        }
    };

    function setFavoritesSearch(query) {
        currentFavoritesSearch = query;
        if (currentView === 'favorites') {
            renderFavorites();
        }
    }

    return {
        updateFavBadges,
        renderFavorites,
        setFavoritesSearch,
        getCurrentView: () => currentView
    };
}
