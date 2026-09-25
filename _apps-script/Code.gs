/**
 * Banner Mountain Lookout Firewise Community: website form handler
 *
 * Receives submissions from the three website forms (mailing list, Action Plan
 * suggestions, hours/expense log), appends each one as a row on its own tab of
 * the spreadsheet this script is attached to, emails you a notification, and
 * emails the submitter a confirmation when they gave an email address.
 *
 * This folder starts with "_" so GitHub Pages does not publish it on the site.
 *
 * ── SETUP (one time, about 15 minutes) ─────────────────────────────────────
 * 1. Sign in to the Google account that should own the data, and create a new
 *    Google Sheet (e.g. "BMLFWC Website Submissions").
 * 2. In the Sheet: Extensions → Apps Script. Delete the sample code, paste in
 *    this whole file, and click Save.
 * 3. Review the SETTINGS section below (defaults are fine to start). Then
 *    open Project Settings (gear icon, left side) and set Time zone to
 *    "(GMT-08:00) Pacific Time" so timestamps and dates come out right.
 * 4. In the function dropdown at the top, pick "setup" and click Run. Google
 *    will ask you to authorize the script (it needs to edit this spreadsheet
 *    and send email as you). Click through "Advanced → Go to … (unsafe)"; that
 *    warning appears for any personal script that Google hasn't reviewed.
 *    This creates the three tabs with header rows.
 * 5. Deploy → New deployment → gear icon → "Web app":
 *      Description:     Website forms
 *      Execute as:      Me
 *      Who has access:  Anyone
 *    Click Deploy and copy the "Web app URL" (ends in /exec).
 * 6. Put that URL into the action="…" of each form on the website.
 *
 * ── UPDATING THIS SCRIPT LATER ─────────────────────────────────────────────
 * After editing, use Deploy → Manage deployments → pencil icon → Version:
 * "New version" → Deploy. This keeps the same URL. (Creating a *new*
 * deployment instead gives you a new URL and the website forms would need
 * updating.)
 */

// ── SETTINGS ─────────────────────────────────────────────────────────────────

// Where submission notifications go. Leave blank to use the account that owns
// this script. Separate multiple addresses with commas.
var NOTIFY_EMAIL = '';

// Set to false to stop the notification email for each submission (you can
// still turn on Tools → Notification settings in the Sheet itself).
var NOTIFY_ON_SUBMIT = true;

// Set to false to stop confirmation emails to people who submit a form.
var SEND_CONFIRMATIONS = true;

var SITE_NAME = 'Banner Mountain Lookout Firewise Community';
var SITE_URL = 'https://bmlfirewise.org';

// Longest value accepted for any one field, to keep out junk.
var MAX_FIELD_LENGTH = 5000;

// One entry per website form. The key must match the hidden "_form" field in
// the form's HTML. Columns are written in this order after a Timestamp column.
var FORMS = {
  mailing_list: {
    sheet: 'Mailing List',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', required: true, type: 'email' },
      { name: 'phone', label: 'Phone' },
      { name: 'parcel_address', label: 'Parcel Address', required: true }
    ],
    confirmSubject: 'You’re on the ' + SITE_NAME + ' mailing list',
    confirmBody: function (d) {
      return 'Hi ' + firstName(d.name) + ',\n\n' +
        'Thanks for signing up. We’ll keep you posted about community meetings, program updates, and next steps.\n\n' +
        (d.phone ? 'You also shared a phone number (' + d.phone + ') for text alerts. Reply STOP to any text to opt out.\n\n' : '') +
        'If you didn’t sign up, just ignore this email.\n\n' +
        SITE_NAME + '\n' + SITE_URL;
    }
  },

  action_plan: {
    sheet: 'Action Plan Suggestions',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'parcel_address', label: 'Parcel Address', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'suggested_task', label: 'Suggested Task', required: true },
      { name: 'details', label: 'Details' }
    ],
    confirmSubject: 'We received your Action Plan suggestion',
    confirmBody: function (d) {
      return 'Hi ' + firstName(d.name) + ',\n\n' +
        'Thanks for your suggestion for our 3-year Action Plan:\n\n' +
        '  ' + d.suggested_task + '\n\n' +
        'We’ll review it with the other suggestions and may follow up with you.\n\n' +
        SITE_NAME + '\n' + SITE_URL;
    }
  },

  log_hours: {
    sheet: 'Hours & Expenses',
    columns: [
      { name: 'name', label: 'Name', required: true },
      { name: 'parcel_address', label: 'Parcel Address', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'date', label: 'Date', required: true, type: 'date' },
      { name: 'hours', label: 'Hours', type: 'number' },
      { name: 'amount_spent', label: 'Amount Spent ($)', type: 'number' },
      { name: 'description', label: 'Description', required: true }
    ],
    confirmSubject: 'Your Firewise hours/expense entry was logged',
    confirmBody: function (d) {
      return 'Hi ' + firstName(d.name) + ',\n\n' +
        'Thanks for logging your wildfire-safety work. Here’s what we recorded:\n\n' +
        '  Date:         ' + d.date + '\n' +
        (d.hours ? '  Hours:        ' + d.hours + '\n' : '') +
        (d.amount_spent ? '  Amount spent: $' + d.amount_spent + '\n' : '') +
        '  Work done:    ' + d.description + '\n\n' +
        'Every hour and dollar counts toward our annual Firewise USA recognition. ' +
        'If anything above is wrong, just reply to this email.\n\n' +
        SITE_NAME + '\n' + SITE_URL;
    }
  }
};

// ── WEB APP ──────────────────────────────────────────────────────────────────

function doPost(e) {
  var p = (e && e.parameter) || {};
  // forms.js sends _ajax=1; without it the visitor has JavaScript off and
  // was sent here by a normal form post, so show them a page, not JSON.
  var ajax = p._ajax === '1';

  try {
    // Hidden "_gotcha" field: people never see it, spam bots fill it in.
    // Pretend it worked so the bot moves on.
    if (p._gotcha) return respond(ajax, true);

    var form = FORMS[p._form];
    if (!form) return respond(ajax, false, 'Unknown form.');

    var data = {};
    var problems = [];
    form.columns.forEach(function (col) {
      var value = String(p[col.name] || '').trim();
      if (value.length > MAX_FIELD_LENGTH) {
        problems.push(col.label + ' is too long.');
      } else if (!value) {
        if (col.required) problems.push(col.label + ' is required.');
      } else if (col.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        problems.push(col.label + ' is not a valid email address.');
      } else if (col.type === 'number' && !(Number(value) >= 0)) {
        problems.push(col.label + ' must be a number of 0 or more.');
      } else if (col.type === 'date' && !parseDate(value)) {
        problems.push(col.label + ' is not a valid date.');
      }
      data[col.name] = value;
    });
    if (problems.length) return respond(ajax, false, problems.join(' '));

    var row = [new Date()].concat(form.columns.map(function (col) {
      var value = data[col.name];
      if (!value) return '';
      if (col.type === 'number') return Number(value);
      if (col.type === 'date') return parseDate(value);
      return safeText(value);
    }));

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet(form).appendRow(row);
    } finally {
      lock.releaseLock();
    }

    // Email problems (e.g. hitting Google's daily sending limit) should never
    // make a saved submission look like it failed.
    try { sendEmails(form, data); } catch (err) { console.error(err); }

    return respond(ajax, true);
  } catch (err) {
    console.error(err);
    return respond(ajax, false, 'Something went wrong on our end. Please try again later.');
  }
}

// Visiting the web app URL directly just shows a short note.
function doGet() {
  return HtmlService.createHtmlOutput('<p>This address receives form submissions from <a href="' +
    SITE_URL + '">' + SITE_URL + '</a>.</p>');
}

// Run once from the editor to create the tabs and approve permissions.
function setup() {
  Object.keys(FORMS).forEach(function (key) { getSheet(FORMS[key]); });
  MailApp.getRemainingDailyQuota(); // triggers the email permission prompt
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function getSheet(form) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(form.sheet);
  if (!sheet) {
    sheet = ss.insertSheet(form.sheet);
    var headers = ['Timestamp'].concat(form.columns.map(function (c) { return c.label; }));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd h:mm am/pm');
    form.columns.forEach(function (col, i) {
      var range = sheet.getRange(2, i + 2, sheet.getMaxRows() - 1, 1);
      if (col.type === 'date') range.setNumberFormat('yyyy-mm-dd');
      if (col.name === 'amount_spent') range.setNumberFormat('$#,##0.00');
    });
  }
  return sheet;
}

function sendEmails(form, data) {
  var owner = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();

  if (NOTIFY_ON_SUBMIT && MailApp.getRemainingDailyQuota() > 0) {
    var lines = form.columns.map(function (c) { return c.label + ': ' + (data[c.name] || '—'); });
    MailApp.sendEmail({
      to: owner,
      replyTo: data.email || owner,
      subject: 'New website submission: ' + form.sheet,
      body: lines.join('\n') + '\n\nOpen the spreadsheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    });
  }

  if (SEND_CONFIRMATIONS && data.email && form.confirmBody && MailApp.getRemainingDailyQuota() > 0) {
    MailApp.sendEmail({
      to: data.email,
      replyTo: owner,
      name: SITE_NAME,
      subject: form.confirmSubject,
      body: form.confirmBody(data)
    });
  }
}

function respond(ajax, ok, error) {
  if (ajax) {
    var body = ok ? { ok: true } : { ok: false, error: error };
    return ContentService.createTextOutput(JSON.stringify(body))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var msg = ok ? 'Thank you! Your submission was received.'
               : 'Sorry, your submission didn’t go through. ' + escapeHtml(error);
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem">' +
    '<p>' + msg + '</p><p><a href="' + SITE_URL + '" target="_top">← Back to ' + SITE_NAME + '</a></p></div>');
}

// Keep text like "=HYPERLINK(...)" from being treated as a spreadsheet formula.
function safeText(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function parseDate(value) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'there';
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
