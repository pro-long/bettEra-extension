console.log("[bettEra] Watching for settings menu...");

const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            injectFeaturesIntoSettings();
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
        case ExtensionEvents.DIPLO_STATUS:
            if (!event.data.success && event.data.msg !== 'offline') {
                activeFeatures['diplo-os'] = false;
                const checkbox = document.getElementById('bettera-diplo-os');
                if (checkbox) updateToggleVisuals(checkbox, false);
            }
            break;
        case ExtensionEvents.ORGANIZE_COMPANY_TOGGLE:
            if (event.data.active) OrganizeCompanyController.enable();
            else OrganizeCompanyController.disable();
            break;
    }
});

fetch(chrome.runtime.getURL('data/naps.json'))
    .then(response => response.json())
    .then(data => {
        console.log(`[bettEra diploUI] Local NAP JSON loaded. Forwarding to engine...`);
        window.postMessage({ type: ExtensionEvents.NAP_DATA_LOADED, payload: data }, '*');
    })
    .catch(err => console.error("[bettEra diploUI] Failed to load local naps.json:", err));
