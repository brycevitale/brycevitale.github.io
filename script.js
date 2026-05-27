// frontend authentication demo (NOT real security)
// just a UI lock/unlock so employers can click around

// ** constants / stored values **
const AUTH_KEY = 'bv-authenticated'; // key name I use in localStorage to remember “unlocked” state

// sha256("Bryce123")
// storing the hash (not secure... but not plaintext)
const AUTH_HASH = '8b7cbf07ff0c12ce44f337193927f3ad29cc8525b342bdf5da817c97f7da8123';

// ** grabbing elements from the page **
const authModal = document.getElementById('authModal');     // the popup overlay
const authForm = document.getElementById('authForm');       // the passphrase form
const authInput = document.getElementById('authInput');     // the password input box
const authOpen = document.getElementById('authOpen');       // button on page that opens modal (if it exists)
const authToggle = document.getElementById('authToggle');   // top “Verify Access” button
const authClose = document.getElementById('authClose');     // cancel button inside modal
const authPanel = document.getElementById('authPanel');     // the “Locked/Unlocked” panel on the page
const contactForm = document.getElementById('contactForm'); // contact form (only exists on contact page)

// ** nav helper (highlight current page) **
function getCurrentPage() {
  // pathname gives me something like "/projects.html"
  // split + pop grabs just "projects.html"
  // fallback to index.html if the URL ends in "/" (happens on some hosts)
  return window.location.pathname.split('/').pop() || 'index.html';
}

function markActiveNav() {
  const current = getCurrentPage();

  // loop through all nav links and add "active" to the one that matches this page
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('href') === current) {
      link.classList.add('active');
    }
  });
}

// ** modal open/close helper **
function toggleModal(open) {
  if (!authModal) return; // some pages don’t have the modal
  authModal.classList.toggle('hidden', !open); // hidden class controls visibility
  if (open) authInput?.focus(); // ?. avoids errors if authInput is missing
}

// ** hashing helper (browser crypto) **
// uses the browser’s built in crypto API (SubtleCrypto) which returns a Promise
async function sha256(message) { 
  const msgBuffer = new TextEncoder().encode(message);                      // string -> bytes
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);      // SHA-256 digest

  // convert the raw bytes into a hex string so it’s easy to compare/store
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0')) // padStart keeps each byte 2 hex chars (ex: 0a not a)
    .join('');
}

// ** auth state (localStorage) **
function isAuthenticated() {
  // localStorage stores strings, so I compare against "true"
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthenticated(value) {
  // save state so refresh stays unlocked
  localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');

  // refresh UI
  updateAuthState();
}

// ** update UI (locked vs unlocked) **
function updateAuthState() {
  if (authPanel) {
    // I rebuild this small panel depending on auth state
    // rel="noopener" is a small safety thing for target="_blank"
    authPanel.innerHTML = isAuthenticated()
      ? `<div class="panel-card">
           <h3>Unlocked</h3>
           <p>
             <a class="btn btn-primary" href="resume/Bryce_Vitale_Resume_5.27.26.pdf" target="_blank" rel="noopener">Open file</a>
           </p>
           <p class="hint" style="margin-top:0.75rem;">Access is stored in this browser.</p>
         </div>`
      : `<div class="panel-card">
           <h3>Locked</h3>
           <p>Enter the passphrase to unlock.</p>
         </div>`;
  }

  // update the top right button label too
  if (authToggle) {
    authToggle.textContent = isAuthenticated() ? 'Unlocked' : 'Verify Access';
  }
}

// ** contact form success message **
function showSuccessMessage(form, message) {
  // if the message already exists, remove it so I don’t stack alerts forever
  const existing = form.querySelector('.success-message');
  if (existing) existing.remove();

  // build a message div and style it inline
  const alert = document.createElement('div');
  alert.className = 'success-message';
  alert.textContent = message;
  alert.style.marginTop = '1rem';
  alert.style.padding = '1rem 1.25rem';
  alert.style.borderRadius = '18px';
  alert.style.background = 'rgba(98, 211, 255, 0.12)';
  alert.style.color = '#dff8ff';
  form.appendChild(alert);
}

// ** typing animation (data typing) **
function initializeTyping() {
  document.querySelectorAll('[data-typing]').forEach((element) => {
    const text = element.dataset.typing || '';
    let index = 0;

    // start empty
    element.textContent = '';

    // simple interval that reveals the string one character at a time
    const interval = setInterval(() => {
      element.textContent = text.slice(0, index++);
      if (index > text.length) clearInterval(interval); // stop interval or it runs forever (important)
    }, 35);
  });
}

// ** passphrase check (hash + compare) **
async function authenticatePassphrase(passphrase) {
  // trim() avoids “Bryce123 ” failing because of trailing spaces
  const digest = await sha256(passphrase.trim());
  return digest === AUTH_HASH;
}

// ** event wiring **
function bindEvents() {
  // optional chaining again because not every page has every element
  authOpen?.addEventListener('click', () => toggleModal(true));
  authToggle?.addEventListener('click', () => toggleModal(true));
  authClose?.addEventListener('click', () => toggleModal(false));

  // when the auth form submits, check passphrase and either unlock or flash an error
  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); // stops page refresh

    const passphrase = authInput?.value || '';
    const authorized = await authenticatePassphrase(passphrase);

    if (authorized) {
      setAuthenticated(true); // store + update UI
      toggleModal(false);     // close modal
      authForm.reset();       // clear input

      // bring them down to the unlocked section
      setTimeout(() => {
        const panel = document.getElementById('authPanel');
        panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        panel?.querySelector('a')?.focus();
      }, 50);

      return;
    }

    // quick error flash (CSS class gives visual feedback)
    authInput?.classList.add('input-error');
    authInput?.setAttribute('aria-invalid', 'true'); // accessibility hint for invalid input
    setTimeout(() => {
      authInput?.classList.remove('input-error');
      authInput?.removeAttribute('aria-invalid');
    }, 1200);
  });

  // contact form show success message and clears fields
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault(); // no backend here, just UI feedback
    showSuccessMessage(contactForm, 'Thanks for your message! I’ll get back to you soon.');
    contactForm.reset();
  });

  // allow Esc key to close modal
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggleModal(false);
  });
}

// ** run everything on load **
function initialize() {
  markActiveNav();     // highlight nav link
  updateAuthState();   // show Locked/Unlocked panel correctly on load
  bindEvents();        // hook up button clicks + form submits
  initializeTyping();  // start typing animation (if it exists on this page)
}

// wait for HTML before grabbing elements
document.addEventListener('DOMContentLoaded', initialize);