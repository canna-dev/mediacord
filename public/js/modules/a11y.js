// Accessibility enhancements for MediaCord

function trapFocus(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (!modal) return;
    const focusable = modal.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    });
}

function setAriaLive(regionSelector, message) {
    let region = document.querySelector(regionSelector);
    if (!region) {
        region = document.createElement('div');
        region.setAttribute('aria-live', 'polite');
        region.style.position = 'absolute';
        region.style.left = '-9999px';
        region.id = 'aria-live-region';
        document.body.appendChild(region);
    }
    region.textContent = message;
}

export { trapFocus, setAriaLive };
