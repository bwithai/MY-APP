/**
 * Enhanced Polyfills for legacy browsers
 * This file provides essential functionality for older browsers, particularly Firefox 50
 */

// Add window.CustomEvent support for IE
(function () {
    if (typeof window.CustomEvent === "function") return false;
    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    window.CustomEvent = CustomEvent;
})();

// Add Array.from polyfill
if (!Array.from) {
    Array.from = function(arrayLike) {
        return [].slice.call(arrayLike);
    };
}

// Add Object.assign polyfill for IE
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        if (target === null || target === undefined) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];
            if (nextSource !== null && nextSource !== undefined) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Add Element.closest polyfill
if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
        var el = this;
        while (el && el.nodeType === 1) {
            if (el.matches(selector)) {
                return el;
            }
            el = el.parentNode;
        }
        return null;
    };
}

// Add Element.matches polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector || 
        Element.prototype.oMatchesSelector || 
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;            
        };
}

// Add String.includes polyfill
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// Add Array.includes polyfill
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        var o = Object(this);
        var len = o.length >>> 0;
        if (len === 0) {
            return false;
        }
        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len + n, 0);
        while (k < len) {
            if (o[k] === searchElement) {
                return true;
            }
            k++;
        }
        return false;
    };
}

// Add Array.find polyfill
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        for (var i = 0; i < length; i++) {
            if (predicate.call(thisArg, list[i], i, list)) {
                return list[i];
            }
        }
        return undefined;
    };
}

// Add NodeList.forEach polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// Element.classList polyfill for IE9
// Source: https://gist.github.com/k-gun/c2ea7c49edf7b757fe9561ba37cb19ca
;(function() {
    // helpers
    var regExp = function(name) {
        return new RegExp('(^| )'+ name +'( |$)');
    };
    var forEach = function(list, fn, scope) {
        for (var i = 0; i < list.length; i++) {
            fn.call(scope, list[i]);
        }
    };

    // class list object with basic methods
    function ClassList(element) {
        this.element = element;
    }

    ClassList.prototype = {
        add: function() {
            forEach(arguments, function(name) {
                if (!this.contains(name)) {
                    this.element.className += ' ' + name;
                }
            }, this);
        },
        remove: function() {
            forEach(arguments, function(name) {
                this.element.className =
                    this.element.className.replace(regExp(name), ' ');
            }, this);
        },
        toggle: function(name) {
            return this.contains(name) 
                ? (this.remove(name), false) : (this.add(name), true);
        },
        contains: function(name) {
            return regExp(name).test(this.element.className);
        },
        // bonus..
        replace: function(oldName, newName) {
            this.remove(oldName), this.add(newName);
        }
    };

    // IE8/9, Safari
    if (!('classList' in Element.prototype)) {
        Object.defineProperty(Element.prototype, 'classList', {
            get: function() {
                return new ClassList(this);
            }
        });
    }

    // IE10/11
    if (window.DOMTokenList && DOMTokenList.prototype.replace == null) {
        DOMTokenList.prototype.replace = ClassList.prototype.replace;
    }
})();

// Event listener polyfill for IE8
if (!Element.prototype.addEventListener) {
    var eventListeners = [];
    
    var addEventListener = function(type, listener) {
        var self = this;
        var wrapper = function(e) {
            e.target = e.srcElement;
            e.currentTarget = self;
            if (typeof listener.handleEvent != 'undefined') {
                listener.handleEvent(e);
            } else {
                listener.call(self, e);
            }
        };
        this.attachEvent("on" + type, wrapper);
        eventListeners.push({
            object: this,
            type: type,
            listener: listener,
            wrapper: wrapper
        });
    };
    
    var removeEventListener = function(type, listener) {
        var counter = 0;
        var eventListener;
        while (counter < eventListeners.length) {
            eventListener = eventListeners[counter];
            if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
                this.detachEvent("on" + type, eventListener.wrapper);
                eventListeners.splice(counter, 1);
                break;
            }
            ++counter;
        }
    };
    
    Element.prototype.addEventListener = addEventListener;
    Element.prototype.removeEventListener = removeEventListener;
    
    if (HTMLDocument) {
        HTMLDocument.prototype.addEventListener = addEventListener;
        HTMLDocument.prototype.removeEventListener = removeEventListener;
    }
    
    if (Window) {
        Window.prototype.addEventListener = addEventListener;
        Window.prototype.removeEventListener = removeEventListener;
    }
}

// Object.keys polyfill
if (!Object.keys) {
    Object.keys = (function() {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [], prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}

// Array.prototype.forEach polyfill
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
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

// Array.prototype.indexOf polyfill
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);
        var len = O.length >>> 0;

        if (len === 0) {
            return -1;
        }

        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        if (n >= len) {
            return -1;
        }

        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        while (k < len) {
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// JSON polyfill for older browsers
if (!window.JSON) {
    window.JSON = {
        parse: function(sJSON) { return eval('(' + sJSON + ')'); },
        stringify: function(vContent) {
            if (vContent instanceof Object) {
                var sOutput = "";
                if (vContent.constructor === Array) {
                    for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
                    return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
                }
                if (vContent.toString !== Object.prototype.toString) {
                    return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\"";
                }
                for (var sProp in vContent) {
                    sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ",";
                }
                return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
            }
            return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
        }
    };
}

// localStorage polyfill
if (!window.localStorage) {
    window.localStorage = {
        _data: {},
        setItem: function(id, val) { return this._data[id] = String(val); },
        getItem: function(id) { return this._data.hasOwnProperty(id) ? this._data[id] : null; },
        removeItem: function(id) { return delete this._data[id]; },
        clear: function() { return this._data = {}; }
    };
}

// Console polyfill
(function() {
    if (!window.console) {
        window.console = {};
    }
    
    // Union of Chrome, FF, IE, and Safari console methods
    var methods = [
        "log", "info", "warn", "error", "debug", "trace", "dir", "group",
        "groupCollapsed", "groupEnd", "time", "timeEnd", "profile", "profileEnd",
        "dirxml", "assert", "count", "markTimeline", "timeStamp", "clear"
    ];
    
    // Define undefined methods as no-ops to prevent errors
    for (var i = 0; i < methods.length; i++) {
        if (!window.console[methods[i]]) {
            window.console[methods[i]] = function() {};
        }
    }
})();

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

// Promise polyfill (simplified version)
if (!window.Promise) {
    var Promise = function(executor) {
        // Basic Promise implementation
        var callbacks = [];
        var state = 'pending';
        var value;

        function resolve(result) {
            state = 'fulfilled';
            value = result;
            callbacks.forEach(function(callback) {
                callback(value);
            });
        }

        function reject(error) {
            state = 'rejected';
            value = error;
            callbacks.forEach(function(callback) {
                callback(value);
            });
        }

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }

        return {
            then: function(onFulfilled) {
                if (state === 'pending') {
                    callbacks.push(onFulfilled);
                } else {
                    onFulfilled(value);
                }
                return this;
            },
            catch: function(onRejected) {
                return this.then(function(value) {
                    onRejected(value);
                });
            }
        };
    };
    
    // Add static methods to Promise
    Promise.resolve = function(value) {
        return new Promise(function(resolve) {
            resolve(value);
        });
    };
    
    Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
            reject(reason);
        });
    };
    
    window.Promise = Promise;
}

// Array.from polyfill
if (!Array.from) {
    Array.from = function(arrayLike) {
        return Array.prototype.slice.call(arrayLike);
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

// Object.entries polyfill
if (!Object.entries) {
    Object.entries = function(obj) {
        var ownProps = Object.keys(obj),
            i = ownProps.length,
            resArray = new Array(i);
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        return resArray;
    };
}

// Object.fromEntries polyfill
if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
        if (!entries || !entries[Symbol.iterator]) { throw new Error('Object.fromEntries() requires a single iterable argument'); }
        var obj = {};
        for (var entry of entries) {
            if (Object(entry) !== entry) { throw new TypeError('Each entry must be an object'); }
            if (!Array.isArray(entry)) { throw new TypeError('Each entry must be an array'); }
            if (entry.length !== 2) { throw new TypeError('Each entry must be a [key, value] array'); }
            obj[entry[0]] = entry[1];
        }
        return obj;
    };
}

// Add these to your existing polyfills
(function() {
    // Array.from polyfill
    if (!Array.from) {
        Array.from = function(arrayLike) {
            return [].slice.call(arrayLike);
        };
    }

    // Object.assign polyfill
    if (!Object.assign) {
        Object.assign = function(target) {
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource != null) {
                    for (var nextKey in nextSource) {
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }

    // Promise polyfill (simplified version)
    if (!window.Promise) {
        window.Promise = function(executor) {
            // Basic Promise implementation
            var callbacks = [];
            var state = 'pending';
            var value;

            function resolve(result) {
                state = 'fulfilled';
                value = result;
                callbacks.forEach(function(callback) {
                    callback(value);
                });
            }

            function reject(error) {
                state = 'rejected';
                value = error;
                callbacks.forEach(function(callback) {
                    callback(value);
                });
            }

            try {
                executor(resolve, reject);
            } catch (error) {
                reject(error);
            }

            return {
                then: function(onFulfilled) {
                    if (state === 'pending') {
                        callbacks.push(onFulfilled);
                    } else {
                        onFulfilled(value);
                    }
                    return this;
                },
                catch: function(onRejected) {
                    return this.then(function(value) {
                        onRejected(value);
                    });
                }
            };
        };
    }
})(); 

// Polyfills for old browsers like Firefox 50

// Element.remove() polyfill
(function() {
  if (!Element.prototype.remove) {
    Element.prototype.remove = function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }
})();

// String.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];

      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Promise.finally polyfill
if (!Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    var P = this.constructor;
    return this.then(
      function(value) {
        return P.resolve(callback()).then(function() {
          return value;
        });
      },
      function(reason) {
        return P.resolve(callback()).then(function() {
          throw reason;
        });
      }
    );
  };
}

// NodeList.forEach polyfill
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function(callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Error handling utility to make debugging easier
window.handleError = function(error, source) {
  console.error('Error in ' + (source || 'unknown') + ':', error);
  if (typeof error === 'string') {
    alert('Error: ' + error);
  } else if (error && error.message) {
    alert('Error: ' + error.message);
  } else {
    alert('An unknown error occurred');
  }
};

console.log('Polyfills loaded for better browser compatibility'); 