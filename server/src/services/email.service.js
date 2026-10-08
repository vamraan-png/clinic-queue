function isEmailEnabled() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
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
  console.error("[email disabled] SMTP is not configured");
  console.error("[email config]", {
    host: Boolean(process.env.SMTP_HOST),
    port: Boolean(process.env.SMTP_PORT),
    user: Boolean(process.env.SMTP_USER),
    pass: Boolean(process.env.SMTP_PASS),
    from: Boolean(process.env.SMTP_FROM)
  });
  
    return {
      ok: false,
      skipped: true,
      reason: "EMAIL_NOT_CONFIGURED"
    };
  }

  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });

  console.log("[email sent]", info.messageId);

  return {
    ok: true,
    messageId: info.messageId
  };
}

module.exports = {
  sendEmail,
  isEmailEnabled
};