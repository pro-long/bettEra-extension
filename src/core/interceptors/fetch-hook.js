function installFetchHook() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        try {
            const requestUrl = (typeof args[0] === 'string') ? args[0] : (args[0] instanceof Request ? args[0].url : '');
            
            if (requestUrl.includes('country.getAllCountries')) {
                console.log("[DiploOS] Intercepted country data stream! Analyzing payload...");
                const clone = response.clone();
                
                clone.json().then(data => {
                    const urlPath = requestUrl.split('/trpc/')[1]?.split('?')[0] || '';
                    const endpoints = urlPath.split(',');
                    const targetIndex = endpoints.indexOf('country.getAllCountries');

                    if (targetIndex === -1) return; 
                    let targetData = data[targetIndex]?.result?.data;
                    if (targetData && targetData.json) targetData = targetData.json;

                    let countriesArray = [];
                    if (Array.isArray(targetData)) {
                        countriesArray = targetData; 
                    } else if (targetData && typeof targetData === 'object') {
                        countriesArray = Object.values(targetData);
                    }
                    if (countriesArray.length === 0) return; 

                    coreState.globalCountryData = {};
                    countriesArray.forEach(country => {
                        if (!country || !country._id) return; 
                        coreState.globalCountryData[country._id] = {
                            allies: country.allies || [],       
                            enemies: country.warsWith || [],    
                            battles: country.enemy ? [country.enemy] : [], 
                            naps: coreState.localNapStorage[country._id] || []
                        };
                    });
                }).catch(err => console.error("[DiploOS] Error parsing intercepted JSON:", err));
            }
        } catch(e) { }
        return response;
    };
}