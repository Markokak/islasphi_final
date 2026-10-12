import { regions } from '../regions-data.js';
import { isBookmarked, toggleBookmark } from './storage.js';
import { showToast, escapeHTML } from './helpers.js';

export function initExplore(onBookmarkChange, onRegionSearchClear) {
    let activeRegion = regions[0];
    let currentHubFilter = 'all'; 
    let currentSearch = '';
    let lastSearchQuery = '';

    function clearActiveSearch() {
        currentSearch = '';
        if (typeof onRegionSearchClear === 'function') onRegionSearchClear();
    }

    const regionNav = document.getElementById('regionNav');
    const spotGrid = document.getElementById('spotGrid');
    const heroSection = document.getElementById('heroSection');
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const sectionTitle = document.getElementById('sectionTitle');
    const resultCount = document.getElementById('resultCount');
    const sidebarMapImg = document.getElementById('sidebarMapImg');
    const sidebarRegionBadge = document.getElementById('sidebarRegionBadge');
    const sidebarFullName = document.getElementById('sidebarFullName');
    const sidebarSpotsCount = document.getElementById('sidebarSpotsCount');
    const sidebarDesc = document.getElementById('sidebarDesc');
    const localTipText = document.getElementById('localTipText');

    function getHubForRegion(rId) {
        const luzonIds = ['ncr', 'car', 'reg1', 'reg2', 'reg3', 'reg4a', 'reg4b', 'reg5'];
        const visayasIds = ['reg6', 'reg7', 'reg8', 'nir'];
        if (luzonIds.includes(rId)) return 'luzon';
        if (visayasIds.includes(rId)) return 'visayas';
        return 'mindanao';
    }

    function renderRegionNav() {
        if (!regionNav) return;
        regionNav.innerHTML = '';

        let visibleRegions = regions;
        if (currentHubFilter !== 'all') {
            visibleRegions = regions.filter(r => getHubForRegion(r.id) === currentHubFilter);
        }

        visibleRegions.forEach(r => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `region-item ${activeRegion.id === r.id ? 'active' : ''}`;
            item.textContent = r.name;
            if (activeRegion.id === r.id) item.setAttribute('aria-current', 'location');
            item.onclick = () => {
                clearActiveSearch();
                activeRegion = r;
                render();
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            };
            regionNav.appendChild(item);
        });
    }

    function renderHeroAndSidebar() {
        if (!activeRegion || !activeRegion.spots.length) return;
        const firstSpot = activeRegion.spots[0];

        if (heroSection) {
            heroSection.style.backgroundImage = `url(${firstSpot.image})`;
        }
        if (heroTitle) heroTitle.textContent = activeRegion.fullName;
        if (heroSubtitle) heroSubtitle.textContent = activeRegion.description;

        if (sidebarMapImg) sidebarMapImg.src = firstSpot.image;
        if (sidebarRegionBadge) sidebarRegionBadge.textContent = activeRegion.name;
        if (sidebarFullName) sidebarFullName.textContent = activeRegion.fullName;
        if (sidebarSpotsCount) sidebarSpotsCount.textContent = `${activeRegion.spots.length} Curated Spots`;
        if (sidebarDesc) sidebarDesc.textContent = activeRegion.description;

        if (localTipText) {
            const tips = [
                `In ${activeRegion.name}, try local delicacies like ${firstSpot.foods ? firstSpot.foods[0] : 'special dishes'} for breakfast.`,
                `The recommended window for visiting ${firstSpot.name} is ${firstSpot.bestTime || 'Year-round'}.`,
                'Carry direct cash blocks in PHP for local tricycle and passenger banca fares.',
                'Coordinate with accredited municipal tourism officers prior to summit ascents.'
            ];
            localTipText.textContent = `"${tips[Math.floor(Math.random() * tips.length)]}"`;
        }

        const highlightsContainer = document.getElementById('sidebarHighlights');
        if (highlightsContainer) {
            highlightsContainer.innerHTML = '';
            const previewSpots = activeRegion.spots.slice(0, 3);
            previewSpots.forEach(s => {
                const item = document.createElement('div');
                item.className = 'highlight-item';
                item.onclick = () => window.openModal(s.id);
                item.innerHTML = `
                    <img src="${s.image}" class="highlight-img" alt="${escapeHTML(s.name)}">
                    <div>
                        <div class="highlight-name text-white transition-all hover:text-cyan-400" style="font-size: 0.8rem;">${escapeHTML(s.name)}</div>
                        <div class="highlight-meta">${escapeHTML(activeRegion.name)}</div>
                    </div>
                `;
                highlightsContainer.appendChild(item);
            });
        }
    }

    function renderSpotCards() {
        if (!spotGrid) return;
        spotGrid.innerHTML = '';

        let spotsToRender = [];

        if (currentSearch) {
            const q = currentSearch.toLowerCase();
            regions.forEach(r => {
                
                if (currentHubFilter !== 'all' && getHubForRegion(r.id) !== currentHubFilter) return;

                r.spots.forEach(s => {
                    const matchName = s.name.toLowerCase().includes(q);
                    const matchDesc = s.description.toLowerCase().includes(q);
                    const matchRegion = r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q);
                    if (matchName || matchDesc || matchRegion) {
                        spotsToRender.push({ spot: s, rName: r.name, rFull: r.fullName });
                    }
                });
            });

            if (sectionTitle) sectionTitle.textContent = `Search Results: "${escapeHTML(currentSearch)}"`;
        } else {
            activeRegion.spots.forEach(s => {
                spotsToRender.push({ spot: s, rName: activeRegion.name, rFull: activeRegion.fullName });
            });
            if (sectionTitle) sectionTitle.textContent = activeRegion.fullName;
        }

        if (resultCount) {
            resultCount.textContent = `${spotsToRender.length} DESTINATION${spotsToRender.length === 1 ? '' : 'S'} FOUND`;
        }

        if (spotsToRender.length === 0) {
            spotGrid.innerHTML = `
                <div class="col-12">
                    <div class="glass p-5 rounded-4 text-center border border-white-5">
                        <i data-lucide="search" class="text-accent mb-3" style="width:36px; height:36px;"></i>
                        <h4 class="text-white fw-bold h5">No Destinations Found</h4>
                        <p class="text-dim small m-0">No spots match "${escapeHTML(currentSearch)}". Try another search query or choose a different region.</p>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        spotsToRender.forEach(item => {
            const s = item.spot;
            const fav = isBookmarked(s.id);
            const col = document.createElement('div');
            col.className = 'col-lg-4 col-md-6';
            col.innerHTML = `
                <div class="spot-card glass glass-hover">
                    <div class="card-img" style="background-image:url(${s.image})" onclick="window.openModal('${s.id}')">
                        <div class="fav-btn ${fav ? 'active' : ''}" onclick="handleToggleBookmark(event, '${s.id}', '${escapeHTML(s.name)}')">
                            <i data-lucide="heart" style="width:16px; ${fav ? 'fill:currentColor;' : ''}"></i>
                        </div>
                    </div>
                    <div class="card-body-custom" onclick="window.openModal('${s.id}')">
                        <div class="card-tag">${escapeHTML(item.rName)}</div>
                        <div class="card-name text-white">${escapeHTML(s.name)}</div>
                        <div class="card-desc">${escapeHTML(s.description)}</div>
                    </div>
                </div>
            `;
            spotGrid.appendChild(col);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    window.handleToggleBookmark = function(e, id, name) {
        e.stopPropagation();
        const res = toggleBookmark(id);
        const action = res.bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks';
        showToast(`${name || 'Spot'}: ${action}`, res.bookmarked ? 'success' : 'info');

        renderSpotCards();
        if (typeof onBookmarkChange === 'function') {
            onBookmarkChange();
        }
    };

    function render() {
        renderRegionNav();
        renderHeroAndSidebar();
        renderSpotCards();
    }

    function selectHubFilter(hub) {
        currentHubFilter = hub;

        if (currentHubFilter !== 'all') {
            const firstInHub = regions.find(r => getHubForRegion(r.id) === currentHubFilter);
            if (firstInHub) activeRegion = firstInHub;
        }

        hubFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-hub') === currentHubFilter);
        });
        render();
    }

    const hubFilterBtns = document.querySelectorAll('.hub-filter-btn');
    hubFilterBtns.forEach(btn => {
        btn.onclick = () => {
            selectHubFilter(btn.getAttribute('data-hub') || 'all');
        };
    });

    window.scrollToGrid = function() {
        clearActiveSearch();
        renderSpotCards();
        if (spotGrid) spotGrid.scrollIntoView({ behavior: 'smooth' });
    };

    return {
        render,
        showAllRegions: () => {
            clearActiveSearch();
            selectHubFilter('all');
        },
        setActiveHubFilter: (hub) => {
            clearActiveSearch();
            selectHubFilter(hub);
        },
        setActiveRegionById: (regionId) => {
            const found = regions.find(r => r.id === regionId);
            if (found) {
                clearActiveSearch();
                activeRegion = found;
                currentHubFilter = 'all';
                hubFilterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-hub') === 'all'));
                render();
            }
        },
        setSearchQuery: (query) => {
            currentSearch = query;
            if (query.trim()) lastSearchQuery = query;
            renderSpotCards();
        },
        getLastSearchQuery: () => lastSearchQuery
    };
}
