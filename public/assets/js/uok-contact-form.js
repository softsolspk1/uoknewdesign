(function () {
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.id !== 'uok-contact-form') return;
    e.preventDefault();

    var msgBox = document.getElementById('uok-contact-form-message');
    var submitBtn = document.getElementById('uok-contact-submit');
    var data = {
      firstname: form.firstname ? form.firstname.value : '',
      number: form.number ? form.number.value : '',
      email: form.email ? form.email.value : '',
      subject: form.subject ? form.subject.value : '',
      message: form.message ? form.message.value : '',
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Sending...</span>';
    }
    if (msgBox) msgBox.innerHTML = '';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { ok: res.ok, json: json };
        });
      })
      .then(function (result) {
        if (!msgBox) return;
        if (result.ok && result.json.success) {
          msgBox.innerHTML =
            '<div class="alert alert-success mb-4" style="border-radius:8px;padding:12px 16px;font-weight:500">&#10003; ' +
            (result.json.message || 'Thank you! Your message has been sent successfully.') +
            '</div>';
          form.reset();
        } else {
          msgBox.innerHTML =
            '<div class="alert alert-danger mb-4" style="border-radius:8px;padding:12px 16px;font-weight:500">&#10007; ' +
            (result.json.error || 'Failed to send message. Please try again.') +
            '</div>';
        }
      })
      .catch(function () {
        if (msgBox) {
          msgBox.innerHTML =
            '<div class="alert alert-danger mb-4" style="border-radius:8px;padding:12px 16px;font-weight:500">&#10007; Network error. Please try again later.</div>';
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Send Message</span><i class="fa-solid fa-paper-plane"></i>';
        }
      });
  });
})();
