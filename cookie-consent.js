/*
 * Nueva Vida – gestor compartido de privacidad y consentimiento.
 *
 * La clave se guarda únicamente en el navegador del visitante y se comparte
 * entre las páginas DE, EN y FR del mismo origen: shop.nuevavida-ftv.de.
 * Si en el futuro se añade un servicio opcional, declárelo antes de este
 * archivo en window.NuevaVidaCookieConsentConfig.services y aumente version.
 */
(() => {
    "use strict";

    const defaultConfig = {
        version: "2026-08-16-multilingual-v1",
        consentKey: "nv_shop_privacy_choice",
        services: []
    };

    const suppliedConfig = window.NuevaVidaCookieConsentConfig || {};
    const config = {
        ...defaultConfig,
        ...suppliedConfig,
        services: Array.isArray(suppliedConfig.services) ? suppliedConfig.services : defaultConfig.services
    };

    const language = ["de", "en", "fr"].includes(document.documentElement.lang)
        ? document.documentElement.lang
        : "de";
    const optionalServices = config.services.filter((service) => (
        service
        && typeof service.id === "string"
        && typeof service.category === "string"
        && typeof service.load === "function"
    ));
    const hasOptionalServices = optionalServices.length > 0;
    let initialized = false;

    const copy = {
        de: {
            noticeTitle: "Hinweis zu Cookies & Datenschutz",
            noticeText: "Diese Website verwendet derzeit nur technisch erforderliche Funktionen. Es werden keine Statistik-, Marketing- oder Drittanbieter-Cookies geladen.",
            noticeStorage: "Mit „Verstanden“ speichern wir Ihre Bestätigung lokal in diesem Browser, damit der Hinweis auf DE, EN und FR nicht erneut erscheint.",
            details: "Details",
            acknowledge: "Verstanden",
            dialogTitle: "Datenschutz-Information",
            dialogText: "Der aktuelle Hinweis ist keine Einwilligungsabfrage. Die gespeicherte Bestätigung enthält nur Status, Zeitpunkt und Version des Hinweises; sie dient ausschließlich dazu, den Hinweis nicht wiederholt anzuzeigen.",
            necessaryTitle: "Technisch erforderliche Funktionen",
            necessaryText: "Die Website wird über GitHub Pages bereitgestellt. Serverprotokolle können zur Sicherheit und für den technischen Betrieb verarbeitet werden.",
            close: "Schließen",
            consentTitle: "Ihre Cookie-Einstellungen",
            consentText: "Optionale Dienste werden erst nach Ihrer Einwilligung geladen. Technisch erforderliche Funktionen sind nicht Teil dieser Auswahl.",
            reject: "Ohne Einwilligung weiter",
            accept: "Alle akzeptieren",
            save: "Auswahl speichern",
            preferences: "Einstellungen",
            footerPreferences: "Datenschutz-Einstellungen",
            withdrawal: "Sie können Ihre Einwilligung jederzeit über „Datenschutz-Einstellungen“ im Seitenfuß ändern oder widerrufen.",
            categories: { statistics: "Statistik", marketing: "Marketing", external_media: "Externe Medien", preferences: "Präferenzen" }
        },
        en: {
            noticeTitle: "Cookie & Privacy Notice",
            noticeText: "This website currently uses only technically necessary functions. No analytics, marketing or third-party media cookies are loaded.",
            noticeStorage: "By selecting “Understood”, your acknowledgement is stored locally in this browser so that the notice does not reappear on DE, EN or FR.",
            details: "Details",
            acknowledge: "Understood",
            dialogTitle: "Privacy Information",
            dialogText: "The current notice is not a consent request. The stored acknowledgement contains only the status, time and version of this notice; it is used solely to avoid showing the notice repeatedly.",
            necessaryTitle: "Technically necessary functions",
            necessaryText: "The website is provided through GitHub Pages. Server logs may be processed for security and technical operation.",
            close: "Close",
            consentTitle: "Your cookie preferences",
            consentText: "Optional services are loaded only after your consent. Technically necessary functions are not part of this selection.",
            reject: "Continue without consent",
            accept: "Accept all",
            save: "Save selection",
            preferences: "Settings",
            footerPreferences: "Privacy settings",
            withdrawal: "You can change or withdraw your consent at any time using “Privacy settings” in the page footer.",
            categories: { statistics: "Statistics", marketing: "Marketing", external_media: "External media", preferences: "Preferences" }
        },
        fr: {
            noticeTitle: "Information sur les cookies et la confidentialité",
            noticeText: "Ce site utilise actuellement uniquement des fonctions techniquement nécessaires. Aucun cookie de statistiques, de marketing ou de média tiers n’est chargé.",
            noticeStorage: "En sélectionnant « Compris », votre confirmation est enregistrée localement dans ce navigateur afin que l’avis ne réapparaisse pas sur DE, EN ou FR.",
            details: "Détails",
            acknowledge: "Compris",
            dialogTitle: "Informations sur la confidentialité",
            dialogText: "L’avis actuel n’est pas une demande de consentement. La confirmation enregistrée contient uniquement le statut, la date et la version de cet avis ; elle sert exclusivement à éviter son affichage répété.",
            necessaryTitle: "Fonctions techniquement nécessaires",
            necessaryText: "Le site est fourni via GitHub Pages. Des journaux de serveur peuvent être traités à des fins de sécurité et de fonctionnement technique.",
            close: "Fermer",
            consentTitle: "Vos préférences de cookies",
            consentText: "Les services optionnels ne sont chargés qu’après votre consentement. Les fonctions techniquement nécessaires ne font pas partie de ce choix.",
            reject: "Continuer sans consentement",
            accept: "Tout accepter",
            save: "Enregistrer la sélection",
            preferences: "Paramètres",
            footerPreferences: "Paramètres de confidentialité",
            withdrawal: "Vous pouvez modifier ou retirer votre consentement à tout moment via « Paramètres de confidentialité » dans le pied de page.",
            categories: { statistics: "Statistiques", marketing: "Marketing", external_media: "Médias externes", preferences: "Préférences" }
        }
    }[language];

    function readState() {
        try {
            const raw = window.localStorage.getItem(config.consentKey);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function saveState(mode, choices = {}) {
        const state = {
            version: config.version,
            mode,
            choices,
            timestamp: new Date().toISOString(),
            scope: "shop-language-shared"
        };
        try {
            window.localStorage.setItem(config.consentKey, JSON.stringify(state));
        } catch (_) {
            // If storage is unavailable, the notice is still dismissed for the current page only.
        }
        if (mode === "consent") loadConsentedServices(state);
        return state;
    }

    function hasCurrentState() {
        const state = readState();
        return Boolean(state && state.version === config.version && state.scope === "shop-language-shared");
    }

    function loadConsentedServices(state) {
        if (!state || !state.choices) return;
        optionalServices.forEach((service) => {
            if (state.choices[service.category] === true && !service.__loaded) {
                service.__loaded = true;
                service.load();
            }
        });
    }

    function categoryGroups() {
        return optionalServices.reduce((groups, service) => {
            if (!groups[service.category]) groups[service.category] = [];
            groups[service.category].push(service);
            return groups;
        }, {});
    }

    function ensureStyles() {
        if (document.getElementById("nv-cookie-runtime-styles")) return;
        const style = document.createElement("style");
        style.id = "nv-cookie-runtime-styles";
        style.textContent = `
            .nv-cookie-dialog-open { overflow: hidden; }
            #nv-cookie-dialog[hidden] { display: none; }
            #nv-cookie-dialog { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 1.25rem; background: rgba(18, 28, 38, .68); }
            .nv-cookie-panel { width: min(100%, 680px); max-height: min(720px, calc(100vh - 2.5rem)); overflow-y: auto; background: #fff; color: #3a3a3a; border-radius: 10px; box-shadow: 0 16px 48px rgba(0,0,0,.28); padding: 1.5rem; }
            .nv-cookie-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
            .nv-cookie-header h2, .nv-cookie-banner h2 { color: #2c3e50; font-family: Georgia, serif; line-height: 1.2; }
            .nv-cookie-header h2 { font-size: 1.8rem; }
            .nv-cookie-close { appearance: none; border: 0; background: transparent; color: #2c3e50; cursor: pointer; font-size: 2rem; line-height: 1; padding: .1rem .35rem; }
            .nv-cookie-panel p, .nv-cookie-banner p { color: #4a4a4a; font-size: .95rem; line-height: 1.65; }
            .nv-cookie-category { margin-top: 1.25rem; padding: 1rem; background: #f9f9f9; border-left: 4px solid #d4af37; }
            .nv-cookie-toggle { display: flex; align-items: center; gap: .65rem; color: #2c3e50; font-weight: 700; cursor: pointer; }
            .nv-cookie-toggle input { width: 1.15rem; height: 1.15rem; accent-color: #2c3e50; }
            .nv-cookie-category ul { margin: .7rem 0 0 1.1rem; color: #4a4a4a; font-size: .9rem; }
            .nv-cookie-note { margin-top: 1.25rem; }
            .nv-cookie-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .75rem; margin-top: 1.25rem; }
            .nv-cookie-button { min-height: 44px; border-radius: 4px; padding: .7rem 1rem; font: inherit; font-weight: 700; cursor: pointer; transition: background .2s ease, border-color .2s ease; }
            .nv-cookie-button-primary { border: 2px solid #d4af37; background: #d4af37; color: #1a2431; }
            .nv-cookie-button-primary:hover { background: #c99d2a; border-color: #c99d2a; }
            .nv-cookie-button-secondary { border: 2px solid #2c3e50; background: #fff; color: #2c3e50; }
            .nv-cookie-button-secondary:hover { background: #eef1f3; }
            .nv-cookie-button:focus-visible, .nv-cookie-close:focus-visible, .footer-cookie-button:focus-visible { outline: 3px solid #1a73e8; outline-offset: 3px; }
            .nv-cookie-banner { position: fixed; z-index: 2900; right: 1rem; bottom: 1rem; left: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; max-width: 1100px; margin: 0 auto; padding: 1.25rem; background: #fff; color: #3a3a3a; border: 1px solid #e8e8e8; border-left: 5px solid #d4af37; border-radius: 8px; box-shadow: 0 12px 36px rgba(0,0,0,.22); }
            .nv-cookie-banner h2 { font-size: 1.35rem; margin-bottom: .35rem; }
            .nv-cookie-banner .nv-cookie-actions { margin-top: 0; flex-shrink: 0; }
            .footer-cookie-button { appearance: none; border: 0; background: transparent; color: #d4af37; font: inherit; font-size: .9rem; cursor: pointer; padding: 0; margin: 0 1.5rem; }
            .footer-cookie-button:hover { color: #fff; text-decoration: underline; }
            @media (max-width: 768px) { .nv-cookie-banner { display: block; right: .75rem; bottom: .75rem; left: .75rem; } .nv-cookie-banner .nv-cookie-actions { justify-content: stretch; margin-top: 1rem; } .nv-cookie-banner .nv-cookie-button, .nv-cookie-actions .nv-cookie-button { flex: 1 1 auto; } .footer-cookie-button { margin: 0 .6rem; } }
        `;
        document.head.appendChild(style);
    }

    function getDialog() {
        let dialog = document.getElementById("nv-cookie-dialog");
        if (!dialog) {
            dialog = document.createElement("div");
            dialog.id = "nv-cookie-dialog";
            dialog.hidden = true;
            document.body.appendChild(dialog);
        }
        return dialog;
    }

    function closeDialog() {
        const dialog = getDialog();
        dialog.hidden = true;
        document.body.classList.remove("nv-cookie-dialog-open");
    }

    function openInfo() {
        const dialog = getDialog();
        dialog.innerHTML = `
            <div class="nv-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="nv-cookie-title" aria-describedby="nv-cookie-description">
                <div class="nv-cookie-header"><h2 id="nv-cookie-title">${copy.dialogTitle}</h2><button class="nv-cookie-close" type="button" data-nv-close aria-label="${copy.close}">×</button></div>
                <p id="nv-cookie-description">${copy.dialogText}</p>
                <section class="nv-cookie-category"><h3>${copy.necessaryTitle}</h3><p>${copy.necessaryText}</p></section>
                <div class="nv-cookie-actions"><button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-close>${copy.close}</button></div>
            </div>`;
        dialog.querySelectorAll("[data-nv-close]").forEach((button) => button.addEventListener("click", closeDialog));
        dialog.hidden = false;
        document.body.classList.add("nv-cookie-dialog-open");
        dialog.querySelector("button")?.focus();
    }

    function openPreferences() {
        if (!hasOptionalServices) {
            openInfo();
            return;
        }
        const state = readState() || {};
        const previousChoices = state.choices || {};
        const groups = categoryGroups();
        const categories = Object.entries(groups).map(([category, services]) => `
            <section class="nv-cookie-category">
                <label class="nv-cookie-toggle"><input type="checkbox" name="${escapeAttribute(category)}" ${previousChoices[category] ? "checked" : ""}><span>${copy.categories[category] || category}</span></label>
                <ul>${services.map((service) => `<li><strong>${escapeHtml(service.name || service.id)}</strong> – ${escapeHtml(service.provider || "")}: ${escapeHtml(service.purpose || "")}</li>`).join("")}</ul>
            </section>`).join("");
        const dialog = getDialog();
        dialog.innerHTML = `
            <div class="nv-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="nv-cookie-title" aria-describedby="nv-cookie-description">
                <div class="nv-cookie-header"><h2 id="nv-cookie-title">${copy.consentTitle}</h2><button class="nv-cookie-close" type="button" data-nv-close aria-label="${copy.close}">×</button></div>
                <p id="nv-cookie-description">${copy.consentText}</p>
                ${categories}
                <p class="nv-cookie-note">${copy.withdrawal}</p>
                <div class="nv-cookie-actions"><button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-reject>${copy.reject}</button><button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-save>${copy.save}</button></div>
            </div>`;
        dialog.querySelectorAll("[data-nv-close]").forEach((button) => button.addEventListener("click", closeDialog));
        dialog.querySelector("[data-nv-reject]")?.addEventListener("click", () => {
            saveState("consent", Object.fromEntries(Object.keys(groups).map((category) => [category, false])));
            removeBanner();
            closeDialog();
        });
        dialog.querySelector("[data-nv-save]")?.addEventListener("click", () => {
            const choices = {};
            dialog.querySelectorAll("input[type='checkbox'][name]").forEach((input) => { choices[input.name] = input.checked; });
            saveState("consent", choices);
            removeBanner();
            closeDialog();
        });
        dialog.hidden = false;
        document.body.classList.add("nv-cookie-dialog-open");
        dialog.querySelector("button")?.focus();
    }

    function removeBanner() {
        document.getElementById("nv-cookie-banner")?.remove();
    }

    function renderNoticeBanner() {
        if (document.getElementById("nv-cookie-banner")) return;
        const banner = document.createElement("section");
        banner.id = "nv-cookie-banner";
        banner.className = "nv-cookie-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", copy.noticeTitle);
        banner.innerHTML = `
            <div><h2>${copy.noticeTitle}</h2><p>${copy.noticeText}</p><p>${copy.noticeStorage}</p></div>
            <div class="nv-cookie-actions"><button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-info>${copy.details}</button><button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-acknowledge>${copy.acknowledge}</button></div>`;
        document.body.appendChild(banner);
        banner.querySelector("[data-nv-info]")?.addEventListener("click", openInfo);
        banner.querySelector("[data-nv-acknowledge]")?.addEventListener("click", () => {
            saveState("notice");
            removeBanner();
        });
    }

    function renderConsentBanner() {
        if (document.getElementById("nv-cookie-banner")) return;
        const categories = [...new Set(optionalServices.map((service) => copy.categories[service.category] || service.category))].join(", ");
        const groups = categoryGroups();
        const banner = document.createElement("section");
        banner.id = "nv-cookie-banner";
        banner.className = "nv-cookie-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", copy.consentTitle);
        banner.innerHTML = `
            <div><h2>${copy.consentTitle}</h2><p>${copy.consentText} ${categories}.</p></div>
            <div class="nv-cookie-actions"><button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-reject>${copy.reject}</button><button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-preferences>${copy.preferences}</button><button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-accept>${copy.accept}</button></div>`;
        document.body.appendChild(banner);
        banner.querySelector("[data-nv-reject]")?.addEventListener("click", () => {
            saveState("consent", Object.fromEntries(Object.keys(groups).map((category) => [category, false])));
            removeBanner();
        });
        banner.querySelector("[data-nv-preferences]")?.addEventListener("click", openPreferences);
        banner.querySelector("[data-nv-accept]")?.addEventListener("click", () => {
            saveState("consent", Object.fromEntries(Object.keys(groups).map((category) => [category, true])));
            removeBanner();
        });
    }

    function installPreferencesLink() {
        if (!hasOptionalServices || document.getElementById("nv-cookie-settings")) return;
        const footer = document.querySelector(".footer-links");
        if (!footer) return;
        const button = document.createElement("button");
        button.type = "button";
        button.id = "nv-cookie-settings";
        button.className = "footer-cookie-button";
        button.textContent = copy.footerPreferences;
        button.addEventListener("click", openPreferences);
        footer.appendChild(button);
    }

    function escapeHtml(value) {
        const node = document.createElement("span");
        node.textContent = String(value);
        return node.innerHTML;
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#96;");
    }

    function initialize() {
        if (initialized) return;
        initialized = true;
        ensureStyles();
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !getDialog().hidden) closeDialog();
        });
        if (hasOptionalServices) {
            installPreferencesLink();
            const state = readState();
            if (hasCurrentState()) loadConsentedServices(state);
            else renderConsentBanner();
        } else if (!hasCurrentState()) {
            renderNoticeBanner();
        }
    }

    window.NuevaVidaCookieConsent = {
        getState: readState,
        openPreferences,
        reset: () => {
            try { window.localStorage.removeItem(config.consentKey); } catch (_) { /* ignored */ }
            removeBanner();
            hasOptionalServices ? renderConsentBanner() : renderNoticeBanner();
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
