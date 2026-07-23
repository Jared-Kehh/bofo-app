const { Resend } = require('resend');

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('[notifications] RESEND_API_KEY not set — email notifications disabled');
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:6px 12px;font-size:13px;color:#888;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:6px 12px;font-size:13px;color:#111;word-break:break-word">${value ?? '—'}</td>
    </tr>`;
}

function table(rows) {
  return `
    <table style="border-collapse:collapse;width:100%;margin-top:16px">
      <tbody>${rows.join('')}</tbody>
    </table>`;
}

function wrap(title, body) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden">
        <div style="padding:20px 24px;border-bottom:1px solid #e4e4e7">
          <span style="font-size:13px;font-weight:600;color:#111;letter-spacing:-.01em">${title}</span>
        </div>
        <div style="padding:4px 0 20px">${body}</div>
      </div>
    </body>
    </html>`;
}

async function sendSubmissionEmail(submission) {
  if (!resend) return;
  try {
    const isUrgent = submission.priority === 'urgent';
    const subject = `${isUrgent ? '[URGENT] ' : ''}New Material Request — ${submission.jobSite}`;

    const d = submission.details || {};
    const detailStr = [d.brand, d.workType, d.product, d.tool, d.description]
      .filter(Boolean).join(' – ') || '—';

    const rows = [
      row('Employee', submission.employeeName),
      row('Job site', submission.jobSite),
      row('Request type', submission.requestType),
      row('Details', detailStr),
      submission.quantity ? row('Quantity', `${submission.quantity}${d.unit ? ' ' + d.unit : ''}`) : '',
      submission.priority === 'urgent' ? row('Priority', '<strong style="color:#c0392b">URGENT</strong>') : '',
      submission.neededBy ? row('Needed by', submission.neededBy) : '',
      submission.notes   ? row('Notes', submission.notes)       : '',
      row('Submitted', new Date(submission.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })),
    ].filter(Boolean);

    const html = wrap(`New ${isUrgent ? '🚨 URGENT ' : ''}Material Request`, table(rows));

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to:   process.env.NOTIFY_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error('[notifications] Failed to send submission email:', err.message);
  }
}

async function sendReportEmail(report) {
  if (!resend) return;
  try {
    const subject = `New Daily Work Report — ${report.jobSite} — ${report.employeeName}`;
    const photoCount = (report.photoUrls || []).length;
    const dashboardUrl = process.env.CLIENT_URL
      ? `${process.env.CLIENT_URL}/?tab=reports`
      : 'http://localhost:5173/?tab=reports';

    const rows = [
      row('Employee', report.employeeName),
      row('Job site', report.jobSite),
      row('Photos uploaded', photoCount),
      report.notes ? row('Notes', report.notes) : '',
      row('Submitted', new Date(report.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })),
    ].filter(Boolean);

    const body = table(rows) + `
      <div style="padding:16px 24px 0">
        <a href="${dashboardUrl}" style="display:inline-block;padding:9px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:500">View in dashboard →</a>
      </div>`;

    const html = wrap('New Daily Work Report', body);

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to:   process.env.NOTIFY_EMAIL,
      subject,
      html,
    });
  } catch (err) {
    console.error('[notifications] Failed to send report email:', err.message);
  }
}

module.exports = { sendSubmissionEmail, sendReportEmail };
