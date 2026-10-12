import { regions } from '../regions-data.js';

export function initModal(onOpenTripPlanner) {
    const modalBackdrop = document.getElementById('modalBackdrop');
    const closeModalBtn = document.getElementById('closeModal');
    const modalPlanBtn = document.getElementById('modalPlanBtn');

    if (closeModalBtn && modalBackdrop) {
        closeModalBtn.onclick = () => {
            modalBackdrop.style.display = 'none';
        };

        modalBackdrop.onclick = (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.style.display = 'none';
            }
        };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalBackdrop.style.display === 'flex') {
                modalBackdrop.style.display = 'none';
            }
        });
    }

    window.openModal = function(spotId) {
        let targetSpot = null;
        let targetRegion = null;

        for (const r of regions) {
            const found = r.spots.find(s => s.id === spotId);
            if (found) {
                targetSpot = found;
                targetRegion = r;
                break;
            }
        }

        if (!targetSpot || !targetRegion) return;

        const modalImg = document.getElementById('modalImg');
        const modalTitle = document.getElementById('modalTitle');
        const modalDesc = document.getElementById('modalDesc');
        const modalTime = document.getElementById('modalTime');
        const modalRules = document.getElementById('modalRules');
        const modalFood = document.getElementById('modalFood');
        const modalRegionTag = document.getElementById('modalRegionTag');
        const chkArea = document.getElementById('modalChecklistArea');
        const howToGet = document.getElementById('modalHowToGet');
        const estAdminFee = document.getElementById('modalEstAdminFee');
        const estGuideFee = document.getElementById('modalEstGuideFee');
        const shieldScamText = document.getElementById('shieldScamText');
        const shieldHazardText = document.getElementById('shieldHazardText');

        if (modalImg) modalImg.style.backgroundImage = `url(${targetSpot.image})`;
        if (modalTitle) modalTitle.textContent = targetSpot.name;
        if (modalDesc) modalDesc.textContent = targetSpot.description;
        if (modalTime) modalTime.textContent = targetSpot.bestTime || 'Year-round';
        if (modalRegionTag) modalRegionTag.textContent = targetRegion.name;

        if (modalRules) {
            const rules = targetSpot.rules && targetSpot.rules.length ? targetSpot.rules : ['Respect nature', 'Dispose waste properly'];
            modalRules.innerHTML = rules.map(r => `• ${r}`).join('<br>');
        }
        if (modalFood) {
            const foods = targetSpot.foods && targetSpot.foods.length ? targetSpot.foods : ['Local specialties', 'Seasonal fresh fruits'];
            modalFood.innerHTML = foods.map(f => `• ${f}`).join('<br>');
        }

        if (chkArea) {
            chkArea.innerHTML = '';
            const checklist = ['Local Cash (PHP bills in small denominations)', 'Waterproof Dry Bag', 'Reusable Water Flask'];
            const nameLower = targetSpot.name.toLowerCase();

            if (nameLower.includes('beach') || nameLower.includes('island') || nameLower.includes('reef') || nameLower.includes('falls') || nameLower.includes('river') || nameLower.includes('lake') || nameLower.includes('cove') || nameLower.includes('boracay') || nameLower.includes('elnido') || nameLower.includes('siargao')) {
                checklist.push('Reef-Safe Sunscreen (SPF 50+)', 'Quick-Dry Towel', 'Waterproof Phone Case');
            } else if (nameLower.includes('peak') || nameLower.includes('mountain') || nameLower.includes('volcano') || nameLower.includes('hills') || nameLower.includes('cave') || nameLower.includes('terraces') || nameLower.includes('pinatubo') || nameLower.includes('pulag') || nameLower.includes('apo')) {
                checklist.push('Sturdy Hiking Shoes / Boots', 'Lightweight Rain Poncho', 'Insect Repellent Spray');
            } else {
                checklist.push('Walking Sneakers', 'Sanitizer & Pocket Tissues', 'Secure Crossbody Sling Bag');
            }

            checklist.forEach((itemText, idx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'd-flex align-items-center gap-2 py-0.5';
                itemDiv.innerHTML = `
                    <input type="checkbox" id="chk_${idx}" class="form-check-input bg-transparent border-white-20 cursor-pointer" style="width: 15px; height: 15px; border-radius: 4px;" checked>
                    <label for="chk_${idx}" class="small text-dim cursor-pointer m-0" style="font-size: 0.72rem; line-height:1.2;">${itemText}</label>
                `;
                chkArea.appendChild(itemDiv);
            });
        }

        if (howToGet) {
            const rName = targetRegion.name;
            const sName = targetSpot.name.toLowerCase();
            let transit = '';

            if (rName === 'NCR') {
                transit = 'Take Manila LRT/MRT transit lines, Grab ride-hailing cars, or board traditional Jeepneys heading directly to the heritage compound gates.';
            } else if (rName === 'MIMAROPA' || rName === 'Western Visayas' || rName === 'Central Visayas' || rName === 'Eastern Visayas' || rName === 'Caraga Region' || sName.includes('island') || sName.includes('beach')) {
                transit = 'Fly to the nearest domestic airport, transfer via passenger van to the municipal ferry terminal, and board an accredited motorized outrigger banca.';
            } else if (rName === 'CAR' || sName.includes('mountain') || sName.includes('peak') || sName.includes('falls') || sName.includes('cave')) {
                transit = 'Take a long-haul Cordillera express sleeper bus, hire a local mountain multi-cab or tricycle, and coordinate with the Barangay tourism desk for guide assignment.';
            } else {
                transit = 'Book a provincial bus or local shuttle from the capital city center, hire an accredited tricycle, and register at the municipal visitor counter.';
            }
            howToGet.textContent = transit;
        }

        if (estAdminFee && estGuideFee) {
            const sNameLower = targetSpot.name.toLowerCase();
            if (sNameLower.includes('island') || sNameLower.includes('reef') || sNameLower.includes('dive') || sNameLower.includes('elnido') || sNameLower.includes('coron') || sNameLower.includes('siargao')) {
                estAdminFee.textContent = '₱200 - ₱400';
                estGuideFee.textContent = '₱1,200 - ₱2,500';
            } else if (sNameLower.includes('volcano') || sNameLower.includes('mountain') || sNameLower.includes('peak') || sNameLower.includes('pulag') || sNameLower.includes('apo')) {
                estAdminFee.textContent = '₱300 - ₱500';
                estGuideFee.textContent = '₱1,500 - ₱3,500';
            } else if (sNameLower.includes('falls') || sNameLower.includes('cave') || sNameLower.includes('lake') || sNameLower.includes('river')) {
                estAdminFee.textContent = '₱50 - ₱150';
                estGuideFee.textContent = '₱500 - ₱1,000';
            } else {
                estAdminFee.textContent = '₱0 - ₱100';
                estGuideFee.textContent = '₱300 - ₱800';
            }
        }

        if (shieldScamText && shieldHazardText) {
            const rName = targetRegion.name;
            const sNameLower = targetSpot.name.toLowerCase();

            let scam = 'Always check the local municipal fare matrix before boarding tricycles or taxis. Agree on prices beforehand.';
            let hazard = 'Cellular signal drops around remote caves and coves. Keep offline navigation cached.';

            if (sNameLower.includes('boracay') || sNameLower.includes('elnido') || sNameLower.includes('coron') || sNameLower.includes('siargao')) {
                scam = 'Avoid unregistered beach hustlers selling discounted boat tours or dive packages. Always book directly at the accredited Municipal Tourism Center.';
                hazard = 'Island ATMs occasionally run out of cash during holiday weekends. Keep sufficient PHP banknotes in a dry bag.';
            } else if (rName === 'NCR') {
                scam = 'Decline unmetered private airport cabs pitching inflated tourist fixed rates. Insist on meter activation or use Grab.';
                hazard = 'Expect heavy traffic congestion during peak commuting hours. Protect personal bags in crowded stations.';
            } else if (rName === 'CAR' || sNameLower.includes('mountain') || sNameLower.includes('pulag')) {
                scam = 'Hike exclusively with guides carrying verified DENR / municipal tourism badges. Refuse freelancers at bus drop-offs.';
                hazard = 'Summit temperatures can plunge below 5°C with rapid cloudbursts. Bring thermal layers and waterproof outerwear to prevent hypothermia.';
            }

            shieldScamText.textContent = scam;
            shieldHazardText.textContent = hazard;
        }

        if (modalPlanBtn) {
            modalPlanBtn.onclick = () => {
                modalBackdrop.style.display = 'none';
                if (typeof onOpenTripPlanner === 'function') {
                    onOpenTripPlanner(targetRegion.id);
                }
            };
        }

        modalBackdrop.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    };
}
