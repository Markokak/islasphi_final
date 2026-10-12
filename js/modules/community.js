import { regions } from '../regions-data.js';
import { getReviews, addReview, deleteReview } from './storage.js';
import { formatCurrency, showToast, escapeHTML } from './helpers.js';

export function initCommunityReviews() {
    const form = document.getElementById('reviewForm');
    const regionSelect = document.getElementById('reviewRegion');
    const destinationSelect = document.getElementById('reviewSpot');
    const customDestinationContainer = document.getElementById('reviewCustomSpotContainer');
    const customDestinationInput = document.getElementById('reviewCustomSpot');
    const starPicker = document.getElementById('starRatingPicker');
    const ratingInput = document.getElementById('reviewRatingInput');
    const filterSelect = document.getElementById('reviewFilterSelect');
    const reviewsList = document.getElementById('reviewsListContainer');

    const otherDestinationValue = '__other__';

    if (regionSelect) {
        regionSelect.innerHTML = '<option value="">Select a Philippine region</option>';
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.name;
            opt.textContent = `${r.name} — ${r.fullName}`;
            regionSelect.appendChild(opt);
        });
    }

    function setCustomDestinationVisibility(isVisible) {
        if (customDestinationContainer) customDestinationContainer.style.display = isVisible ? 'block' : 'none';
        if (customDestinationInput) {
            customDestinationInput.required = isVisible;
            if (!isVisible) customDestinationInput.value = '';
        }
    }

    function updateDestinationOptions() {
        if (!destinationSelect) return;

        const selectedRegion = regions.find(region => region.name === regionSelect?.value);
        destinationSelect.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = selectedRegion ? 'Select a destination' : 'Select a region first';
        destinationSelect.appendChild(placeholder);
        destinationSelect.disabled = !selectedRegion;

        if (selectedRegion) {
            selectedRegion.spots.forEach(spot => {
                const option = document.createElement('option');
                option.value = spot.name;
                option.textContent = spot.name;
                destinationSelect.appendChild(option);
            });

            const otherOption = document.createElement('option');
            otherOption.value = otherDestinationValue;
            otherOption.textContent = 'Other';
            destinationSelect.appendChild(otherOption);
        }

        setCustomDestinationVisibility(false);
    }

    updateDestinationOptions();

    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            updateDestinationOptions();
            regionSelect.classList.remove('is-invalid');
            destinationSelect?.classList.remove('is-invalid');
            customDestinationInput?.classList.remove('is-invalid');
            ['reviewRegionError', 'reviewSpotError', 'reviewCustomSpotError'].forEach(id => {
                const feedback = document.getElementById(id);
                if (feedback) {
                    feedback.textContent = '';
                    feedback.style.display = 'none';
                }
            });
        });
    }

    if (destinationSelect) {
        destinationSelect.addEventListener('change', () => {
            const isOther = destinationSelect.value === otherDestinationValue;
            setCustomDestinationVisibility(isOther);
            destinationSelect.classList.remove('is-invalid');
            customDestinationInput?.classList.remove('is-invalid');
            ['reviewSpotError', 'reviewCustomSpotError'].forEach(id => {
                const feedback = document.getElementById(id);
                if (feedback) {
                    feedback.textContent = '';
                    feedback.style.display = 'none';
                }
            });
        });
    }

    const dateInput = document.getElementById('reviewDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.max = today;
    }

    let selectedRating = 5;
    if (starPicker && ratingInput) {
        const stars = starPicker.querySelectorAll('.star-btn');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.getAttribute('data-value'), 10);
                selectedRating = val;
                ratingInput.value = val;
                updateStarVisuals(val);
            });
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'), 10);
                updateStarVisuals(val);
            });
        });

        starPicker.addEventListener('mouseleave', () => {
            updateStarVisuals(selectedRating);
        });
    }

    function updateStarVisuals(rating) {
        if (!starPicker) return;
        const stars = starPicker.querySelectorAll('.star-btn');
        stars.forEach(s => {
            const val = parseInt(s.getAttribute('data-value'), 10);
            if (val <= rating) {
                s.style.color = '#ffc107';
                s.style.transform = 'scale(1.15)';
            } else {
                s.style.color = 'rgba(255, 255, 255, 0.2)';
                s.style.transform = 'scale(1)';
            }
        });
    }

    updateStarVisuals(5);

    function validateForm(data, isCustomDestination) {
        const errors = {};
        const selectedRegion = regions.find(region => region.name === data.region);

        if (!data.name || data.name.trim().length < 2) {
            errors.name = 'Traveler name must be at least 2 characters.';
        }

        if (!data.region) {
            errors.region = 'Please select a region from the list.';
        }

        if (isCustomDestination) {
            if (!data.destination || data.destination.trim().length < 3) {
                errors.destination = 'Enter a destination name with at least 3 characters.';
            } else if (data.destination.trim().length > 120) {
                errors.destination = 'Destination name must be 120 characters or fewer.';
            }
        } else if (!selectedRegion || !selectedRegion.spots.some(spot => spot.name === data.destination)) {
            errors.destination = 'Please select a destination from the chosen region.';
        }

        if (!data.date) {
            errors.date = 'Please pick the date of your travel.';
        } else {
            const travelDate = new Date(data.date);
            const now = new Date();
            if (travelDate > now) {
                errors.date = 'Travel date cannot be in the future.';
            }
        }

        if (!data.rating || data.rating < 1 || data.rating > 5) {
            errors.rating = 'Please provide a rating between 1 and 5 stars.';
        }

        if (isNaN(data.budget) || data.budget < 0) {
            errors.budget = 'Please enter a valid expense amount (0 or higher).';
        }

        if (!data.text || data.text.trim().length < 15) {
            errors.text = 'Review text must be at least 15 characters to provide meaningful feedback.';
        }

        return errors;
    }

    function displayErrors(errors) {
        
        document.querySelectorAll('.validation-feedback').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        const fieldMap = {
            name: 'reviewName',
            region: 'reviewRegion',
            date: 'reviewDate',
            budget: 'reviewBudget',
            text: 'reviewText'
        };

        for (const [key, msg] of Object.entries(errors)) {
            const inputId = key === 'destination'
                ? (destinationSelect?.value === otherDestinationValue ? 'reviewCustomSpot' : 'reviewSpot')
                : fieldMap[key];
            if (inputId) {
                const inputEl = document.getElementById(inputId);
                const feedbackEl = document.getElementById(inputId + 'Error');
                if (inputEl) inputEl.classList.add('is-invalid');
                if (feedbackEl) {
                    feedbackEl.textContent = msg;
                    feedbackEl.style.display = 'block';
                }
            }
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const destinationChoice = destinationSelect?.value || '';
            const formData = {
                name: document.getElementById('reviewName')?.value.trim() || '',
                destination: destinationChoice === otherDestinationValue
                    ? customDestinationInput?.value.trim() || ''
                    : destinationChoice,
                region: document.getElementById('reviewRegion')?.value || '',
                date: document.getElementById('reviewDate')?.value || '',
                rating: selectedRating,
                budget: parseFloat(document.getElementById('reviewBudget')?.value) || 0,
                text: document.getElementById('reviewText')?.value.trim() || '',
                tip: document.getElementById('reviewTip')?.value.trim() || 'No tip specified.'
            };

            const errors = validateForm(formData, destinationChoice === otherDestinationValue);
            if (Object.keys(errors).length > 0) {
                displayErrors(errors);
                showToast('Please fix the highlighted fields in the form.', 'warning');
                return;
            }

            displayErrors({});

            addReview(formData);
            showToast('Travel log added successfully! Salamat!', 'success');

            form.reset();
            updateDestinationOptions();
            selectedRating = 5;
            updateStarVisuals(5);

            renderReviews();
        });
    }

    function renderReviews() {
        if (!reviewsList) return;
        const allReviews = getReviews();
        const filterVal = filterSelect ? filterSelect.value : 'all';

        let filtered = allReviews;
        if (filterVal === '5') filtered = allReviews.filter(r => r.rating === 5);
        if (filterVal === '4') filtered = allReviews.filter(r => r.rating >= 4);
        if (filterVal === 'luzon') filtered = allReviews.filter(r => ['NCR', 'CAR', 'Region I', 'Region II', 'Region III', 'CALABARZON', 'MIMAROPA', 'Bicol (V)'].includes(r.region));
        if (filterVal === 'visayas') filtered = allReviews.filter(r => ['Western Visayas', 'Central Visayas', 'Eastern Visayas', 'NIR'].includes(r.region));
        if (filterVal === 'mindanao') filtered = allReviews.filter(r => ['Davao Region (XI)', 'Northern Mindanao (X)', 'SOCCSKSARGEN (XII)', 'Caraga', 'Zamboanga (IX)', 'BARMM'].includes(r.region));

        const totalLogsCount = document.getElementById('communityTotalLogs');
        const avgRatingText = document.getElementById('communityAvgRating');
        if (totalLogsCount) totalLogsCount.textContent = `${allReviews.length} Verified Logs`;

        if (avgRatingText && allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
            const avg = (sum / allReviews.length).toFixed(1);
            avgRatingText.innerHTML = `<span class="text-warning">★</span> ${avg} / 5.0`;
        }

        if (filtered.length === 0) {
            reviewsList.innerHTML = `
                <div class="glass p-5 rounded-4 text-center border border-white-5 my-4">
                    <i data-lucide="compass" class="text-accent mb-3" style="width:36px; height:36px;"></i>
                    <h4 class="text-white fw-bold h5">No Travel Logs Found</h4>
                    <p class="text-dim small m-0">No experiences matching the selected filter yet. Be the first to share one!</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        reviewsList.innerHTML = '';
        filtered.forEach(rev => {
            const card = document.createElement('div');
            card.className = 'col-lg-6 col-md-12';

            const starsHtml = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);

            card.innerHTML = `
                <div class="glass glass-hover p-4 rounded-4 border border-white-5 h-100 d-flex flex-column justify-content-between position-relative">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-2.5">
                            <div>
                                <span class="badge bg-accent text-dark fw-bold text-uppercase rounded-pill px-2.5 py-1" style="font-size:0.62rem; letter-spacing:0.5px;">${escapeHTML(rev.region)}</span>
                                <h4 class="text-white fw-bold h6 mt-2 mb-0">${escapeHTML(rev.destination)}</h4>
                            </div>
                            <div class="text-end">
                                <div class="text-warning fw-bold small" style="letter-spacing: 2px; font-size: 0.85rem;">${starsHtml}</div>
                                <div class="text-dim" style="font-size: 0.65rem;">Visited: ${escapeHTML(rev.date || 'Recent')}</div>
                            </div>
                        </div>

                        <p class="text-dim small mt-2 mb-3" style="line-height: 1.5; font-size: 0.78rem;">
                            "${escapeHTML(rev.text)}"
                        </p>
                    </div>

                    <div>
                        <div class="p-2.5 rounded-3 mb-3 border border-white-5" style="background: rgba(0, 212, 255, 0.03);">
                            <div class="small fw-bold text-accent d-flex align-items-center gap-1" style="font-size: 0.68rem;">
                                <i data-lucide="lightbulb" style="width:12px; height:12px;"></i>
                                <span>Traveler Secret Tip:</span>
                            </div>
                            <div class="text-dim" style="font-size: 0.7rem; line-height: 1.35; margin-top:2px;">
                                ${escapeHTML(rev.tip)}
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center pt-2 border-top border-white-5">
                            <div class="d-flex align-items-center gap-2">
                                <div class="avatar-circle" style="width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: #0c0d10; font-weight: 800; font-size: 0.68rem; display: flex; align-items: center; justify-content: center;">
                                    ${escapeHTML(rev.name.charAt(0).toUpperCase())}
                                </div>
                                <div>
                                    <div class="text-white fw-bold" style="font-size: 0.72rem;">${escapeHTML(rev.name)}</div>
                                    <div class="text-dim" style="font-size: 0.65rem;">Est. Spent: ${formatCurrency(rev.budget || 0)}</div>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-2 py-0.5" style="font-size: 0.62rem;" onclick="handleDeleteReview('${rev.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            reviewsList.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();
    }

    window.handleDeleteReview = function(id) {
        deleteReview(id);
        renderReviews();
        showToast('Review removed from LocalStorage', 'info');
    };

    if (filterSelect) {
        filterSelect.addEventListener('change', renderReviews);
    }

    renderReviews();
}
