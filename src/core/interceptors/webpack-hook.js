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
                                    const OriginalMap = targetObj.Map;
                                    targetObj.Map = function(...args) { const mapInstance = new OriginalMap(...args); coreState.hookedMap = mapInstance; return mapInstance; };
                                    targetObj.Map.prototype = OriginalMap.prototype;
                                    targetObj.Map.__isHooked = true;
                                }
                            };
                        }
                    }
                } catch (e) { }
                return originalPush.apply(this, arguments);
            };
        }, configurable: true });
}