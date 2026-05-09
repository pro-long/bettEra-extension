console.log("[bettEra diploUI] Initializing High-Performance Webpack Hook...");

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === ExtensionEvents.NAP_DATA_LOADED) {
        coreState.localNapStorage = event.data.payload;
        console.log(`[bettEra diploUI] Local NAP list secured for ${Object.keys(coreState.localNapStorage).length} countries.`);
    }
});

installFetchHook();
installWebpackHook();

window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;
    
    if (event.data.type === ExtensionEvents.DIPLO_TOGGLE) {
        const success = event.data.active ? DiplomacyController.enable() : DiplomacyController.disable();
        if (success) {
            const payload = event.data.active ? { success: true, zoom: Math.round(coreState.hookedMap.getZoom()) } : { success: false, msg: 'offline' };
            window.postMessage({ type: ExtensionEvents.DIPLO_STATUS, ...payload }, '*');
        } else window.postMessage({ type: ExtensionEvents.DIPLO_STATUS, success: false }, '*');
    }
});