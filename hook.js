// hook.js - Data-Driven Diplomacy OS (Ghost Layer Edition)
console.log("[DiploOS] Initializing High-Performance Webpack Hook...");

let hookedMap = null;

let globalCountryData = {}; // Global storage for the API data
let localNapStorage = {}; // Holds the data passed from ui.js

// 0. Catch NAP data from ui.js
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NAP_DATA_LOADED') {
        localNapStorage = event.data.payload;
        console.log(`[DiploOS] Intelligence: Local NAP list secured for ${Object.keys(localNapStorage).length} countries.`);
    }
});


// 1. DATA INTERCEPTION LOGIC (Passive Hook)
const originalFetch = window.fetch;

window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    try {
        const requestUrl = (typeof args[0] === 'string') ? args[0] : (args[0] instanceof Request ? args[0].url : '');
        
        if (requestUrl.includes('country.getAllCountries')) {
            console.log("[DiploOS] Intercepted country data stream! Analyzing payload...");
            
            const clone = response.clone();
            
            clone.json().then(data => {
                // 1. SMART BATCH PARSING
                const urlPath = requestUrl.split('/trpc/')[1]?.split('?')[0] || '';
                const endpoints = urlPath.split(',');
                const targetIndex = endpoints.indexOf('country.getAllCountries');

                if (targetIndex === -1) return; // Failsafe

                // 2. Grab exact data object
                let targetData = data[targetIndex]?.result?.data;

                // 3. Unwrap tRPC json formatting
                if (targetData && targetData.json) {
                    targetData = targetData.json;
                }

                // 4. Ensure array
                let countriesArray = [];
                if (Array.isArray(targetData)) {
                    countriesArray = targetData; 
                } else if (targetData && typeof targetData === 'object') {
                    countriesArray = Object.values(targetData);
                }

                if (countriesArray.length === 0) {
                    console.warn("[DiploOS] Target index found, but data is empty. Raw slice:", targetData);
                    return; 
                }

                // 5. Map into fast-lookup dictionary
                globalCountryData = {};
                countriesArray.forEach(country => {
                    if (!country || !country._id) return; 
                    
                    globalCountryData[country._id] = {
                        allies: country.allies || [],       // Blue
                        enemies: country.warsWith || [],    // Red
                        battles: country.enemy ? [country.enemy] : [], // Orange
                        naps: localNapStorage[country._id] || []
                    };
                });
                
                console.log(`[DiploOS] Intelligence silently gathered for ${Object.keys(globalCountryData).length} countries from batch index [${targetIndex}]!`);
            }).catch(err => console.error("[DiploOS] Error parsing intercepted JSON:", err));
        }
    } catch(e) {
        console.error("[DiploOS] Fetch intercept error:", e);
    }
    
    return response;
};

// 2. THE OPTIMIZED WEBPACK INTERCEPT
function installWebpackHook() {
    let _webpackChunk = [];

    Object.defineProperty(window, 'webpackChunk_N_E', {
        get: () => _webpackChunk,
        set: (newVal) => {
            _webpackChunk = newVal;
            const originalPush = _webpackChunk.push;
            
            _webpackChunk.push = function(chunkArray) {
                try {
                    const modules = chunkArray[1]; 
                    if (modules) {
                        for (let moduleId in modules) {
                            const origModule = modules[moduleId];

                            modules[moduleId] = function(module, exports, __webpack_require__) {
                                origModule.call(this, module, exports, __webpack_require__);

                                let targetObj = exports.default?.Map ? exports.default : module.exports;

                                if (targetObj && targetObj.Map && targetObj.Map.prototype && targetObj.Map.prototype.getLayer) {
                                    if (targetObj.Map.__isHooked) return;

                                    console.log("[DiploOS] SUCCESS: Map Engine caught!");
                                    const OriginalMap = targetObj.Map;
                                    
                                    targetObj.Map = function(...args) {
                                        const mapInstance = new OriginalMap(...args);
                                        hookedMap = mapInstance; 
                                        return mapInstance;
                                    };
                                    
                                    targetObj.Map.prototype = OriginalMap.prototype;
                                    targetObj.Map.__isHooked = true;
                                }
                            };
                        }
                    }
                } catch (e) {
                    console.error("[DiploOS] Hook error:", e);
                }
                return originalPush.apply(this, arguments);
            };
        },
        configurable: true
    });
}

installWebpackHook();


// 3. FEATURE CONTROLLERS
// Wrap features in objects so logic is encapsulated
const DiplomacyController = {
    TARGET_LAYERS: ['country-fill', 'region-fill', 'inner-country-fill'],
    activeHandler: null,

    enable() {
        if (!hookedMap) return false;
        console.log("[DiploOS] Activating Tactical Ghost Layers...");

        this.TARGET_LAYERS.forEach(layerId => {
            const origLayer = hookedMap.getLayer(layerId);
            if (origLayer) {
                const ghostId = `diplo-${layerId}`;
                
                if (!hookedMap.getLayer(ghostId)) {
                    const style = hookedMap.getStyle();
                    const layerIndex = style.layers.findIndex(l => l.id === layerId);
                    let insertBeforeId = undefined;
                    if (layerIndex !== -1 && layerIndex + 1 < style.layers.length) {
                        insertBeforeId = style.layers[layerIndex + 1].id;
                    }

                    hookedMap.addLayer({
                        id: ghostId,
                        type: origLayer.type,
                        source: origLayer.source,
                        'source-layer': origLayer.sourceLayer,
                        paint: { 'fill-color': '#1a1a1a', 'fill-opacity': 1 }
                    }, insertBeforeId);
                } else {
                    hookedMap.setLayoutProperty(ghostId, 'visibility', 'visible');
                    hookedMap.setPaintProperty(ghostId, 'fill-color', '#1a1a1a');
                }
            }
        });

        this.activeHandler = this.handleClick.bind(this);
        hookedMap.on('click', 'country-fill', this.activeHandler);
        return true;
    },

    disable() {
        if (!hookedMap) return false;
        console.log("[DiploOS] Restoring Original View (Hiding Ghosts)...");
        
        this.TARGET_LAYERS.forEach(layer => {
            const ghostId = `diplo-${layer}`;
            if (hookedMap.getLayer(ghostId)) {
                hookedMap.setLayoutProperty(ghostId, 'visibility', 'none');
            }
        });

        if (this.activeHandler) {
            hookedMap.off('click', 'country-fill', this.activeHandler);
            this.activeHandler = null;
        }
        return true;
    },

    handleClick(e) {
        if (!e.features || !e.features.length) return;

        const props = e.features[0].properties;
        const clickedId = props.countryId || props.initialCountryId || props.id; 
        if (!clickedId) return;

        const diploInfo = globalCountryData[clickedId] || { allies: [], enemies: [], battles: [] };

        const colorExpression = [
            'match',
            ['coalesce', ['get', 'countryId'], ['get', 'initialCountryId'], ['get', 'id']]
        ];

        const processedIds = new Set();

        // Priorities: 1. Target, 2. Battles, 3. Enemies, 4. Allies, 5. NAPs
        colorExpression.push(clickedId, '#f1c40f');
        processedIds.add(clickedId);

        if (diploInfo.battles.length > 0) diploInfo.battles.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#e67e22'); processedIds.add(id); } });
        if (diploInfo.enemies.length > 0) diploInfo.enemies.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#e74c3c'); processedIds.add(id); } });
        if (diploInfo.allies.length > 0) diploInfo.allies.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#3498db'); processedIds.add(id); } });
        if (diploInfo.naps && diploInfo.naps.length > 0) diploInfo.naps.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#9b59b6'); processedIds.add(id); } });

        colorExpression.push('#1a1a1a'); 

        this.TARGET_LAYERS.forEach(layer => {
            const ghostId = `diplo-${layer}`;
            if (hookedMap.getLayer(ghostId)) {
                hookedMap.setPaintProperty(ghostId, 'fill-color', colorExpression);
            }
        });
    }
};

// 4. EVENT ROUTER (Message Bus)
window.addEventListener('message', (event) => {
    if (!event.data || !event.data.type) return;

    switch (event.data.type) {
        case 'DIPLO_TOGGLE': {
            const success = event.data.active ? DiplomacyController.enable() : DiplomacyController.disable();
            if (success) {
                const payload = event.data.active ? { success: true, zoom: Math.round(hookedMap.getZoom()) } : { success: false, msg: 'offline' };
                window.postMessage({ type: 'DIPLO_STATUS', ...payload }, '*');
            } else {
                window.postMessage({ type: 'DIPLO_STATUS', success: false }, '*');
            }
            break;
        }
        // Easily handle future events here!
        // case 'AUTO_BUILD_TOGGLE':
        //     AutoBuildController.toggle(event.data.active);
        //     break;
    }
});