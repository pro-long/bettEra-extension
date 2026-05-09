const activeFeatures = {
    'diplo-os': false,
    'organize-company': false,
    'light-mode': false
};

const checkmarkSVG = `
    <div class="_1dnmndyatq" style="transform: none;">
        <div class="a6izou0 _1dnmndy285">
            <svg class="mdi-icon " width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style="width: 1em; overflow: visible; height: 1em; font-size: 120%; filter: drop-shadow(black 1px 1px 0px);"><path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"></path></svg>
        </div>
    </div>`;

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

function injectFeaturesIntoSettings() {
    if (document.getElementById(`bettera-${EXTENSION_FEATURES[0].id}`)) return;

    const labels = Array.from(document.querySelectorAll('label span'));
    const targetSpan = labels.find(span => disableTransparencyLabels.includes(span.textContent.trim()));

    if (!targetSpan) return;

    const targetContainer = targetSpan.closest('label').parentElement.parentElement;
    let previousContainer = targetContainer;

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
            feature.onToggle(activeFeatures[feature.id]);
        });

        previousContainer.insertAdjacentElement('afterend', newContainer);
        previousContainer = newContainer;
    });
}