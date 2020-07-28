(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PDFoundry = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./Util");
const Viewer_1 = require("./viewer/Viewer");
const Settings_1 = require("./settings/Settings");
const PDFCache_1 = require("./cache/PDFCache");
/**
 * Open the specified PDF in a provided viewer
 * @param viewer
 * @param url
 * @param page
 * @param cache
 * @private
 */
function _handleOpen(viewer, url, page, cache) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cache) {
            const cachedBytes = yield PDFCache_1.default.getCache(url);
            // If we have a cache hit open the cached data
            if (cachedBytes) {
                yield viewer.open(cachedBytes, page);
            }
            else {
                // Otherwise we should open it by url
                yield viewer.open(url, page);
                // And when the download is complete set the cache
                viewer.download().then((bytes) => {
                    PDFCache_1.default.setCache(url, bytes);
                });
            }
        }
        else {
            yield viewer.open(url, page);
        }
    });
}
/**
 * The PDFoundry API
 *
 * ## You can access the API with `ui.PDFoundry`.
 */
class Api {
    // <editor-fold desc="GetPDFData Methods">
    /**
     * Helper method. Alias for {@link Api.getPDFData} with a comparer that searches by PDF Code.
     * @param code Which code to search for a PDF with.
     * @category PDFData
     */
    static getPDFDataByCode(code) {
        return Api.getPDFData((item) => {
            return item.data.data.code === code;
        });
    }
    /**
     * Helper method. Alias for {@link Api.getPDFData} with a comparer that searches by PDF Name.
     * @param name Which name to search for a PDF with.
     * @param caseInsensitive If a case insensitive search should be done.
     * @category PDFData
     */
    static getPDFDataByName(name, caseInsensitive = true) {
        if (caseInsensitive) {
            return Api.getPDFData((item) => {
                return item.name.toLowerCase() === name.toLowerCase();
            });
        }
        else {
            return Api.getPDFData((item) => {
                return item.name === name;
            });
        }
    }
    /**
     * Finds a PDF entity created by the user and constructs a {@link PDFData} object of the resulting PDF's data.
     * @param comparer A comparison function that will be used.
     * @param allowInvisible If true, PDFs hidden from the active user will be returned.
     * @category PDFData
     */
    static getPDFData(comparer, allowInvisible = true) {
        const pdf = game.items.find((item) => {
            return item.type === Settings_1.default.PDF_ENTITY_TYPE && (item.visible || allowInvisible) && comparer(item);
        });
        return Util_1.getPDFDataFromItem(pdf);
    }
    // </editor-fold>
    // <editor-fold desc="OpenPDF Methods">
    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    static openPDFByCode(code, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdf = this.getPDFDataByCode(code);
            if (pdf === null) {
                const error = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithCode');
                if (Settings_1.default.NOTIFICATIONS) {
                    ui.notifications.error(error);
                }
                return Promise.reject(error);
            }
            return this.openPDF(pdf, page);
        });
    }
    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    static openPDFByName(name, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdf = this.getPDFDataByName(name);
            if (pdf === null) {
                const message = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithName');
                const error = new Error(message);
                if (Settings_1.default.NOTIFICATIONS) {
                    ui.notifications.error(error.message);
                }
                return Promise.reject(error);
            }
            return this.openPDF(pdf, page);
        });
    }
    /**
     * Open the provided {@link PDFData} to the specified page.
     * @param pdf The PDF to open. See {@link Api.getPDFData}.
     * @param page The page to open the PDF to.
     * @category Open
     */
    static openPDF(pdf, page = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            let { url, offset, cache } = pdf;
            if (typeof offset === 'string') {
                offset = parseInt(offset);
            }
            if (!Util_1.validateAbsoluteURL(url)) {
                url = Util_1.getAbsoluteURL(url);
            }
            const viewer = new Viewer_1.default(pdf);
            viewer.render(true);
            yield _handleOpen(viewer, url, page + offset, cache);
            return viewer;
        });
    }
    /**
     * Open a URL as a PDF.
     * @param url The URL to open (must be absolute).
     * @param page Which page to open to. Must be >= 1.
     * @param cache If URL based caching should be used.
     * @category Open
     */
    static openURL(url, page = 1, cache = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isNaN(page) || page <= 0) {
                throw new Error(`Page must be > 0, but ${page} was given.`);
            }
            if (!Util_1.validateAbsoluteURL(url)) {
                url = Util_1.getAbsoluteURL(url);
            }
            const viewer = new Viewer_1.default();
            viewer.render(true);
            yield _handleOpen(viewer, url, page, cache);
            return viewer;
        });
    }
    /**
     * Shows the user manual to the active user.
     * @category Utility
     */
    static showHelp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield game.user.setFlag(Settings_1.default.EXTERNAL_SYSTEM_NAME, Settings_1.default.SETTING_KEY.HELP_SEEN, true);
            const lang = game.i18n.lang;
            let manualPath = `${window.origin}/systems/${Settings_1.default.DIST_PATH}/assets/manual/${lang}/manual.pdf`;
            const manualExists = yield Util_1.fileExists(manualPath);
            if (!manualExists) {
                manualPath = `${window.origin}/systems/${Settings_1.default.DIST_PATH}/assets/manual/en/manual.pdf`;
            }
            const pdfData = {
                name: game.i18n.localize('PDFOUNDRY.MANUAL.Name'),
                code: '',
                offset: 0,
                url: manualPath,
                cache: false,
            };
            return Api.openPDF(pdfData);
        });
    }
}
exports.default = Api;
/**
 * Enable additional debug information for the specified category.
 * @category Debug
 */
Api.DEBUG = {
    /**
     * When set to true, enables the logging event names and arguments to console.
     */
    EVENTS: false,
};
},{"./Util":4,"./cache/PDFCache":9,"./settings/Settings":14,"./viewer/Viewer":19}],2:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Setup_1 = require("./Setup");
Setup_1.default.run();
},{"./Setup":3}],3:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("./Util");
const PDFItemSheet_1 = require("./app/PDFItemSheet");
const PreloadEvent_1 = require("./socket/events/PreloadEvent");
const Socket_1 = require("./socket/Socket");
const Settings_1 = require("./settings/Settings");
const PDFCache_1 = require("./cache/PDFCache");
const I18n_1 = require("./settings/I18n");
const Api_1 = require("./Api");
const HTMLEnricher_1 = require("./enricher/HTMLEnricher");
const TinyMCEPlugin_1 = require("./enricher/TinyMCEPlugin");
/**
 * A collection of methods used for setting up the API & system state.
 * @private
 */
class Setup {
    /**
     * Run setup tasks.
     */
    static run() {
        // Register the PDFoundry APi on the UI
        ui['PDFoundry'] = Api_1.default;
        // Register system & css synchronously
        Setup.registerSystem();
        Setup.injectStyles();
        // Setup tasks requiring FVTT is loaded
        Hooks.once('ready', Setup.lateRun);
    }
    /**
     * Late setup tasks happen when the system is loaded
     */
    static lateRun() {
        // Register the PDF sheet with the class picker
        Setup.setupSheets();
        // Register socket event handlers
        Socket_1.Socket.initialize();
        // Bind always-run event handlers
        // Enrich Journal & Item Sheet rich text links
        Hooks.on('renderItemSheet', HTMLEnricher_1.default.HandleEnrich);
        Hooks.on('renderJournalSheet', HTMLEnricher_1.default.HandleEnrich);
        Hooks.on('renderActorSheet', HTMLEnricher_1.default.HandleEnrich);
        // Register TinyMCE drag + drop events
        TinyMCEPlugin_1.default.Register();
        return new Promise(() => __awaiter(this, void 0, void 0, function* () {
            // Initialize the settings
            yield Settings_1.default.initialize();
            yield PDFCache_1.default.initialize();
            yield I18n_1.default.initialize();
            // PDFoundry is ready
            Setup.userLogin();
        }));
    }
    /**
     * Inject the CSS file into the header, so it doesn't have to be referenced in the system.json
     */
    static injectStyles() {
        const head = $('head');
        const link = `<link href="systems/${Settings_1.default.DIST_PATH}/bundle.css" rel="stylesheet" type="text/css" media="all">`;
        head.append($(link));
    }
    /**
     * Pulls the system name from the script tags.
     */
    static registerSystem() {
        const scripts = $('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts.get(i);
            const folders = script.src.split('/');
            const distIdx = folders.indexOf(Settings_1.default.DIST_NAME);
            if (distIdx === -1)
                continue;
            if (folders[distIdx - 1] === 'pdfoundry')
                break;
            Settings_1.default.EXTERNAL_SYSTEM_NAME = folders[distIdx - 1];
            break;
        }
    }
    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    static setupSheets() {
        Items.registerSheet(Settings_1.default.INTERNAL_MODULE_NAME, PDFItemSheet_1.PDFItemSheet, {
            types: [Settings_1.default.PDF_ENTITY_TYPE],
            makeDefault: true,
        });
        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${Settings_1.default.INTERNAL_MODULE_NAME}.${PDFItemSheet_1.PDFItemSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[Settings_1.default.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }
            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [Settings_1.default.PDF_ENTITY_TYPE],
            });
        }
    }
    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    static getItemContextOptions(html, options) {
        const getItemFromContext = (html) => {
            const id = html.data('entity-id');
            return game.items.get(id);
        };
        if (game.user.isGM) {
            options.unshift({
                name: game.i18n.localize('PDFOUNDRY.CONTEXT.PreloadPDF'),
                icon: '<i class="fas fa-download fa-fw"></i>',
                condition: (entityHtml) => {
                    const item = getItemFromContext(entityHtml);
                    if (item.type !== Settings_1.default.PDF_ENTITY_TYPE) {
                        return false;
                    }
                    const { url } = item.data.data;
                    return url !== '';
                },
                callback: (entityHtml) => {
                    const item = getItemFromContext(entityHtml);
                    const pdf = Util_1.getPDFDataFromItem(item);
                    if (pdf === null) {
                        //TODO: Error handling
                        return;
                    }
                    const { url } = pdf;
                    const event = new PreloadEvent_1.default(null, Util_1.getAbsoluteURL(url));
                    event.emit();
                    PDFCache_1.default.preload(url);
                },
            });
        }
        options.unshift({
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml) => {
                const item = getItemFromContext(entityHtml);
                if (item.type !== Settings_1.default.PDF_ENTITY_TYPE) {
                    return false;
                }
                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml) => {
                const item = getItemFromContext(entityHtml);
                const pdf = Util_1.getPDFDataFromItem(item);
                if (pdf === null) {
                    //TODO: Error handling
                    return;
                }
                Api_1.default.openPDF(pdf, 1);
            },
        });
    }
    static userLogin() {
        let viewed;
        try {
            viewed = game.user.getFlag(Settings_1.default.EXTERNAL_SYSTEM_NAME, Settings_1.default.SETTING_KEY.HELP_SEEN);
        }
        catch (error) {
            viewed = false;
        }
        finally {
            if (!viewed) {
                Api_1.default.showHelp();
            }
        }
    }
    /**
     * Hook handler for default data for a PDF
     */
    static preCreateItem(entity, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entity.type !== Settings_1.default.PDF_ENTITY_TYPE) {
                return;
            }
            entity.img = `systems/${Settings_1.default.DIST_PATH}/assets/pdf_icon.svg`;
        });
    }
    /**
     * Hook handler for rendering the settings tab
     */
    static onRenderSettings(settings, html, data) {
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', Api_1.default.showHelp);
        html.find('h2').last().before(button);
    }
}
exports.default = Setup;
// <editor-fold desc="Persistent Hooks">
// preCreateItem - Setup default values for a new PDFoundry_PDF
Hooks.on('preCreateItem', Setup.preCreateItem);
// getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
Hooks.on('getItemDirectoryEntryContext', Setup.getItemContextOptions);
// renderSettings - Inject a 'Open Manual' button into help section
Hooks.on('renderSettings', Setup.onRenderSettings);
},{"./Api":1,"./Util":4,"./app/PDFItemSheet":5,"./cache/PDFCache":9,"./enricher/HTMLEnricher":11,"./enricher/TinyMCEPlugin":12,"./settings/I18n":13,"./settings/Settings":14,"./socket/Socket":15,"./socket/events/PreloadEvent":16}],4:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPDF = exports.fileExists = exports.getUserIdsAtMostRole = exports.getUserIdsAtLeastRole = exports.getUserIdsOfRole = exports.getUserIdsBetweenRoles = exports.getUserIdsExceptMe = exports.validateAbsoluteURL = exports.getPDFDataFromItem = exports.getAbsoluteURL = void 0;
const Settings_1 = require("./settings/Settings");
/**
 * Helper method. Convert a relative URL to a absolute URL
 *  by prepending the window origin to the relative URL.
 * @param dataUrl
 */
function getAbsoluteURL(dataUrl) {
    // Amazon S3 buckets are already absolute
    if (dataUrl.includes('amazonaws.com')) {
        return dataUrl;
    }
    return `${window.origin}/${dataUrl}`;
}
exports.getAbsoluteURL = getAbsoluteURL;
/**
 * Pull relevant data from an item, creating a {@link PDFData}.
 * @param item The item to pull data from.
 */
function getPDFDataFromItem(item) {
    if (item === undefined || item === null) {
        return null;
    }
    let { code, url, offset, cache } = item.data.data;
    let name = item.name;
    if (typeof offset === 'string') {
        offset = parseInt(offset);
    }
    return {
        name,
        code,
        url,
        offset,
        cache,
    };
}
exports.getPDFDataFromItem = getPDFDataFromItem;
/**
 * Returns true if the URL starts with the origin.
 * @param dataUrl A url.
 */
function validateAbsoluteURL(dataUrl) {
    return dataUrl.startsWith(window.origin);
}
exports.validateAbsoluteURL = validateAbsoluteURL;
/**
 * Return all users ids except the active user
 */
function getUserIdsExceptMe() {
    return game.users
        .filter((user) => {
        return user.id !== game.userId;
    })
        .map((user) => user.id);
}
exports.getUserIdsExceptMe = getUserIdsExceptMe;
/**
 * Gets users with a role number between the provided lower inclusive and upper inclusive bounds.
 * @param lower
 * @param upper
 */
function getUserIdsBetweenRoles(lower, upper) {
    return game.users
        .filter((user) => {
        return user.role >= lower && user.role <= upper;
    })
        .map((user) => user.id);
}
exports.getUserIdsBetweenRoles = getUserIdsBetweenRoles;
/**
 * Gets users with a role number exactly matching the one provided.
 * @param role
 */
function getUserIdsOfRole(role) {
    return game.users
        .filter((user) => {
        return user.role === role;
    })
        .map((user) => user.id);
}
exports.getUserIdsOfRole = getUserIdsOfRole;
/**
 * Gets users with a role number at least the one provided.
 * @param role
 */
function getUserIdsAtLeastRole(role) {
    return game.users
        .filter((user) => {
        return user.role >= role;
    })
        .map((user) => user.id);
}
exports.getUserIdsAtLeastRole = getUserIdsAtLeastRole;
/**
 * Gets users with a role number at most the one provided.
 * @param role
 */
function getUserIdsAtMostRole(role) {
    return game.users
        .filter((user) => {
        return user.role <= role;
    })
        .map((user) => user.id);
}
exports.getUserIdsAtMostRole = getUserIdsAtMostRole;
/**
 * Checks if a remote file exists at the specified path. That is, if the URL is valid. This does not guarantee a
 * valid file exists at that location. For example, an HTML file will result in true but not be a valid PDF.
 * @param path
 */
function fileExists(path) {
    return new Promise((resolve, reject) => {
        $.ajax(path, {
            type: 'HEAD',
            success: () => {
                resolve(true);
            },
            error: () => {
                resolve(false);
            },
        });
    });
}
exports.fileExists = fileExists;
/**
 * Returns true if the provided entity is a PDF
 * @param entity
 */
function isPDF(entity) {
    return entity.data.type === Settings_1.default.PDF_ENTITY_TYPE;
}
exports.isPDF = isPDF;
},{"./settings/Settings":14}],5:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFItemSheet = void 0;
const Settings_1 = require("../settings/Settings");
const Api_1 = require("../Api");
const Util_1 = require("../Util");
/**
 * Extends the base ItemSheet for linked PDF viewing.
 * @private
 */
class PDFItemSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        options.template = `systems/${Settings_1.default.DIST_PATH}/templates/sheet/pdf-sheet.html`;
        return options;
    }
    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    _getByID(html, id) {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            class: 'pdf-sheet-manual',
            icon: 'fas fa-question-circle',
            label: 'Help',
            onclick: () => Api_1.default.showHelp(),
        });
        //TODO: Standardize this to function w/ the Viewer one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });
        return buttons;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const urlInput = this._getByID(html, 'data\\.url');
        const offsetInput = this._getByID(html, 'data\\.offset');
        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });
        // Test button
        this._getByID(html, 'pdf-test').on('click', function (event) {
            event.preventDefault();
            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();
            if (urlValue === null || urlValue === undefined)
                return;
            if (offsetValue === null || offsetValue === undefined)
                return;
            urlValue = urlValue.toString();
            urlValue = Util_1.getAbsoluteURL(urlValue);
            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue);
            Api_1.default.openURL(urlValue, 5 + offsetValue, false);
        });
        // Browse button
        this._getByID(html, 'pdf-browse').on('click', function (event) {
            return __awaiter(this, void 0, void 0, function* () {
                event.preventDefault();
                const fp = new FilePicker({});
                // @ts-ignore TODO: foundry-pc-types
                fp.extensions = ['.pdf'];
                fp.field = urlInput[0];
                let urlValue = urlInput.val();
                if (urlValue !== undefined) {
                    yield fp.browse(urlValue.toString().trim());
                }
                fp.render(true);
            });
        });
    }
}
exports.PDFItemSheet = PDFItemSheet;
},{"../Api":1,"../Util":4,"../settings/Settings":14}],6:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = require("../settings/Settings");
/**
 * An application that allows selection of players.
 * @private
 */
class PlayerSelect extends Application {
    constructor(ids, cb, options) {
        super(options);
        this._ids = ids;
        this._callback = cb;
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.template = `systems/${Settings_1.default.DIST_PATH}/templates/app/pdf-player-select.html`;
        options.width = 'auto';
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectPlayers');
        return options;
    }
    getData(options) {
        const data = super.getData(options);
        const users = [];
        for (const id of this._ids) {
            users.push({
                name: game.users.get(id).name,
                id,
            });
        }
        users.sort((a, b) => a.name.localeCompare(b.name));
        data['users'] = users;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const button = $(html).find('#confirm');
        button.on('click', () => {
            this._callback(this.collectIds());
            this.close();
        });
    }
    /**
     * Collect selected ids from the html
     */
    collectIds() {
        const ids = [];
        const checkboxes = $(this.element).find('input[type=checkbox]');
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = $(checkboxes[i]);
            if (checkbox.prop('checked')) {
                ids.push(checkbox.prop('id'));
            }
        }
        return ids;
    }
}
exports.default = PlayerSelect;
},{"../settings/Settings":14}],7:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheError = void 0;
/**
 * An error that occurs during cache operations
 * @private
 */
class CacheError extends Error {
    constructor(index, store, message) {
        super(`Error in ${index}>${store}: ${message}`);
    }
}
exports.CacheError = CacheError;
},{}],8:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CacheError_1 = require("./CacheError");
/**
 * Class that deals with getting/setting from an indexed db
 * Mostly exists to separate logic for the PDFCache from logic
 * dealing with the database
 * @private
 */
class CacheHelper {
    constructor(indexName, storeNames, version) {
        this._indexName = `${indexName}`;
        this._storeNames = storeNames;
        this._version = version;
    }
    static createAndOpen(indexName, storeNames, version) {
        return __awaiter(this, void 0, void 0, function* () {
            const helper = new CacheHelper(indexName, storeNames, version);
            yield helper.open();
            return helper;
        });
    }
    get ready() {
        return this._db !== undefined;
    }
    newTransaction(storeName) {
        const transaction = this._db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        return { transaction, store };
    }
    open() {
        const that = this;
        return new Promise(function (resolve, reject) {
            const request = indexedDB.open(that._indexName, that._version);
            request.onsuccess = function (event) {
                that._db = this.result;
                resolve();
            };
            request.onupgradeneeded = function (event) {
                that._db = this.result;
                for (let i = 0; i < that._storeNames.length; i++) {
                    try {
                        // Create object store if it doesn't exist
                        that._db.createObjectStore(that._storeNames[i], {});
                    }
                    catch (error) {
                        // Otherwise pass
                    }
                }
                resolve();
            };
            request.onerror = function (event) {
                // @ts-ignore
                reject(event.target.error);
            };
        });
    }
    set(key, value, storeName, force = false) {
        return new Promise((resolve, reject) => {
            if (!this._db) {
                throw new CacheError_1.CacheError(this._indexName, storeName, 'Database is not initialized.');
            }
            else {
                const that = this;
                let { transaction, store } = this.newTransaction(storeName);
                // Propagate errors upwards, otherwise they fail silently
                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
                const keyRequest = store.getKey(key);
                keyRequest.onsuccess = function (event) {
                    // key already exists in the store
                    if (keyRequest.result) {
                        // should we force the new value by deleting the old?
                        if (force) {
                            that.del(key, storeName).then(() => {
                                ({ transaction, store } = that.newTransaction(storeName));
                                store.add(value, key);
                                resolve();
                            });
                        }
                        else {
                            throw new CacheError_1.CacheError(that._indexName, storeName, `Key ${key} already exists.`);
                        }
                    }
                    else {
                        store.add(value, key);
                        resolve();
                    }
                };
            }
        });
    }
    get(key, storeName) {
        return new Promise((resolve, reject) => {
            if (!this._db) {
                throw new CacheError_1.CacheError(this._indexName, storeName, 'Database is not initialized.');
            }
            else {
                let { transaction, store } = this.newTransaction(storeName);
                // Propagate errors upwards, otherwise they fail silently
                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
                const getRequest = store.get(key);
                getRequest.onsuccess = function (event) {
                    resolve(this.result);
                };
                getRequest.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
            }
        });
    }
    del(key, storeName) {
        return new Promise((resolve, reject) => {
            try {
                const { transaction, store } = this.newTransaction(storeName);
                transaction.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
                transaction.oncomplete = function (event) {
                    resolve();
                };
                store.delete(key);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    keys(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const { transaction, store } = this.newTransaction(storeName);
                const keysRequest = store.getAllKeys();
                keysRequest.onsuccess = function () {
                    resolve(keysRequest.result);
                };
                keysRequest.onerror = function (event) {
                    // @ts-ignore
                    reject(event.target.error);
                };
                return;
            }
            catch (error) {
                reject(error);
            }
        });
    }
    clr(storeName) {
        return new Promise((resolve, reject) => {
            try {
                const { store } = this.newTransaction(storeName);
                const keys = store.getAllKeys();
                keys.onsuccess = (result) => {
                    const promises = [];
                    for (const key of keys.result) {
                        promises.push(this.del(key, storeName));
                    }
                    Promise.all(promises).then(() => {
                        resolve();
                    });
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.default = CacheHelper;
},{"./CacheError":7}],9:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = require("../settings/Settings");
const CacheHelper_1 = require("./CacheHelper");
/**
 * Handles caching for PDFs
 * @private
 */
class PDFCache {
    // <editor-fold desc="Static Properties">
    /**
     * Max size of the cache for the active user, defaults to 256 MB.
     */
    static get MAX_BYTES() {
        return game.settings.get(Settings_1.default.EXTERNAL_SYSTEM_NAME, 'CacheSize') * Math.pow(2, 20);
    }
    // </editor-fold>
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            PDFCache._cacheHelper = yield CacheHelper_1.default.createAndOpen(PDFCache.IDB_NAME, [PDFCache.CACHE, PDFCache.META], PDFCache.IDB_VERSION);
        });
    }
    /**
     * Get meta information about a provided key (url).
     * @param key
     */
    static getMeta(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield PDFCache._cacheHelper.get(key, PDFCache.META);
            }
            catch (error) {
                return null;
            }
        });
    }
    /**
     * Set meta information about a provided key (url). See {@link CacheData}.
     * @param key
     * @param meta
     */
    static setMeta(key, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            yield PDFCache._cacheHelper.set(key, meta, PDFCache.META, true);
        });
    }
    /**
     * Get the byte array representing the key (url) from the user's cache.
     * @param key
     */
    static getCache(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bytes = yield PDFCache._cacheHelper.get(key, PDFCache.CACHE);
                const meta = {
                    dateAccessed: new Date().toISOString(),
                    size: bytes.length,
                };
                yield PDFCache.setMeta(key, meta);
                return bytes;
            }
            catch (error) {
                return null;
            }
        });
    }
    /**
     * Set the value of the cache for the specific key (url) to the provided byte array.
     * @param key
     * @param bytes
     */
    static setCache(key, bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const meta = {
                dateAccessed: new Date().toISOString(),
                size: bytes.length,
            };
            yield PDFCache._cacheHelper.set(key, bytes, PDFCache.CACHE, true);
            yield PDFCache.setMeta(key, meta);
            yield this.prune();
        });
    }
    /**
     * Preload the PDF at the specified key (url), caching it immediately.
     * @param key
     */
    static preload(key) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const cachedBytes = yield PDFCache.getCache(key);
            if (cachedBytes !== null && cachedBytes.byteLength > 0) {
                resolve();
                return;
            }
            const response = yield fetch(key);
            if (response.ok) {
                const fetchedBytes = new Uint8Array(yield response.arrayBuffer());
                if (fetchedBytes.byteLength > 0) {
                    yield PDFCache.setCache(key, fetchedBytes);
                    resolve();
                    return;
                }
                else {
                    reject('Fetch failed.');
                }
            }
            else {
                reject('Fetch failed.');
            }
        }));
    }
    /**
     * Prune the active user's cache until it is below the user's cache size limit.
     */
    static prune() {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = yield this._cacheHelper.keys(PDFCache.META);
            let totalBytes = 0;
            let metas = [];
            for (const key of keys) {
                const meta = yield this._cacheHelper.get(key, PDFCache.META);
                meta.dateAccessed = Date.parse(meta.dateAccessed);
                meta.size = parseInt(meta.size);
                totalBytes += meta.size;
                metas.push({
                    key,
                    meta,
                });
            }
            metas = metas.sort((a, b) => {
                return a.meta.dateAccessed - b.meta.dateAccessed;
            });
            for (let i = 0; i < metas.length; i++) {
                if (totalBytes < PDFCache.MAX_BYTES) {
                    break;
                }
                const next = metas[i];
                yield this._cacheHelper.del(next.key, PDFCache.META);
                yield this._cacheHelper.del(next.key, PDFCache.CACHE);
                totalBytes -= next.meta.size;
            }
        });
    }
}
exports.default = PDFCache;
PDFCache.IDB_NAME = 'PDFoundry';
PDFCache.IDB_VERSION = 1;
PDFCache.CACHE = `Cache`;
PDFCache.META = `Meta`;
},{"../settings/Settings":14,"./CacheHelper":8}],10:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Api_1 = require("../../Api");
/**
 * @private
 */
class EventStore {
    constructor() {
        this._map = new Map();
    }
    /**
     * Turn on an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    on(eventName, callback) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }
        const callbacks = this._map.get(eventName);
        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] === callback)
                return;
        }
        callbacks.push(callback);
    }
    /**
     * Like {@see on} but only fires once.
     * @param eventName
     * @param callback
     */
    once(eventName, callback) {
        const that = this;
        const wrapper = function (...args) {
            callback(args);
            that.off(eventName, wrapper);
        };
        that.on(eventName, wrapper);
    }
    /**
     * Turn off an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    off(eventName, callback) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }
        const callbacks = this._map.get(eventName);
        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] === callback) {
                callbacks.splice(i, 1);
            }
        }
    }
    /**
     * Fire an event and forward the args to all handlers
     * @param eventName
     * @param args
     */
    fire(eventName, ...args) {
        if (Api_1.default.DEBUG.EVENTS) {
            console.debug(`PDFoundry::${eventName}`);
            console.debug(args);
        }
        if (!this._map.has(eventName)) {
            return;
        }
        const callbacks = this._map.get(eventName);
        for (const callback of callbacks) {
            callback(...args);
        }
    }
}
exports.default = EventStore;
},{"../../Api":1}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PDFItemSheet_1 = require("../app/PDFItemSheet");
const Settings_1 = require("../settings/Settings");
const Api_1 = require("../Api");
/**
 * @private
 * Enriches TinyMCE editor content
 */
class HTMLEnricher {
    constructor(p, text) {
        this._element = p;
        this._text = text;
        this._sPos = this._text.indexOf('@');
        this._ePos = this._text.indexOf('}', this._sPos + 1);
    }
    static HandleEnrich(app, html, data) {
        if (app instanceof PDFItemSheet_1.PDFItemSheet)
            return;
        HTMLEnricher.EnrichHTML(html);
        HTMLEnricher.BindClicks(html);
    }
    static EnrichHTML(html) {
        // Enrich HTML
        for (const element of html.find('div.editor-content > *')) {
            try {
                // We replace one at a time until done
                while (element.innerText.includes('@PDF')) {
                    element.innerHTML = new HTMLEnricher($(element), element.innerHTML).enrich();
                }
            }
            catch (error) {
                // Errors get propagated from instance for proper error modeling
                if (Settings_1.default.NOTIFICATIONS) {
                    ui.notifications.error(error.message);
                }
                else {
                    console.error(error);
                }
            }
        }
    }
    static BindClicks(html) {
        html.find('a.pdfoundry-link').on('click', (event) => {
            event.preventDefault();
            // This will always be an anchor
            const target = $(event.currentTarget);
            const ref = target.data('ref');
            const page = target.data('page');
            // ref can match name or code
            let pdfData = Api_1.default.getPDFData((item) => {
                return item.name === ref || item.data.data.code === ref;
            });
            if (!pdfData) {
                ui.notifications.error(`Unable to find a PDF with a name or code matching ${ref}.`);
                return;
            }
            Api_1.default.openPDF(pdfData, page);
        });
    }
    enrich() {
        const enrichMe = this._text.slice(this._sPos, this._ePos + 1);
        const lBracket = enrichMe.indexOf('[');
        const rBracket = enrichMe.indexOf(']');
        const lCurly = enrichMe.indexOf('{');
        const rCurly = enrichMe.indexOf('}');
        // Required character is missing
        if (lBracket === -1 || rBracket === -1 || lCurly === -1 || rCurly === -1) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }
        // Order is not correct
        if (rCurly < lCurly || lCurly < rBracket || rBracket < lBracket) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }
        const options = enrichMe.slice(lBracket + 1, rBracket);
        // Multiple dividers are not supported
        if (options.indexOf('|') !== options.lastIndexOf('|')) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }
        let linkText = enrichMe.slice(lCurly + 1, rCurly);
        // Empty names are not supported
        if (linkText === undefined || linkText === '') {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.EmptyLinkText'));
        }
        let pageNumber = 1;
        const [nameOrCode, queryString] = options.split('|');
        // Getting the PDF without invisible PDFs to check permissions
        let pdfData = Api_1.default.getPDFData((item) => {
            return item.name === nameOrCode || item.data.data.code === nameOrCode;
        }, false);
        if (pdfData) {
            // Case 1 - User has permissions to see the PDF
            if (queryString !== undefined && queryString !== '') {
                const [_, pageString] = queryString.split('=');
                try {
                    pageNumber = parseInt(pageString);
                }
                catch (error) {
                    // Ignore page number
                }
            }
            if (pageNumber <= 0) {
                throw new Error('PDFOUNDRY.ERROR.PageMustBePositive');
            }
            const i18nOpen = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitleOpen');
            const i18nPage = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitlePage');
            const linkTitle = `${i18nOpen} ${nameOrCode} ${i18nPage} ${pageNumber}`;
            const result = `<a class="pdfoundry-link" title="${linkTitle}" data-ref="${nameOrCode}" data-page="${pageNumber}">${linkText}</a>`;
            return this._text.slice(0, this._sPos) + result + this._text.slice(this._ePos + 1);
        }
        else {
            // Case 2 - User does not have permissions to see the PDF
            return this._text.slice(0, this._sPos) + linkText + this._text.slice(this._ePos + 1);
        }
    }
}
exports.default = HTMLEnricher;
},{"../Api":1,"../app/PDFItemSheet":5,"../settings/Settings":14}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../Util");
/**
 * @private
 * A plugin for TinyMCE that handles Drag + Drop
 */
class TinyMCEPlugin {
    /**
     * Register plugin with Foundry + TinyMCE
     */
    static Register() {
        // @ts-ignore
        tinyMCE.PluginManager.add(TinyMCEPlugin.pluginName, function (editor) {
            editor.on('BeforeSetContent', (event) => TinyMCEPlugin.Handle(event));
        });
        CONFIG.TinyMCE.plugins = `${TinyMCEPlugin.pluginName} ${CONFIG.TinyMCE.plugins}`;
    }
    static Handle(event) {
        if (event.initial)
            return;
        if (!event.selection || event.set !== undefined) {
            return;
        }
        const initialContent = event.content;
        const lBracket = initialContent.indexOf('[');
        const rBracket = initialContent.indexOf(']');
        const entityId = initialContent.slice(lBracket + 1, rBracket);
        const entity = game.items.get(entityId);
        if (entity === null || !Util_1.isPDF(entity)) {
            return;
        }
        const pdfData = Util_1.getPDFDataFromItem(entity);
        if (!pdfData) {
            return;
        }
        const codeOrName = pdfData.code ? pdfData.code : pdfData.name;
        event.content = `@PDF[${codeOrName}|page=1]{${pdfData.name}}`;
    }
}
exports.default = TinyMCEPlugin;
TinyMCEPlugin.pluginName = 'PDFoundry_HTMLEnrich_Drop';
},{"../Util":4}],13:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = require("./Settings");
/**
 * Localization helper
 * @private
 */
class I18n {
    /**
     * Load the localization file for the user's language.
     */
    static initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const lang = game.i18n.lang;
            // user's language path
            const u_path = `systems/${Settings_1.default.DIST_PATH}/locale/${lang}/config.json`;
            // english fallback path
            const f_path = `systems/${Settings_1.default.DIST_PATH}/locale/en/config.json`;
            let json;
            try {
                json = yield $.getJSON(u_path);
            }
            catch (error) {
                // if no translation exits for the users locale the fallback
                json = yield $.getJSON(f_path);
            }
            for (const key of Object.keys(json)) {
                game.i18n.translations[key] = json[key];
            }
            // setup the fallback as english so partial translations do not display keys
            let fb_json = yield $.getJSON(f_path);
            for (const key of Object.keys(fb_json)) {
                // @ts-ignore
                game.i18n._fallback[key] = json[key];
            }
        });
    }
}
exports.default = I18n;
},{"./Settings":14}],14:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Internal settings and helper methods for PDFoundry.
 * @private
 */
class Settings {
    static get DIST_PATH() {
        return `${Settings.EXTERNAL_SYSTEM_NAME}/${Settings.DIST_NAME}`;
    }
    static get SOCKET_NAME() {
        return `system.${Settings.EXTERNAL_SYSTEM_NAME}`;
    }
    static initialize() {
        Settings.register(Settings.SETTING_KEY.CACHE_SIZE, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeName'),
            scope: 'user',
            type: Number,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.CacheSizeHint'),
            default: 256,
            config: true,
            onChange: (mb) => __awaiter(this, void 0, void 0, function* () {
                mb = Math.round(mb);
                mb = Math.max(mb, 64);
                mb = Math.min(mb, 1024);
                yield Settings.set(Settings.SETTING_KEY.CACHE_SIZE, mb);
            }),
        });
        Settings.register(Settings.SETTING_KEY.EXISTING_VIEWER, {
            name: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerName'),
            scope: 'user',
            type: Boolean,
            hint: game.i18n.localize('PDFOUNDRY.SETTINGS.ShowInExistingViewerHint'),
            default: true,
            config: true,
        });
    }
    /**
     * Wrapper around game.settings.register. Ensures scope is correct.
     * @param key
     * @param data
     */
    static register(key, data) {
        game.settings.register(Settings.EXTERNAL_SYSTEM_NAME, key, data);
    }
    /**
     * Wrapper around game.settings.get. Ensures scope is correct.
     * @param key
     */
    static get(key) {
        return game.settings.get(Settings.EXTERNAL_SYSTEM_NAME, key);
    }
    /**
     * Wrapper around game.settings.set. Ensures scope is correct.
     * @param key
     * @param value
     */
    static set(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return game.settings.set(Settings.EXTERNAL_SYSTEM_NAME, key, value);
        });
    }
}
exports.default = Settings;
/**
 * Are feedback notifications enabled? Disable if you wish
 *  to handle them yourself.
 */
Settings.NOTIFICATIONS = true;
Settings.EXTERNAL_SYSTEM_NAME = '../modules/pdfoundry';
Settings.INTERNAL_MODULE_NAME = 'pdfoundry';
Settings.DIST_NAME = 'pdfoundry-dist';
Settings.PDF_ENTITY_TYPE = 'PDFoundry_PDF';
Settings.SETTING_KEY = {
    EXISTING_VIEWER: 'ShowInExistingViewer',
    CACHE_SIZE: 'CacheSize',
    HELP_SEEN: 'PDFoundry_HelpSeen',
};
},{}],15:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = void 0;
const PreloadEvent_1 = require("./events/PreloadEvent");
const Api_1 = require("../Api");
const Settings_1 = require("../settings/Settings");
const SetViewEvent_1 = require("./events/SetViewEvent");
const PDFCache_1 = require("../cache/PDFCache");
/**
 * @private
 */
class Socket {
    static initialize() {
        // @ts-ignore
        game.socket.on(Settings_1.default.SOCKET_NAME, (event) => {
            const { userIds, type, payload } = event;
            // null = all users, otherwise check if this event effects us
            if (userIds !== null && !userIds.includes(game.userId)) {
                return;
            }
            if (type === SetViewEvent_1.default.EVENT_TYPE) {
                Socket.handleSetView(payload);
                return;
            }
            else if (type === PreloadEvent_1.default.EVENT_TYPE) {
                Socket.handlePreloadPDF(payload);
                return;
            }
            else {
                if (type.includes('PDFOUNDRY')) {
                    console.error(`Event of type ${type} has no handler.`);
                    return;
                }
            }
        });
    }
    static handleSetView(data) {
        if (Settings_1.default.get(Settings_1.default.SETTING_KEY.EXISTING_VIEWER)) {
            function appIsViewer(app) {
                return app['pdfData'] !== undefined;
            }
            for (const app of Object.values(ui.windows)) {
                if (!appIsViewer(app)) {
                    continue;
                }
                const pdfData = app.pdfData;
                if (data.pdfData.url === pdfData.url) {
                    app.page = data.page;
                    return;
                }
            }
            // App not found, fall through.
        }
        Api_1.default.openPDF(data.pdfData, data.page);
    }
    static handlePreloadPDF(data) {
        PDFCache_1.default.preload(data.url);
    }
}
exports.Socket = Socket;
},{"../Api":1,"../cache/PDFCache":9,"../settings/Settings":14,"./events/PreloadEvent":16,"./events/SetViewEvent":17}],16:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SocketEvent_1 = require("./SocketEvent");
/**
 * @private
 */
class PreloadEvent extends SocketEvent_1.default {
    constructor(userIds, url) {
        super(userIds);
        this.url = url;
    }
    static get EVENT_TYPE() {
        return `${super.EVENT_TYPE}/PRELOAD_PDF`;
    }
    get type() {
        return PreloadEvent.EVENT_TYPE;
    }
    getPayload() {
        const payload = super.getPayload();
        payload.url = this.url;
        return payload;
    }
}
exports.default = PreloadEvent;
},{"./SocketEvent":18}],17:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SocketEvent_1 = require("./SocketEvent");
/**
 * @private
 */
class SetViewEvent extends SocketEvent_1.default {
    constructor(userIds, pdfData, page) {
        super(userIds);
        this.pdfData = pdfData;
        this.page = page;
    }
    static get EVENT_TYPE() {
        return `${super.EVENT_TYPE}/SET_VIEW`;
    }
    get type() {
        return SetViewEvent.EVENT_TYPE;
    }
    getPayload() {
        const payload = super.getPayload();
        payload.pdfData = this.pdfData;
        payload.page = this.page;
        return payload;
    }
}
exports.default = SetViewEvent;
},{"./SocketEvent":18}],18:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Settings_1 = require("../../settings/Settings");
/**
 * @private
 */
class SocketEvent {
    constructor(userIds) {
        this.userIds = userIds;
    }
    /**
     * The type of this event.
     */
    static get EVENT_TYPE() {
        return 'PDFOUNDRY';
    }
    /**
     * Get any data that will be sent with the event.
     */
    getPayload() {
        return {};
    }
    emit() {
        // @ts-ignore
        game.socket.emit(Settings_1.default.SOCKET_NAME, {
            type: this.type,
            userIds: this.userIds,
            payload: this.getPayload(),
        });
    }
}
exports.default = SocketEvent;
},{"../../settings/Settings":14}],19:[function(require,module,exports){
"use strict";
/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const PlayerSelect_1 = require("../app/PlayerSelect");
const Util_1 = require("../Util");
const Settings_1 = require("../settings/Settings");
const SetViewEvent_1 = require("../socket/events/SetViewEvent");
const events_1 = require("../common/helpers/events");
/**
 * The PDFoundry Viewer class provides the core logic opening PDFs and binding their events.
 * You cannot create a new instance of this class, you must do so with the API.
 *
 * See {@link Api.openPDF}, {@link Api.openPDFByCode}, {@link Api.openPDFByName}, {@link Api.openURL} which all return a
 * promise which resolve with an instance of this class.
 */
class Viewer extends Application {
    /**
     * @internal
     */
    constructor(pdfData, options) {
        super(options);
        if (pdfData === undefined) {
            pdfData = {
                name: game.i18n.localize('PDFOUNDRY.VIEWER.Title'),
                code: '',
                offset: 0,
                url: '',
                cache: false,
            };
        }
        this._pdfData = pdfData;
        this._eventStore = new events_1.default();
    }
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `systems/${Settings_1.default.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }
    // <editor-fold desc="Getters & Setters">
    /**
     * Returns a copy of the PDFData this viewer is using.
     * Changes to this data will not reflect in the viewer.
     */
    get pdfData() {
        return duplicate(this._pdfData);
    }
    /**
     * Get the currently viewed page.
     */
    get page() {
        return this._viewer.page;
    }
    /**
     * Set the currently viewed page.
     * @param value
     */
    set page(value) {
        this._viewer.page = value;
    }
    // </editor-fold>
    // <editor-fold desc="Foundry Overrides">
    get title() {
        let title = this._pdfData.name;
        if (this._pdfData.code !== '') {
            title = `${title} (${this._pdfData.code})`;
        }
        return title;
    }
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        //TODO: Standardize this to function w/ the Item sheet one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });
        buttons.unshift({
            class: 'pdf-sheet-show-players',
            icon: 'fas fa-eye',
            label: game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersText'),
            onclick: (event) => this.showTo(event),
        });
        return buttons;
    }
    getData(options) {
        const data = super.getData(options);
        data.systemName = Settings_1.default.EXTERNAL_SYSTEM_NAME;
        return data;
    }
    activateListeners(html) {
        const _super = Object.create(null, {
            activateListeners: { get: () => super.activateListeners }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this._eventStore.fire('viewerOpening', this);
            _super.activateListeners.call(this, html);
            this._frame = html.parent().find('iframe.pdfViewer').get(0);
            this.getViewer().then((viewer) => __awaiter(this, void 0, void 0, function* () {
                this._viewer = viewer;
                this._eventStore.fire('viewerOpened', this);
                this.getEventBus().then((eventBus) => {
                    this._eventBus = eventBus;
                    this._eventBus.on('pagerendered', this.onPageRendered.bind(this));
                    this._eventBus.on('pagechanging', this.onPageChanging.bind(this));
                    this._eventBus.on('updateviewarea', this.onViewAreaUpdated.bind(this));
                    this._eventBus.on('scalechanging', this.onScaleChanging.bind(this));
                    // const listeners = eventBus._listeners;
                    // for (const eventName of Object.keys(listeners)) {
                    //     eventBus.on(eventName, (...args) => {
                    //         Viewer.logEvent(eventName, args);
                    //     });
                    // }
                    this._eventStore.fire('viewerReady', this);
                });
            }));
            // _getHeaderButtons does not permit titles...
            $(html).parents().parents().find('.pdf-sheet-show-players').prop('title', game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersTitle'));
        });
    }
    // </editor-fold>
    // <editor-fold desc="Events">
    onPageChanging(event) {
        this._eventStore.fire('pageChanging', this, {
            pageLabel: event.pageLabel,
            pageNumber: event.pageNumber,
        });
    }
    onPageRendered(event) {
        this._eventStore.fire('pageRendered', this, {
            pageNumber: event.pageNumber,
            pageLabel: event.source.pageLabel,
            width: event.source.width,
            height: event.source.height,
            rotation: event.source.rotation,
            scale: event.source.scale,
            canvas: event.source.canvas,
            div: event.source.div,
            error: event.source.error,
        });
    }
    onViewAreaUpdated(event) {
        this._eventStore.fire('viewAreaUpdated', this, {
            top: event.location.top,
            left: event.location.left,
            pageNumber: event.location.pageNumber,
            rotation: event.location.rotation,
            scale: event.location.scale,
        });
    }
    onScaleChanging(event) {
        this._eventStore.fire('scaleChanging', this, {
            presetValue: event.presetValue,
            scale: event.scale,
        });
    }
    /**
     * Register a callback to occur when an event fires. See individual events for descriptions and use {@link Api.DEBUG.EVENTS} to log and analyze events.
     * @param eventName
     * @param callback
     */
    on(eventName, callback) {
        this._eventStore.on(eventName, callback);
    }
    /**
     * Deregister an event that has been registered with {@link on} or {@link once}.
     * @param eventName
     * @param callback
     */
    off(eventName, callback) {
        this._eventStore.off(eventName, callback);
    }
    /**
     * Like {@link on} but only fires on the next occurrence.
     * @param eventName
     * @param callback
     */
    once(eventName, callback) {
        this._eventStore.once(eventName, callback);
    }
    // </editor-fold>
    // private static logEvent(key: string, ...args) {
    //     console.warn(key);
    //     console.warn(args);
    // }
    close() {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this._eventStore.fire('viewerClosed', this);
            return _super.close.call(this);
        });
    }
    /**
     * Show the current page to GMs.
     */
    showTo(event) {
        const pdfData = this.pdfData;
        pdfData.offset = 0;
        const ids = Util_1.getUserIdsExceptMe();
        if (event.shiftKey) {
            new SetViewEvent_1.default(ids, pdfData, this.page).emit();
        }
        else {
            new PlayerSelect_1.default(ids, (filteredIds) => {
                new SetViewEvent_1.default(filteredIds, pdfData, this.page).emit();
            }).render(true);
        }
    }
    /**
     * Wait for the internal PDFjs viewer to be ready and usable.
     */
    getViewer() {
        if (this._viewer) {
            return Promise.resolve(this._viewer);
        }
        return new Promise((resolve) => {
            let timeout;
            const returnOrWait = () => {
                // If our window has finished initializing...
                if (this._frame) {
                    // If PDFjs has finished initializing...
                    if (this._frame.contentWindow && this._frame.contentWindow['PDFViewerApplication']) {
                        const viewer = this._frame.contentWindow['PDFViewerApplication'];
                        resolve(viewer);
                        return;
                    }
                }
                // If any ifs fall through, try again in a few ms
                timeout = setTimeout(returnOrWait, 5);
            };
            returnOrWait();
        });
    }
    /**
     * Wait for the internal PDFjs eventBus to be ready and usable.
     */
    getEventBus() {
        if (this._eventBus) {
            return Promise.resolve(this._eventBus);
        }
        return new Promise((resolve) => {
            this.getViewer().then((viewer) => {
                let timeout;
                const returnOrWait = () => {
                    if (viewer.eventBus) {
                        resolve(viewer.eventBus);
                        return;
                    }
                    timeout = setTimeout(returnOrWait, 5);
                };
                returnOrWait();
            });
        });
    }
    /**
     * Finish the download and return the byte array for the file.
     */
    download() {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const viewer = yield this.getViewer();
            let timeout;
            const returnOrWait = () => {
                if (viewer.downloadComplete) {
                    resolve(viewer.pdfDocument.getData());
                    return;
                }
                timeout = setTimeout(returnOrWait, 50);
            };
            returnOrWait();
        }));
    }
    /**
     * Open a PDF
     * @param pdfSource A URL or byte array to open.
     * @param page The initial page to open to
     */
    open(pdfSource, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const pdfjsViewer = yield this.getViewer();
            if (page) {
                pdfjsViewer.initialBookmark = `page=${page}`;
            }
            yield pdfjsViewer.open(pdfSource);
        });
    }
}
exports.default = Viewer;
},{"../Util":4,"../app/PlayerSelect":6,"../common/helpers/events":10,"../settings/Settings":14,"../socket/events/SetViewEvent":17}]},{},[2])(2)
});

//# sourceMappingURL=bundle.js.map
