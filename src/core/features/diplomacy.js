const DiplomacyController = {
    TARGET_LAYERS: ['country-fill', 'region-fill', 'inner-country-fill'],
    activeHandler: null,

    enable() {
        if (!coreState.hookedMap) return false;

        this.TARGET_LAYERS.forEach(layerId => {
            const origLayer = coreState.hookedMap.getLayer(layerId);
            if (origLayer) {
                const ghostId = `diplo-${layerId}`;
                
                if (!coreState.hookedMap.getLayer(ghostId)) {
                    const style = coreState.hookedMap.getStyle();
                    const layerIndex = style.layers.findIndex(l => l.id === layerId);
                    let insertBeforeId = undefined;
                    if (layerIndex !== -1 && layerIndex + 1 < style.layers.length) insertBeforeId = style.layers[layerIndex + 1].id;

                    coreState.hookedMap.addLayer({
                        id: ghostId, type: origLayer.type, source: origLayer.source,
                        'source-layer': origLayer.sourceLayer, paint: { 'fill-color': '#1a1a1a', 'fill-opacity': 1 }
                    }, insertBeforeId);
                } else {
                    coreState.hookedMap.setLayoutProperty(ghostId, 'visibility', 'visible');
                    coreState.hookedMap.setPaintProperty(ghostId, 'fill-color', '#1a1a1a');
                }
            }
        });

        this.activeHandler = this.handleClick.bind(this);
        coreState.hookedMap.on('click', 'country-fill', this.activeHandler);
        return true;
    },

    disable() {
        if (!coreState.hookedMap) return false;
        this.TARGET_LAYERS.forEach(layer => { const ghostId = `diplo-${layer}`; if (coreState.hookedMap.getLayer(ghostId)) coreState.hookedMap.setLayoutProperty(ghostId, 'visibility', 'none'); });
        if (this.activeHandler) { coreState.hookedMap.off('click', 'country-fill', this.activeHandler); this.activeHandler = null; }
        return true;
    },

    handleClick(e) {
        if (!e.features || !e.features.length) return;
        const props = e.features[0].properties;
        const clickedId = props.countryId || props.initialCountryId || props.id; 
        if (!clickedId) return;

        const diploInfo = coreState.globalCountryData[clickedId] || { allies: [], enemies: [], battles: [] };
        const colorExpression = [ 'match', ['coalesce', ['get', 'countryId'], ['get', 'initialCountryId'], ['get', 'id']] ];
        const processedIds = new Set();

        colorExpression.push(clickedId, '#f1c40f'); processedIds.add(clickedId);
        if (diploInfo.battles.length > 0) diploInfo.battles.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#e67e22'); processedIds.add(id); } });
        if (diploInfo.enemies.length > 0) diploInfo.enemies.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#e74c3c'); processedIds.add(id); } });
        if (diploInfo.allies.length > 0) diploInfo.allies.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#3498db'); processedIds.add(id); } });
        if (diploInfo.naps && diploInfo.naps.length > 0) diploInfo.naps.forEach(id => { if (!processedIds.has(id)) { colorExpression.push(id, '#9b59b6'); processedIds.add(id); } });
        colorExpression.push('#1a1a1a'); 

        this.TARGET_LAYERS.forEach(layer => { const ghostId = `diplo-${layer}`; if (coreState.hookedMap.getLayer(ghostId)) coreState.hookedMap.setPaintProperty(ghostId, 'fill-color', colorExpression); });
    }
};