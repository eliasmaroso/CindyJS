var CindyJS = (function() {
            "use strict";

            var debugStartup = false;

            var waitCount = -1;

            var toStart = [];

            // waitFor returns a callback which will decrement the waitCount
            function waitFor(name) {
                if (waitCount === 0) {
                    console.error("Waiting for " + name + " after we finished waiting.");
                    return function() {};
                }
                if (waitCount < 0)
                    waitCount = 0;
                if (debugStartup)
                    console.log("Start waiting for " + name);
                ++waitCount;
                return function() {
                    if (debugStartup)
                        console.log("Done waiting for " + name);
                    --waitCount;
                    if (waitCount < 0) {
                        console.error("Wait count mismatch: " + name);
                    }
                    if (waitCount === 0) {
                        var i = 0,
                            n = toStart.length;
                        if (debugStartup)
                            console.log("Done waiting, starting " + n + " instances:");
                        while (i < n)
                            toStart[i++].startup();
                    }
                };
            }

            if (typeof document !== "undefined" && typeof window !== "undefined" &&
                typeof document.addEventListener !== "undefined" &&
                (typeof window.cindyDontWait === "undefined" ||
                    window.cindyDontWait !== true)) {
                document.addEventListener("DOMContentLoaded", waitFor("DOMContentLoaded"));
            }

            function CindyJS(data) {
                var instance = CindyJS.newInstance(data);
                if (waitCount <= 0) instance.startup();
                else if (data.autostart !== false) toStart.push(instance);
                return instance;
            }

            var baseDir = null;
            var cindyJsScriptElement = null;
            var waitingForLoad = {};

            CindyJS.getBaseDir = function() {
                if (baseDir !== null)
                    return baseDir;
                var scripts = document.getElementsByTagName("script");
                for (var i = 0; i < scripts.length; ++i) {
                    var script = scripts[i];
                    var src = script.src;
                    if (!src) continue;
                    var match = /Cindy\.js$/.exec(src);
                    if (match) {
                        baseDir = src.substr(0, match.index);
                        console.log("Will load extensions from " + baseDir);
                        cindyJsScriptElement = script;
                        return baseDir;
                    }
                }
                console.error("Could not find <script> tag for Cindy.js");
                baseDir = cindyJsScriptElement = false;
                return baseDir;
            };

            CindyJS.addNewScript = function(path, onerror) {
                if (!onerror) onerror = console.error.bind(console);
                var baseDir = CindyJS.getBaseDir();
                if (baseDir === false) {
                    return false;
                }
                var elt = document.createElement("script");
                elt.src = baseDir + path;
                var next = cindyJsScriptElement.nextSibling;
                var parent = cindyJsScriptElement.parentElement;
                if (next)
                    parent.insertBefore(elt, next);
                else
                    parent.appendChild(elt);
                return elt;
            };

            CindyJS.loadScript = function(name, path, onload, onerror) {
                if (window[name]) {
                    onload();
                    return true;
                }
                if (!onerror) onerror = console.error.bind(console);
                var elt = waitingForLoad[name];
                if (!elt) {
                    elt = CindyJS.addNewScript(path, onerror);
                    if (elt === false) {
                        onerror("Can't load additional components.");
                        return false;
                    }
                    waitingForLoad[name] = elt;
                }
                elt.addEventListener("load", onload);
                elt.addEventListener("error", onerror);
                return null;
            };

            CindyJS._autoLoadingPlugin = {};

            CindyJS.autoLoadPlugin = function(name, path, onload) {
                if (CindyJS._pluginRegistry[name]) {
                    onload();
                    return true;
                }
                var listeners = CindyJS._autoLoadingPlugin[name];
                if (!listeners) {
                    if (!path) path = name + "-plugin.js";
                    listeners = CindyJS._autoLoadingPlugin[name] = [];
                    var elt = CindyJS.addNewScript(path);
                    if (elt === false) {
                        return false;
                    }
                    elt.addEventListener("error", console.error.bind(console));
                }
                listeners.push(onload);
                return null;
            };

            var nada = {
                ctype: 'undefined'
            };

            CindyJS.waitFor = waitFor;
            CindyJS._pluginRegistry = {};
            CindyJS.instances = [];
            CindyJS.registerPlugin = function(apiVersion, pluginName, initCallback) {
                if (apiVersion !== 1) {
                    console.error("Plugin API version " + apiVersion + " not supported");
                    return false;
                }
                CindyJS._pluginRegistry[pluginName] = initCallback;
                var listeners = CindyJS._autoLoadingPlugin[pluginName] || [];
                listeners.forEach(function(callback) {
                    callback();
                });
            };
            CindyJS.dumpState = function(index) {
                // Call this if you find a rendering bug you'd like to reproduce.
                // The save the printed JSON to a file and include it in your report.
                var state = CindyJS.instances[index || 0].saveState();
                console.log(JSON.stringify(state));
            };
            CindyJS.newInstance = function(instanceInvocationArguments) {
