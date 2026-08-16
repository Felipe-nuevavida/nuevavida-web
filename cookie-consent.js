/*
 * Nueva Vida – gestor local de consentimiento (DE)
 *
 * Estado actual: no hay servicios opcionales configurados. Por ello no se
 * muestra un banner ni se escribe localStorage durante la visita normal.
 * Para habilitar una tecnología no esencial, declare antes de este archivo:
 *
 * window.NuevaVidaCookieConsentConfig = {
 *   services: [{
 *     id: "analytics",
 *     category: "statistics",
 *     name: "Nombre del servicio",
 *     provider: "Proveedor",
 *     purpose: "Finalidad concreta",
 *     privacyUrl: "https://…",
 *     load: () => { // cargar aquí el script SOLO tras consentimiento }
 *   }]
 * };
 */
(() => {
    "use strict";

    const defaultConfig = {
        version: "2026-08-16",
        consentKey: "nv_cookie_consent",
        services: []
    };

    const suppliedConfig = window.NuevaVidaCookieConsentConfig || {};
    const config = {
        ...defaultConfig,
        ...suppliedConfig,
        services: Array.isArray(suppliedConfig.services) ? suppliedConfig.services : defaultConfig.services
    };

    const optionalServices = config.services.filter((service) => (
        service
        && typeof service.id === "string"
        && typeof service.category === "string"
        && typeof service.load === "function"
    ));
    const hasOptionalServices = optionalServices.length > 0;
    let initialized = false;

    const categoryLabels = {
        statistics: "Statistik",
        marketing: "Marketing",
        external_media: "Externe Medien",
        preferences: "Präferenzen"
    };

    function readConsent() {
        if (!hasOptionalServices) return null;
        try {
            const value = window.localStorage.getItem(config.consentKey);
            return value ? JSON.parse(value) : null;
        } catch (_) {
            return null;
        }
    }

    function storeConsent(choices) {
        if (!hasOptionalServices) return;
        const consent = {
            version: config.version,
            timestamp: new Date().toISOString(),
            choices
        };
        try {
            window.localStorage.setItem(config.consentKey, JSON.stringify(consent));
        } catch (_) {
            // Si el navegador bloquea el almacenamiento, los servicios opcionales no se cargan.
        }
        loadConsentedServices(consent);
    }

    function loadConsentedServices(consent) {
        if (!consent || !consent.choices) return;
        optionalServices.forEach((service) => {
            if (consent.choices[service.category] === true && !service.__loaded) {
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

    function getDialog() {
        return document.getElementById("nv-cookie-dialog");
    }

    function closeDialog() {
        const dialog = getDialog();
        if (!dialog) return;
        dialog.hidden = true;
        document.body.classList.remove("nv-cookie-dialog-open");
        const trigger = document.getElementById("nv-cookie-settings");
        if (trigger) trigger.focus();
    }

    function openPreferences() {
        const dialog = getDialog();
        if (!dialog) return;
        renderPreferences();
        dialog.hidden = false;
        document.body.classList.add("nv-cookie-dialog-open");
        const firstButton = dialog.querySelector("button");
        if (firstButton) firstButton.focus();
    }

    function renderPreferences() {
        const dialog = getDialog();
        if (!dialog) return;

        if (!hasOptionalServices) {
            dialog.innerHTML = `
                <div class="nv-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="nv-cookie-title" aria-describedby="nv-cookie-description">
                    <div class="nv-cookie-header">
                        <h2 id="nv-cookie-title">Datenschutz-Einstellungen</h2>
                        <button class="nv-cookie-close" type="button" data-nv-close aria-label="Dialog schließen">×</button>
                    </div>
                    <p id="nv-cookie-description">Auf dieser Seite werden derzeit keine Cookies oder vergleichbaren Technologien für Statistik, Marketing oder externe Medien eingesetzt. Deshalb erscheint kein Einwilligungsbanner und es wird kein Einwilligungsstatus gespeichert.</p>
                    <section class="nv-cookie-category" aria-label="Technisch erforderliche Funktionen">
                        <h3>Technisch erforderliche Funktionen</h3>
                        <p>Die Website wird über GitHub Pages bereitgestellt. Serverprotokolle können zur Sicherheit und für den technischen Betrieb verarbeitet werden. Diese Vorgänge werden nicht über dieses Einstellungsfenster gesteuert.</p>
                    </section>
                    <p class="nv-cookie-note">Sobald wir optionale Dienste einsetzen, wird dieses Fenster um eine gleichwertige Auswahl zum Einwilligen oder Ablehnen ergänzt.</p>
                    <div class="nv-cookie-actions nv-cookie-actions-single">
                        <button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-close>Schließen</button>
                    </div>
                </div>`;
        } else {
            const groups = categoryGroups();
            const previousChoices = (readConsent() || {}).choices || {};
            const categories = Object.entries(groups).map(([category, services]) => {
                const label = categoryLabels[category] || category;
                const serviceDetails = services.map((service) => `
                    <li><strong>${escapeHtml(service.name || service.id)}</strong> – ${escapeHtml(service.provider || "Drittanbieter")}: ${escapeHtml(service.purpose || "Optionale Funktion")}${service.privacyUrl ? ` (<a href="${escapeAttribute(service.privacyUrl)}" target="_blank" rel="noopener noreferrer">Datenschutz</a>)` : ""}</li>`).join("");
                return `
                    <section class="nv-cookie-category">
                        <label class="nv-cookie-toggle">
                            <input type="checkbox" name="${escapeAttribute(category)}" ${previousChoices[category] ? "checked" : ""}>
                            <span>${escapeHtml(label)}</span>
                        </label>
                        <ul>${serviceDetails}</ul>
                    </section>`;
            }).join("");

            dialog.innerHTML = `
                <div class="nv-cookie-panel" role="dialog" aria-modal="true" aria-labelledby="nv-cookie-title" aria-describedby="nv-cookie-description">
                    <div class="nv-cookie-header">
                        <h2 id="nv-cookie-title">Datenschutz-Einstellungen</h2>
                        <button class="nv-cookie-close" type="button" data-nv-close aria-label="Dialog schließen">×</button>
                    </div>
                    <p id="nv-cookie-description">Sie entscheiden freiwillig, ob optionale Dienste geladen werden dürfen. Technisch erforderliche Funktionen sind nicht Teil dieser Auswahl.</p>
                    ${categories}
                    <p class="nv-cookie-note">Ihre Einwilligung können Sie jederzeit über „Datenschutz-Einstellungen“ im Seitenfuß ändern oder widerrufen.</p>
                    <div class="nv-cookie-actions">
                        <button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-reject>Ohne Einwilligung weiter</button>
                        <button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-save>Auswahl speichern</button>
                    </div>
                </div>`;
        }

        bindDialogEvents();
    }

    function renderBanner() {
        if (!hasOptionalServices || document.getElementById("nv-cookie-banner")) return;
        const categorySummary = [...new Set(optionalServices.map((service) => categoryLabels[service.category] || service.category))].join(", ");
        const banner = document.createElement("section");
        banner.id = "nv-cookie-banner";
        banner.className = "nv-cookie-banner";
        banner.setAttribute("role", "region");
        banner.setAttribute("aria-label", "Cookie-Einwilligung");
        banner.innerHTML = `
            <div>
                <h2>Ihre Datenschutz-Einstellungen</h2>
                <p>Wir möchten optionale Dienste für ${escapeHtml(categorySummary)} einsetzen. Diese werden erst nach Ihrer Einwilligung geladen. Details finden Sie in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>
            </div>
            <div class="nv-cookie-actions">
                <button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-reject>Ohne Einwilligung weiter</button>
                <button class="nv-cookie-button nv-cookie-button-secondary" type="button" data-nv-settings>Einstellungen</button>
                <button class="nv-cookie-button nv-cookie-button-primary" type="button" data-nv-accept>Alle akzeptieren</button>
            </div>`;
        document.body.appendChild(banner);
        bindBannerEvents(banner);
    }

    function removeBanner() {
        const banner = document.getElementById("nv-cookie-banner");
        if (banner) banner.remove();
    }

    function bindDialogEvents() {
        const dialog = getDialog();
        if (!dialog) return;
        dialog.querySelectorAll("[data-nv-close]").forEach((button) => button.addEventListener("click", closeDialog));
        const reject = dialog.querySelector("[data-nv-reject]");
        if (reject) reject.addEventListener("click", () => {
            const choices = Object.fromEntries(Object.keys(categoryGroups()).map((category) => [category, false]));
            storeConsent(choices);
            removeBanner();
            closeDialog();
        });
        const save = dialog.querySelector("[data-nv-save]");
        if (save) save.addEventListener("click", () => {
            const choices = {};
            dialog.querySelectorAll("input[type='checkbox'][name]").forEach((input) => {
                choices[input.name] = input.checked;
            });
            storeConsent(choices);
            removeBanner();
            closeDialog();
        });
    }

    function bindBannerEvents(banner) {
        const allCategories = Object.keys(categoryGroups());
        const reject = banner.querySelector("[data-nv-reject]");
        const settings = banner.querySelector("[data-nv-settings]");
        const accept = banner.querySelector("[data-nv-accept]");
        if (reject) reject.addEventListener("click", () => {
            storeConsent(Object.fromEntries(allCategories.map((category) => [category, false])));
            removeBanner();
        });
        if (settings) settings.addEventListener("click", openPreferences);
        if (accept) accept.addEventListener("click", () => {
            storeConsent(Object.fromEntries(allCategories.map((category) => [category, true])));
            removeBanner();
        });
    }

    function escapeHtml(value) {
        const element = document.createElement("span");
        element.textContent = String(value);
        return element.innerHTML;
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#96;");
    }

    function initialize() {
        if (initialized) return;
        initialized = true;

        const footerLink = document.getElementById("nv-cookie-settings");
        if (footerLink) footerLink.addEventListener("click", (event) => {
            event.preventDefault();
            openPreferences();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && getDialog() && !getDialog().hidden) closeDialog();
        });

        if (hasOptionalServices) {
            const consent = readConsent();
            if (consent && consent.version === config.version) {
                loadConsentedServices(consent);
            } else {
                renderBanner();
            }
        }
    }

    window.NuevaVidaCookieConsent = {
        openPreferences,
        getConsent: readConsent,
        reset: () => {
            if (!hasOptionalServices) return;
            try {
                window.localStorage.removeItem(config.consentKey);
            } catch (_) {
                // No hay acción adicional necesaria si el navegador bloquea el almacenamiento.
            }
            renderBanner();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
