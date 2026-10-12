import { regions } from '../regions-data.js';
import { formatCurrency, showToast, escapeHTML } from './helpers.js';
import { saveTrip, getSavedTrips, deleteSavedTrip } from './storage.js';

export function initTripPlanner() {
    const regionSelect = document.getElementById('plannerRegion');
    const styleSelect = document.getElementById('plannerStyle');
    const durationInput = document.getElementById('plannerDuration');
    const peopleInput = document.getElementById('plannerPeople');
    const generateBtn = document.getElementById('generateItineraryBtn');
    const saveTripBtn = document.getElementById('saveTripBtn');
    const resetTripBtn = document.getElementById('resetTripBtn');

    if (regionSelect) {
        regionSelect.innerHTML = '';
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.name} — ${r.fullName}`;
            regionSelect.appendChild(opt);
        });
    }

    function calculate() {
        if (!regionSelect || !styleSelect || !durationInput || !peopleInput) return;

        const days = parseInt(durationInput.value, 10);
        const people = parseInt(peopleInput.value, 10);
        const errorAlert = document.getElementById('plannerErrorAlert');

        if (isNaN(days) || days < 1 || days > 14) {
            if (errorAlert) {
                errorAlert.textContent = 'Please enter a valid trip duration between 1 and 14 days.';
                errorAlert.style.display = 'block';
            }
            durationInput.focus();
            return;
        }

        if (isNaN(people) || people < 1 || people > 10) {
            if (errorAlert) {
                errorAlert.textContent = 'Please enter a party size between 1 and 10 travelers.';
                errorAlert.style.display = 'block';
            }
            peopleInput.focus();
            return;
        }

        if (errorAlert) errorAlert.style.display = 'none';

        const rId = regionSelect.value;
        const style = styleSelect.value;
        const targetRegion = regions.find(r => r.id === rId) || regions[0];

        let baseRate = 4500; 
        if (style === 'economy') baseRate = 1800;
        if (style === 'luxury') baseRate = 14000;

        const totalCost = baseRate * days * people;
        const costPerPerson = totalCost / people;

        const costResult = document.getElementById('plannerCostResult');
        const perPersonResult = document.getElementById('plannerPerPersonResult');
        const breakdownGrid = document.getElementById('plannerBreakdownGrid');
        const timeline = document.getElementById('plannerItineraryTimeline');
        const plannerTip = document.getElementById('plannerTip');
        const scamShield = document.getElementById('plannerScamShield');
        const resultsArea = document.getElementById('plannerResults');

        if (costResult) costResult.textContent = formatCurrency(totalCost);
        if (perPersonResult) perPersonResult.textContent = formatCurrency(costPerPerson);

        const hotelCost = totalCost * 0.35;
        const foodCost = totalCost * 0.25;
        const transCost = totalCost * 0.20;
        const tourCost = totalCost * 0.20;

        if (breakdownGrid) {
            breakdownGrid.innerHTML = `
                <div class="col-6 col-md-3">
                    <div class="budget-category-box text-start">
                        <div class="text-accent fw-bold mb-1 d-flex align-items-center gap-1">
                            <i data-lucide="hotel" style="width:13px; height:13px;"></i>
                            <span>Lodging (35%)</span>
                        </div>
                        <div class="text-white fw-bold text-truncate" style="font-size: 0.85rem;">${formatCurrency(hotelCost)}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="budget-category-box text-start">
                        <div class="text-accent fw-bold mb-1 d-flex align-items-center gap-1">
                            <i data-lucide="utensils" style="width:13px; height:13px;"></i>
                            <span>Dining (25%)</span>
                        </div>
                        <div class="text-white fw-bold text-truncate" style="font-size: 0.85rem;">${formatCurrency(foodCost)}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="budget-category-box text-start">
                        <div class="text-accent fw-bold mb-1 d-flex align-items-center gap-1">
                            <i data-lucide="plane" style="width:13px; height:13px;"></i>
                            <span>Transit (20%)</span>
                        </div>
                        <div class="text-white fw-bold text-truncate" style="font-size: 0.85rem;">${formatCurrency(transCost)}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="budget-category-box text-start">
                        <div class="text-accent fw-bold mb-1 d-flex align-items-center gap-1">
                            <i data-lucide="ticket" style="width:13px; height:13px;"></i>
                            <span>Activities (20%)</span>
                        </div>
                        <div class="text-white fw-bold text-truncate" style="font-size: 0.85rem;">${formatCurrency(tourCost)}</div>
                    </div>
                </div>
            `;
        }

        if (timeline) {
            timeline.innerHTML = '';
            const spots = targetRegion.spots;

            for (let day = 1; day <= days; day++) {
                const spot = spots[(day - 1) % spots.length];
                const foodPick = spot.foods && spot.foods.length ? spot.foods[0] : 'Local delicacy';

                const dayCard = document.createElement('div');
                dayCard.className = 'border-start border-accent ps-3 pb-2 position-relative text-start';
                dayCard.innerHTML = `
                    <div style="position: absolute; left: -5px; top: 4px; width: 9px; height: 9px; border-radius: 50%; background: var(--accent);"></div>
                    <div class="text-white fw-bold mb-1">Day ${day}: Explore ${escapeHTML(spot.name)}</div>
                    <p class="m-0 text-dim" style="font-size: 0.72rem; line-height: 1.45;">
                        ${escapeHTML(spot.description)} 
                        <br><span class="text-white-50">Local Taste:</span> <span class="text-accent">${escapeHTML(foodPick)}</span>
                    </p>
                `;
                timeline.appendChild(dayCard);
            }
        }

        if (plannerTip) {
            let tip = '';
            if (style === 'economy') {
                tip = `Backpacking in ${targetRegion.name}: Board local Jeepneys or multi-cabs (typically ₱15 - ₱40 per fare) and eat at verified roadside carinderias to keep food expenses minimal.`;
            } else if (style === 'luxury') {
                tip = `Premium travel in ${targetRegion.name}: Pre-arrange private air-conditioned van charters and private speedboats 48 hours prior to arrival. Request concierge bookings for sunset dinners.`;
            } else {
                tip = `Mid-range exploration in ${targetRegion.name}: Stay in boutique beachside cabanas or heritage inns. Hire accredited municipal tricycles for inland day tours.`;
            }
            plannerTip.textContent = tip;
        }

        if (scamShield) {
            let advice = 'Always double-check municipal fare rate sheets before boarding. Engage only guides with certified accreditation IDs.';
            if (targetRegion.id === 'ncr') {
                advice = 'Refuse private airport taxis proposing fixed "tourist packages". Request meter activation or book via Grab.';
            } else if (targetRegion.id === 'car') {
                advice = 'Hire mountain summit guides exclusively through official Barangay tourism desks. Avoid unaffiliated street runners.';
            } else if (targetRegion.id === 'reg6' || targetRegion.id === 'mimaropa' || targetRegion.id === 'reg13') {
                advice = 'Do not book island-hopping boats through unbadged beach touts. Use registered boat associations stationed at the harbor.';
            }
            scamShield.textContent = advice;
        }

        if (resultsArea) resultsArea.style.display = 'block';

        const copyBtnText = document.getElementById('plannerCopyBtnText');
        if (copyBtnText) copyBtnText.textContent = 'Copy Itinerary';

        if (window.lucide) window.lucide.createIcons();
    }

    window.copyPlannerItinerary = function() {
        if (!regionSelect || !styleSelect || !durationInput || !peopleInput) return;
        const targetRegion = regions.find(r => r.id === regionSelect.value) || regions[0];
        const days = parseInt(durationInput.value, 10) || 1;
        const people = parseInt(peopleInput.value, 10) || 1;
        const totalCostText = document.getElementById('plannerCostResult')?.textContent || '₱0';

        let text = `ISLASPHI TRIP ITINERARY & BUDGET PLAN\n`;
        text += `==========================================\n`;
        text += `Destination: ${targetRegion.fullName} (${targetRegion.name})\n`;
        text += `Travel Style: ${styleSelect.value.toUpperCase()}\n`;
        text += `Duration: ${days} Day(s) | Party Size: ${people} Traveler(s)\n`;
        text += `Total Estimated Budget: ${totalCostText}\n\n`;
        text += `DAY-BY-DAY ITINERARY:\n`;

        for (let i = 1; i <= days; i++) {
            const spot = targetRegion.spots[(i - 1) % targetRegion.spots.length];
            text += `- Day ${i}: ${spot.name}\n`;
            text += `  Highlights: ${spot.description}\n`;
            text += `  Cuisine to try: ${spot.foods ? spot.foods.join(', ') : 'Local dishes'}\n\n`;
        }

        const tip = document.getElementById('plannerTip')?.textContent;
        if (tip) text += `Packing & Transit Tip:\n${tip}\n\n`;
        text += `==========================================\n`;
        text += `Crafted with IslasPhi — Artistic Flair Philippines`;

        navigator.clipboard.writeText(text).then(() => {
            const btnText = document.getElementById('plannerCopyBtnText');
            if (btnText) btnText.textContent = 'Itinerary Copied! ✓';
            showToast('Itinerary copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Could not copy automatically. Please select text manually.', 'warning');
        });
    };

    if (saveTripBtn) {
        saveTripBtn.onclick = () => {
            const rId = regionSelect.value;
            const targetRegion = regions.find(r => r.id === rId) || regions[0];
            const days = parseInt(durationInput.value, 10) || 1;
            const people = parseInt(peopleInput.value, 10) || 1;
            const cost = document.getElementById('plannerCostResult')?.textContent || '₱0';

            const savedTrip = saveTrip({
                regionId: targetRegion.id,
                regionName: targetRegion.name,
                regionFullName: targetRegion.fullName,
                style: styleSelect.value,
                duration: days,
                headcount: people,
                totalCost: cost
            });

            if (!savedTrip) {
                showToast('Trip could not be saved. Check browser storage availability.', 'error');
                return;
            }

            showToast(`Saved trip for ${targetRegion.name} to LocalStorage!`, 'success');
            renderSavedTripsList();
        };
    }

    if (resetTripBtn) {
        resetTripBtn.onclick = () => {
            regionSelect.selectedIndex = 0;
            styleSelect.value = 'midrange';
            durationInput.value = 3;
            peopleInput.value = 2;
            calculate();
            showToast('Trip planner reset to defaults', 'info');
        };
    }

    function renderSavedTripsList() {
        const container = document.getElementById('savedTripsContainer');
        if (!container) return;
        const trips = getSavedTrips();

        if (trips.length === 0) {
            container.innerHTML = `
                <div class="text-dim small text-center py-3">No planned trips saved yet. Generate a plan and click "Save Trip" to store here!</div>
            `;
            return;
        }

        container.innerHTML = '';
        trips.forEach(t => {
            const item = document.createElement('div');
            item.className = 'glass p-2.5 rounded-3 border border-white-5 d-flex justify-content-between align-items-center mb-2';
            item.innerHTML = `
                <div>
                    <div class="text-white fw-bold small">${escapeHTML(t.regionName)} — ${escapeHTML(String(t.duration))} Days (${escapeHTML(t.style)})</div>
                    <div class="text-dim" style="font-size:0.68rem;">${escapeHTML(t.totalCost)} · ${escapeHTML(String(t.headcount))} pax · Saved on ${escapeHTML(t.savedAt)}</div>
                </div>
                <div class="d-flex align-items-center gap-1.5">
                    <button class="btn btn-outline-accent btn-sm rounded-pill px-2 py-0.5" style="font-size:0.62rem;" onclick="loadSavedTrip('${t.id}')">Load</button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-2 py-0.5" style="font-size:0.62rem;" onclick="removeSavedTrip('${t.id}')">✕</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    window.loadSavedTrip = function(tripId) {
        const trips = getSavedTrips();
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return;

        regionSelect.value = trip.regionId;
        styleSelect.value = trip.style;
        durationInput.value = trip.duration;
        peopleInput.value = trip.headcount;
        calculate();
        showToast(`Loaded saved itinerary for ${trip.regionName}`, 'info');
    };

    window.removeSavedTrip = function(tripId) {
        deleteSavedTrip(tripId);
        renderSavedTripsList();
        showToast('Saved itinerary removed', 'info');
    };

    if (generateBtn) {
        generateBtn.onclick = calculate;
    }

    calculate();
    renderSavedTripsList();

    return {
        selectRegion: (regionId) => {
            if (regionSelect) {
                regionSelect.value = regionId;
                calculate();
            }
        }
    };
}
