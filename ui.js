// ui.js - Native Game UI Integration
console.log("[DiploOS UI] Watching for settings menu...");

// Track the state of all extension features
const activeFeatures = {
    'diplo-os': false,
    'organize-company': false,
    'light-mode': false
};

// 🌟 Define all your extension features here! 🌟
const EXTENSION_FEATURES = [
    {
        id: 'diplo-os',
        label: 'Diplomacy Tactical OS',
        color: '#00d4ff',
        onToggle: (isActive) => {
            window.postMessage({ type: 'DIPLO_TOGGLE', active: isActive }, '*');
        }
    },
    {
        id: 'organize-company',
        label: 'Organize Company',
        color: '#00d4ff',
        onToggle: (isActive) => {
            window.postMessage({ type: 'ORGANIZE_COMPANY_TOGGLE', active: isActive }, '*');
        }
    },
    {
        id: 'light-mode',
        label: 'Light Mode',
        color: '#00d4ff',
        onToggle: (isActive) => {
            LightModeController.toggle(isActive);
        }
    }
    // Easily add future features here:
    // { id: 'auto-builder', label: 'Auto Builder Engine', color: '#ff5555', onToggle: (isActive) => { ... } }
];

// The exact SVG checkmark the game uses for its toggles
const checkmarkSVG = `
    <div class="_1dnmndyatq" style="transform: none;">
        <div class="a6izou0 _1dnmndy285">
            <svg class="mdi-icon " width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style="width: 1em; overflow: visible; height: 1em; font-size: 120%; filter: drop-shadow(black 1px 1px 0px);"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"></path></svg>
        </div>
    </div>`;

// Function to handle the visual checkmark turning on and off
function updateToggleVisuals(checkbox, isActive) {
    if (isActive) {
        checkbox.setAttribute('aria-checked', 'true');
        checkbox.setAttribute('data-headlessui-state', 'checked');
        checkbox.setAttribute('data-checked', '');
        checkbox.innerHTML = checkmarkSVG;
    } else {
        checkbox.setAttribute('aria-checked', 'false');
        checkbox.setAttribute('data-headlessui-state', '');
        checkbox.removeAttribute('data-checked');
        checkbox.innerHTML = ''; 
    }
}

// Function to inject our clones into the menu
function injectFeaturesIntoSettings() {
    // If we already injected our features, do nothing
    if (document.getElementById(`bettera-${EXTENSION_FEATURES[0].id}`)) return;

    // 1. Find the "Disable transparency" text in the menu
    const labels = Array.from(document.querySelectorAll('label span'));
    const targetSpan = labels.find(span => span.textContent.trim() === 'Disable transparency');

    if (!targetSpan) return; // Menu isn't open

    // 2. Grab the whole row container for that button
    const targetContainer = targetSpan.closest('label').parentElement.parentElement;
    let previousContainer = targetContainer;

    // 3. Loop through and inject all defined features
    EXTENSION_FEATURES.forEach(feature => {
        const newContainer = targetContainer.cloneNode(true);
        
        const checkbox = newContainer.querySelector('[role="checkbox"]');
        const label = newContainer.querySelector('label');
        const labelSpan = newContainer.querySelector('label span');
        
        const controlId = `bettera-${feature.id}`;
        checkbox.id = controlId;
        label.setAttribute('for', controlId);
        labelSpan.textContent = feature.label;
        if (feature.color) labelSpan.style.color = feature.color;
        
        updateToggleVisuals(checkbox, activeFeatures[feature.id]);

        const toggleWrapper = newContainer.children[0]; 
        toggleWrapper.style.cursor = 'pointer'; 
        
        toggleWrapper.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            activeFeatures[feature.id] = !activeFeatures[feature.id];
            updateToggleVisuals(checkbox, activeFeatures[feature.id]);

            // Dispatch the specific action for this feature
            feature.onToggle(activeFeatures[feature.id]);
        });

        // Insert directly below the previous option to stack them neatly
        previousContainer.insertAdjacentElement('afterend', newContainer);
        previousContainer = newContainer;
    });
}

// Set up a MutationObserver to watch the screen. 
// Every time a new HTML element appears (like a modal opening), we check if it's the settings menu.
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            injectFeaturesIntoSettings();
        }
    }
});

// Start watching the document body
observer.observe(document.body, { childList: true, subtree: true });

// Listen for errors from hook.js
window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
        case 'DIPLO_STATUS':
            if (!event.data.success && event.data.msg !== 'offline') {
                // Hook failed, turn the switch off automatically
                activeFeatures['diplo-os'] = false;
                const checkbox = document.getElementById('bettera-diplo-os');
                if (checkbox) updateToggleVisuals(checkbox, false);
            }
            break;
        case 'ORGANIZE_COMPANY_TOGGLE':
            if (event.data.active) {
                OrganizeCompanyController.enable();
            } else {
                OrganizeCompanyController.disable();
            }
            break;
    }
});

// --- Feature Controllers ---

const OrganizeCompanyController = {
    isActive: false,
    observer: null,
    draggedCard: null,
    isReordering: false,

    enable() {
        this.isActive = true;
        this.injectHandles();
        
        // Watch for React re-rendering the company list to keep our injected handles alive
        if (!this.observer) {
            this.observer = new MutationObserver(() => {
                if (this.isActive && !this.isReordering) this.injectHandles();
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
        }
        console.log("[OrganizeCompany] Activated.");
    },

    disable() {
        this.isActive = false;
        this.removeHandles();
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        console.log("[OrganizeCompany] Deactivated.");
    },

    applySavedOrder(container) {
        const saved = localStorage.getItem('bettera-company-order');
        if (!saved) return;
        
        this.isReordering = true;
        const order = JSON.parse(saved);
        const cards = Array.from(container.children);
        
        // Re-append nodes in the saved sequence
        order.forEach(id => {
            const targetCard = cards.find(card => {
                const link = card.querySelector('a[href^="/company/"]');
                return link && link.getAttribute('href').includes(id);
            });
            if (targetCard) {
                container.appendChild(targetCard);
            }
        });
        
        // Allow DOM to settle before letting the MutationObserver run freely again
        setTimeout(() => { this.isReordering = false; }, 50);
    },

    saveOrder(container) {
        const order = Array.from(container.children).map(card => {
            const link = card.querySelector('a[href^="/company/"]');
            return link ? link.getAttribute('href').split('/company/')[1] : null;
        }).filter(Boolean);
        localStorage.setItem('bettera-company-order', JSON.stringify(order));
    },

    injectHandles() {
        const buyButton = document.getElementById('buy-company-button');
        if (!buyButton) return;

        // Using the sibling relationship per your requirement
        const container = buyButton.previousElementSibling;
        if (!container) return;

        // Restore order if we haven't done it yet for this specific render cycle
        if (!container.dataset.ordered) {
            this.applySavedOrder(container);
            container.dataset.ordered = "true";
        }

        // Iterate through each company card in the grid
        Array.from(container.children).forEach(card => {
            const link = card.querySelector('a[href^="/company/"]');
            
            if (link && !card.querySelector('.bettera-drag-btn')) {
                // Automatically grab the company ID straight from the URL
                const companyId = link.getAttribute('href').split('/company/')[1];
                
                const dragBtn = document.createElement('div');
                dragBtn.className = 'bettera-drag-btn';
                dragBtn.innerHTML = '⋮⋮'; // Standard drag grip icon
                dragBtn.dataset.id = companyId; // Store ID on the element
                
                // Style to sit just outside the left edge of the company card
                Object.assign(dragBtn.style, {
                    cursor: 'grab',
                    padding: '5px',
                    fontSize: '20px',
                    color: '#00d4ff', // Match the glow aesthetic
                    position: 'absolute',
                    left: '-25px', 
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: '100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    userSelect: 'none'
                });

                card.style.position = 'relative'; // Required for absolute positioned child
                card.appendChild(dragBtn);

                // Only make the whole card draggable when mouse is down on the handle
                dragBtn.addEventListener('mousedown', () => { card.draggable = true; });
                dragBtn.addEventListener('mouseup', () => { card.draggable = false; });
                dragBtn.addEventListener('mouseleave', () => { card.draggable = false; });

                // Card Drag Logic
                card.addEventListener('dragstart', (e) => {
                    this.draggedCard = card;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', companyId);
                    setTimeout(() => card.style.opacity = '0.4', 0); // Hide original slightly
                });
                
                card.addEventListener('dragend', () => {
                    card.style.opacity = '1';
                    card.draggable = false;
                    this.draggedCard = null;
                    
                    // Save the new order whenever a drag finishes
                    this.saveOrder(container);
                });

                card.addEventListener('dragover', (e) => {
                    e.preventDefault(); // Necessary to allow dropping
                    if (!this.draggedCard || this.draggedCard === card) return;

                    // Determine mouse position relative to the element being hovered over
                    const rect = card.getBoundingClientRect();
                    const isAfter = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;

                    // Flag as reordering so MutationObserver doesn't create infinite loop
                    this.isReordering = true;
                    container.insertBefore(this.draggedCard, isAfter ? card.nextSibling : card);
                    
                    // Reset the flag safely in the next tick
                    setTimeout(() => { this.isReordering = false; }, 10);
                });
            }
        });
    },

    removeHandles() {
        document.querySelectorAll('.bettera-drag-btn').forEach(btn => {
            const card = btn.parentElement;
            if (card) card.draggable = false;
            btn.remove();
        });
        const buyButton = document.getElementById('buy-company-button');
        if (buyButton && buyButton.previousElementSibling) {
            delete buyButton.previousElementSibling.dataset.ordered;
        }
    }
};

const LightModeController = {
    styleId: 'global-light-mode-css',
    
    injectStyle() {
        if (!document.getElementById(this.styleId)) {
            const styleId = 'global-light-mode-css';
    
            const css = `
                /* 1. The Core Flip */
                html.master-light-mode {
                    filter: invert(1) hue-rotate(180deg) !important;
                    background-color: white !important;
                }

                /* 2. Media Correction */
                html.master-light-mode img, 
                html.master-light-mode video, 
                html.master-light-mode canvas,
                html.master-light-mode iframe,
                html.master-light-mode svg,
                html.master-light-mode [style*="background-image"],
                html.master-light-mode .maplibregl-canvas {
                    filter: invert(1) hue-rotate(180deg) !important;
                }

                /* 3. The "White Glow" Fix */
                html.master-light-mode * {
                    box-shadow: none !important;
                    text-shadow: none !important;
                }

                /* 4. The Map Gradient Fix (Targeting the exact inline div you found) */
                html.master-light-mode #map + div[style*="radial-gradient"],
                html.master-light-mode #map div[style*="radial-gradient"] {
                    background: none !important;
                    box-shadow: none !important;
                    opacity: 0 !important;
                }

                /* 5. Contrast Polish */
                html.master-light-mode body {
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                }


                /* 6. Force SVGs to un-invert AND adjust brightness safely */
                html.master-light-mode svg {
                    /* We combined them onto one line so they don't delete each other! */
                    /* You can tweak brightness(1) to 0.8 or 1.2 if you need them darker/lighter */
                    filter: invert(1) hue-rotate(180deg) brightness(1) !important; 
                }

                /* 7. Force Text to be darker, but EXCLUDE spans that contain images */
                html.master-light-mode span:not(:has(img)):not(:has(svg)) {
                    filter: brightness(2) !important; 
                }
                
                /* 8. Specific Checkbox SVG Brightness */
                html.master-light-mode div[role="checkbox"] svg {
                    /* invert the colour (white->black) */
                    filter: brightness(1) !important; 
                }
            `;

            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = css;
                document.head.appendChild(style);
            }
        }
    },

    toggle(isActive) {
        this.injectStyle();
        document.documentElement.classList.toggle('master-light-mode', isActive);
        const currentState = document.documentElement.classList.contains('master-light-mode');
        console.log(currentState ? "[LightMode] Light Mode Active" : "[LightMode] Dark Mode Active");
    }
};

// Load Local NAP Data and forward to hook.js
fetch(chrome.runtime.getURL('naps.json'))
    .then(response => response.json())
    .then(data => {
        console.log(`[DiploOS UI] Local NAP JSON loaded. Forwarding to engine...`);
        window.postMessage({ type: 'NAP_DATA_LOADED', payload: data }, '*');
    })
    .catch(err => console.error("[DiploOS UI] Failed to load local naps.json:", err));