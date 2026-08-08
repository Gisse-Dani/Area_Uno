(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const params = new URLSearchParams(window.location.search);
  const reasonFromUrl = params.get('motivo');
  const reasonSelect = form.elements.reason;
  if (reasonFromUrl && reasonSelect) {
    const option = [...reasonSelect.options].find(item => item.value.toLowerCase() === reasonFromUrl.toLowerCase());
    if (option) reasonSelect.value = option.value;
  }

  const setError = (name, message = '') => {
    const input = form.elements[name];
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) error.textContent = message;
  };

  const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());

  const validate = () => {
    let ok = true;
    const email = form.elements.email.value.trim();
    const confirm = form.elements.emailConfirm.value.trim();
    const reason = form.elements.reason.value.trim();
    const message = form.elements.message.value.trim();

    ['email', 'emailConfirm', 'reason', 'message'].forEach(name => setError(name, ''));

    if (!validEmail(email)) { setError('email', 'Ingresá un correo electrónico válido.'); ok = false; }
    if (!validEmail(confirm)) { setError('emailConfirm', 'Confirmá un correo electrónico válido.'); ok = false; }
    else if (email.toLowerCase() !== confirm.toLowerCase()) { setError('emailConfirm', 'Los correos electrónicos no coinciden.'); ok = false; }
    if (!reason) { setError('reason', 'Seleccioná el motivo de la consulta.'); ok = false; }
    if (message.length < 10) { setError('message', 'Contanos un poco más para poder ayudarte.'); ok = false; }

    return ok;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form-status';
    if (!validate()) {
      status.textContent = 'Revisá los campos marcados antes de enviar.';
      status.classList.add('is-error');
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      emailConfirm: form.elements.emailConfirm.value.trim(),
      reason: form.elements.reason.value.trim(),
      message: form.elements.message.value.trim(),
      website: form.elements.website.value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
    status.textContent = 'Estamos enviando tu consulta.';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No pudimos enviar la consulta.');

      form.reset();
      status.textContent = 'Consulta enviada correctamente. Te responderemos a la brevedad.';
      status.classList.add('is-success');
    } catch (error) {
      status.textContent = error.message || 'No pudimos enviar la consulta. Probá nuevamente o escribinos por WhatsApp.';
      status.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar consulta';
    }
  });
})();
