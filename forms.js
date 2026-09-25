/*
  Form feedback for the website forms (add data-ajax to a <form> to use it).
  Works with the Google Apps Script form handler (_apps-script/Code.gs) or Formspree.
  - Checks fields as the user fills them in and shows a message under any problem field.
  - Submits in the background so the user stays on the page, then shows a success or error message.
  Customize the success message with a data-success attribute on the <form>;
  {field_name} placeholders are filled in from the submitted values.
  Without JavaScript, the forms still post the normal way.
*/
(function () {
  var forms = document.querySelectorAll('form[data-ajax]');

  forms.forEach(function (form) {
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.textContent;
    var fields = form.querySelectorAll('input:not([type="hidden"]):not([name^="_"]), textarea, select');

    var status = document.createElement('div');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    btn.insertAdjacentElement('afterend', status);

    // Validation is handled here, so turn off the browser's popup bubbles.
    form.noValidate = true;

    fields.forEach(function (field) {
      var err = document.createElement('p');
      err.className = 'field-error';
      err.id = field.id + '-error';
      field.insertAdjacentElement('afterend', err);

      field.addEventListener('blur', function () {
        if (field.value !== '') field.classList.add('touched');
        checkField(field);
      });
      field.addEventListener('input', function () {
        if (field.classList.contains('touched')) checkField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearStatus();

      var firstInvalid = null;
      fields.forEach(function (field) {
        field.classList.add('touched');
        if (!checkField(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showStatus('error', 'Please fix the highlighted fields and try again.');
        return;
      }

      var data = new FormData(form);
      // Sent URL-encoded: Google Apps Script only reads fields sent this way.
      var body = new URLSearchParams(data);
      body.append('_ajax', '1');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: body,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (json) {
            // Apps Script always replies 200 and reports failure as { ok: false, error };
            // Formspree uses the HTTP status and { errors: [{ message }] }.
            if (res.ok && json.ok !== false) {
              showStatus('success', successMessage(form, data));
              form.reset();
              fields.forEach(function (field) {
                field.classList.remove('touched');
                checkField(field);
              });
              return;
            }
            var msg = json.error || (json.errors
              ? json.errors.map(function (x) { return x.message; }).join(' ')
              : '');
            showStatus('error', 'Sorry, your submission didn’t go through. ' + (msg || 'Please try again.'));
          });
        })
        .catch(function () {
          showStatus('error', 'Couldn’t reach the server. Check your internet connection and try again.');
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = btnLabel;
        });
    });

    function showStatus(kind, msg) {
      status.className = 'form-status form-status--' + kind;
      status.textContent = msg;
    }

    function clearStatus() {
      status.className = 'form-status';
      status.textContent = '';
    }
  });

  function checkField(field) {
    var err = document.getElementById(field.id + '-error');
    var valid = field.checkValidity();
    var show = !valid && field.classList.contains('touched');
    err.textContent = show ? errorText(field) : '';
    if (show) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', err.id);
    } else {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    return valid;
  }

  function errorText(field) {
    var v = field.validity;
    if (v.valueMissing) return 'This field is required.';
    if (v.typeMismatch && field.type === 'email') return 'Please enter a valid email address, like jane@example.com.';
    if (v.rangeUnderflow) return 'Please enter a number that is ' + field.min + ' or more.';
    if (v.stepMismatch || v.badInput) return 'Please enter a valid number.';
    return field.validationMessage;
  }

  function successMessage(form, data) {
    var template = form.dataset.success || 'Thanks, {name}! Your submission was received.';
    return template.replace(/\{(\w+)\}/g, function (_, key) {
      var value = (data.get(key) || '').toString().trim();
      var input = form.querySelector('[name="' + key + '"]');
      if (key === 'name') value = value.split(/\s+/)[0];
      if (input && input.type === 'date' && value) {
        value = new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return value;
    });
  }
})();
