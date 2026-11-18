(() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzlXJuFReuz1ywj4_KORsBMM7fSs_k5zb4euNA-5pOLEMGF9Pq2Bz3pkcspSs0AxhIx/exec';
  const form = document.getElementById('booking-form');
  const statusBox = document.getElementById('form-status');
  const submitButton = document.getElementById('submit-btn');
  const dateInput = document.getElementById('travel-date');
  const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = localToday;
  dateInput.value = localToday;
  document.getElementById('year').textContent = new Date().getFullYear();

  document.querySelectorAll('[data-trip]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-trip]').forEach(item => item.classList.toggle('active', item === button));
      document.getElementById('trip').value = button.dataset.trip;
    });
  });

  function validPhone(value) {
    const raw = String(value || '').trim();
    if (!raw || /[^0-9+\s\-().]/.test(raw) || raw.lastIndexOf('+') > 0) return '';
    let digits = raw.replace(/\D/g, '');
    if (raw[0] === '+') {
      if (digits.startsWith('91')) return /^91[6-9]\d{9}$/.test(digits) && !/^(\d)\1+$/.test(digits.slice(2)) ? '+' + digits : '';
      return digits.length >= 8 && digits.length <= 15 ? '+' + digits : '';
    }
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1);
    return /^[6-9]\d{9}$/.test(digits) && !/^(\d)\1{9}$/.test(digits) ? '+91' + digits : '';
  }

  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const callback = 'zevonApp_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('ZEVON response timed out')); }, 12000);
      function cleanup() { clearTimeout(timer); delete window[callback]; script.remove(); }
      window[callback] = data => { cleanup(); resolve(data); };
      script.onerror = () => { cleanup(); reject(new Error('ZEVON service unavailable')); };
      script.src = ENDPOINT + '?' + new URLSearchParams({ ...params, callback }).toString();
      document.head.appendChild(script);
    });
  }

  function requestId() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const payloadHash = payload => JSON.stringify(Object.keys(payload).sort().map(key => [key, payload[key]]));

  async function submitEnquiry(payload) {
    const hash = payloadHash(payload);
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem('zevonPendingEnquiry') || 'null'); } catch (_) {}
    const rid = pending && pending.hash === hash ? pending.rid : requestId();
    sessionStorage.setItem('zevonPendingEnquiry', JSON.stringify({ hash, rid }));

    try {
      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...payload, requestId: rid })
      });
    } catch (_) {
      // The request outcome is uncertain; acknowledgement polling below is authoritative.
    }

    for (let attempt = 0; attempt < 10; attempt++) {
      await wait(attempt === 0 ? 1000 : 1500);
      try {
        const receipt = await jsonp({ action: 'ack', rid });
        if (receipt && receipt.found) {
          if (receipt.ok === false) throw new Error(receipt.error || 'The request was not accepted.');
          if (receipt.ok && receipt.id) {
            sessionStorage.removeItem('zevonPendingEnquiry');
            return receipt;
          }
        }
      } catch (error) {
        if (error.message && error.message !== 'ZEVON response timed out' && error.message !== 'ZEVON service unavailable') throw error;
      }
    }
    throw new Error('We could not verify receipt of this enquiry. Please contact ZEVON before submitting it again.');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    statusBox.className = 'form-status show';
    statusBox.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const phone = validPhone(data.phone);
    if (!phone) {
      statusBox.className = 'form-status show error';
      statusBox.textContent = 'Please enter a valid mobile number, for example +91 98765 43210.';
      document.getElementById('phone').focus();
      return;
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      statusBox.className = 'form-status show error';
      statusBox.textContent = 'Please check the email address and try again.';
      return;
    }

    data.phone = phone;
    data.action = 'booking';
    data.website = 'ZEVON Mobility App';
    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Sending enquiry…';
    statusBox.textContent = 'Submitting your request to ZEVON securely…';

    try {
      const receipt = await submitEnquiry(data);
      statusBox.className = 'form-status show success';
      statusBox.textContent = 'Enquiry received. Your reference is ' + receipt.id + '. This is not a confirmed booking; the ZEVON team will review availability and contact you.';
      form.reset();
      dateInput.value = localToday;
      document.getElementById('trip').value = 'Airport transfer';
      document.querySelectorAll('[data-trip]').forEach(button => button.classList.toggle('active', button.dataset.trip === 'Airport transfer'));
    } catch (error) {
      statusBox.className = 'form-status show error';
      statusBox.textContent = error.message || 'We could not submit the enquiry. Please contact ZEVON directly.';
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Send trip enquiry';
    }
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();