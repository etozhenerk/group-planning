"use strict";
// Prototype navigation only. No API, export, permissions or gallery writes.
// Replaces only action/status markup, so inherited photo-stack state survives.
const setupDownloadPrototype = () => {
    let changing = false;
    document.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const link = target.closest(".album-actions a");
        if (!link || !/\/(web-desktop|web-mobile|ios|android)-(preparing|cancelled)\.html$/.test(link.pathname)) {
            return;
        }
        event.preventDefault();
        if (changing) {
            return;
        }
        changing = true;
        try {
            const response = await fetch(link.href, { cache: "no-store" });
            if (!response.ok) {
                throw new Error("Prototype state unavailable");
            }
            const next = new DOMParser().parseFromString(await response.text(), "text/html");
            const actions = next.querySelector(".album-actions");
            const current = document.querySelector(".album-actions");
            if (!actions || !current) {
                throw new Error("Prototype action markup missing");
            }
            current.replaceWith(actions);
            document.querySelector(".download-feedback")?.remove();
            history.replaceState(null, "", link.href);
            document.querySelector(".album-actions a:last-child")?.focus();
        }
        catch {
            // Fail visibly by opening the selected static state; never imply a save.
            window.location.assign(link.href);
        }
        finally {
            changing = false;
        }
    });
};
setupDownloadPrototype();
