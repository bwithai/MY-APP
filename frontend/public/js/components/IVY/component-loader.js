/**
 * Component Loader Utility
 * This script helps diagnose component loading issues
 * ES5 compatible version
 */

(function() {
    // Check which components are loaded
    var checkComponents = function() {
        var components = [
            'SettingsIVY',
            'HeadsManagement',
            'ActionsMenu',
            'UserInformation',
            'ChangePassword'
        ];
        
        var results = {};
        
        for (var i = 0; i < components.length; i++) {
            var name = components[i];
            results[name] = {
                loaded: typeof window[name] !== 'undefined',
                type: typeof window[name]
            };
        }
        
        console.log('Component loading status:', results);
        return results;
    };
    
    // Check script loading status
    var checkScripts = function() {
        var scripts = document.querySelectorAll('script');
        var scriptsSrc = [];
        
        for (var i = 0; i < scripts.length; i++) {
            scriptsSrc.push(scripts[i].src);
        }
        
        var ivyScripts = [];
        for (var j = 0; j < scriptsSrc.length; j++) {
            if (scriptsSrc[j].indexOf('IVY') !== -1) {
                ivyScripts.push(scriptsSrc[j]);
            }
        }
        
        console.log('IVY scripts loaded:', ivyScripts);
        return ivyScripts;
    };
    
    // Make utilities available globally
    window.ComponentDebug = {
        checkComponents: checkComponents,
        checkScripts: checkScripts
    };
    
    // Run checks on load
    console.log('Component loader debug utility initialized');
    setTimeout(checkComponents, 500);  // Allow time for components to load
    checkScripts();
})(); 