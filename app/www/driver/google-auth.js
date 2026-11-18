/* ZEVON Driver Google Identity Services — identity handshake only.
 * This frontend deliberately does NOT grant driver access, decode/trust the ID token,
 * persist it, or send it anywhere. Server-side token verification and driver allowlisting
 * must be implemented before any driver data or actions are enabled.
 */
(() => {
  "use strict";

  const CLIENT_ID = "700434717568-3uhka3n6hhmc60er1vmi7ml1mlfq9cek.apps.googleusercontent.com";
  const buttonHost = document.getElementById("google-signin-button");
  const status = document.getElementById("google-signin-status");

  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.dataset.kind = kind || "info";
    status.hidden = false;
  }

  function initialiseGoogleSignIn() {
    if (!buttonHost || !status) return;
    if (!window.google || !google.accounts || !google.accounts.id) {
      setStatus("Google Sign-In could not load. Check your connection and refresh.", "error");
      return;
    }

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: () => {
        // Intentionally do not persist, decode, log, or transmit the credential.
        setStatus(
          "Google identity response received. ZEVON driver approval and secure session verification are not connected yet; no trip data or driver actions are available.",
          "success"
        );
      },
      ux_mode: "popup",
      auto_select: false
    });

    google.accounts.id.renderButton(buttonHost, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: 260
    });
  }

  window.addEventListener("load", initialiseGoogleSignIn, { once: true });
})();
