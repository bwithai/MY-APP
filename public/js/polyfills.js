// Array forEach polyfill
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        if (this == null) {
            throw new TypeError('Array.prototype.forEach called on null or undefined');
        }
        var T, k;
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}

// Promise polyfill
if (!window.Promise) {
    window.Promise = function(executor) {
        var callbacks = [];
        var value;
        var state = 'pending';

        function resolve(val) {
            if (state !== 'pending') return;
            state = 'fulfilled';
            value = val;
            callbacks.forEach(function(callback) {
                setTimeout(function() {
                    callback(value);
                }, 0);
            });
        }

        function reject(error) {
            if (state !== 'pending') return;
            state = 'rejected';
            value = error;
            callbacks.forEach(function(callback) {
                setTimeout(function() {
                    callback(value);
                }, 0);
            });
        }

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }

        return {
            then: function(callback) {
                if (state === 'pending') {
                    callbacks.push(callback);
                } else {
                    setTimeout(function() {
                        callback(value);
                    }, 0);
                }
                return this;
            }
        };
    };
}

// Array.from polyfill
if (!Array.from) {
    Array.from = function(arrayLike) {
        return Array.prototype.slice.call(arrayLike);
    };
}

// Object.assign polyfill
if (!Object.assign) {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
    String.prototype.includes = function(search) {
        return this.indexOf(search) !== -1;
    };
}

// Array.prototype.find polyfill
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];

        for (var i = 0; i < length; i++) {
            var value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// forEach polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Add this to your existing polyfills.js
document.addEventListener('DOMContentLoaded', function() {
    // Handle form validation states
    document.querySelectorAll('.form-control').forEach(function(input) {
        input.addEventListener('invalid', function() {
            var inputGroup = this.closest('.input-group');
            if (inputGroup) {
                inputGroup.classList.add('has-error');
            }
        });
        
        input.addEventListener('input', function() {
            var inputGroup = this.closest('.input-group');
            if (inputGroup) {
                inputGroup.classList.remove('has-error');
            }
        });
    });
});

// Optional chaining (?.) polyfill
if (!Object.prototype.optionalChain) {
    Object.prototype.optionalChain = function(key) {
        return this == null ? undefined : this[key];
    };
}

// Function to safely access nested properties
window.safeAccess = function(obj, path) {
    return path.split('.').reduce(function(acc, part) {
        return acc && acc[part] ? acc[part] : undefined;
    }, obj);
};

// Replace ?. usage with safe access
// Instead of: obj?.prop?.method?.()
// Use: safeAccess(obj, 'prop.method')

// Replace arrow functions with regular functions
// Instead of: (mod) => deps?.(mod)
// Use: function(mod) { return deps && deps(mod); } 