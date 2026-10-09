const { Resend } = require("resend");

function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.SMTP_FROM);
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    return {
      ok: false,
      skipped: true,
      reason: "NO_TO"
    };
  }

  if (!isEmailEnabled()) {
    console.error("[email error] RESEND_API_KEY or SMTP_FROM is missing");

    return {
      ok: false,
      skipped: true,
      reason: "EMAIL_NOT_CONFIGURED"
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: process.env.SMTP_FROM,
    to: [to],
    subject,
    text,
    html
  });

  if (result.error) {
    console.error("[email sending failed]", result.error.message);
    throw new Error(result.error.message);
  }

  console.log("[email sent]", result.data?.id);

  return {
    ok: true,
    messageId: result.data?.id
  };
}

module.exports = {
  sendEmail,
  isEmailEnabled
};