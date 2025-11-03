// Simple user feedback modal for MediaCord
import { trapFocus, setAriaLive } from './a11y.js';

function showFeedbackModal() {
    let modal = document.getElementById('feedback-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'feedback-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn" id="close-feedback" tabindex="0" aria-label="Close feedback modal">&times;</span>
                <h2>Send Feedback</h2>
                <form id="feedback-form">
                    <textarea id="feedback-text" rows="4" placeholder="Your feedback..." aria-label="Feedback"></textarea>
                    <button type="submit" class="btn btn-primary">Send</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        trapFocus('#feedback-modal');
        document.getElementById('close-feedback').onclick = () => modal.remove();
        document.getElementById('feedback-form').onsubmit = function(e) {
            e.preventDefault();
            const text = document.getElementById('feedback-text').value.trim();
            if (text.length < 5) {
                setAriaLive('#aria-live-region', 'Please enter more detailed feedback.');
                alert('Please enter more detailed feedback.');
                return;
            }
            // For demo: just show a thank you message
            modal.innerHTML = `<div class="modal-content"><h2>Thank you!</h2><p>Your feedback was sent.</p></div>`;
            setAriaLive('#aria-live-region', 'Thank you! Your feedback was sent.');
            setTimeout(() => modal.remove(), 2000);
        };
    }
    modal.style.display = 'block';
    setTimeout(() => {
        const textarea = document.getElementById('feedback-text');
        if (textarea) textarea.focus();
    }, 100);
}

export { showFeedbackModal };
