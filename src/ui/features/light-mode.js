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

                /* 4. The Map Gradient Fix */
                html.master-light-mode #map + div[style*="radial-gradient"],
                html.master-light-mode #map div[style*="radial-gradient"] {
                    background: none !important;
                    box-shadow: none !important;
                    opacity: 0 !important;
                }

                /* 5. Contrast Polish */
                html.master-light-mode body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
                
                /* 6. Force SVGs to un-invert AND adjust brightness safely */
                html.master-light-mode svg { filter: invert(1) hue-rotate(180deg) brightness(1) !important; }

                /* 7. Force Text to be darker, but EXCLUDE spans that contain images */
                html.master-light-mode span:not(:has(img)):not(:has(svg)) { filter: brightness(2) !important; }
                
                /* 8. Specific Checkbox SVG Brightness */
                html.master-light-mode div[role="checkbox"] svg { filter: brightness(1) !important; }
            `;

            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = css;
            document.head.appendChild(style);
        }
    },

    toggle(isActive) {
        this.injectStyle();
        document.documentElement.classList.toggle('master-light-mode', isActive);
    }
};