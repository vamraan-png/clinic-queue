function isSmsEnabled() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

async function sendSms(to, message) {
  if (!to) return { ok: false, skipped: true, reason: "NO_TO_NUMBER" };
  if (!isSmsEnabled()) return { ok: false, skipped: true, reason: "SMS_NOT_CONFIGURED" };

  const twilio = require("twilio");
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const result = await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER, // must be a Twilio number
    to,
    body: message
  });

  return { ok: true, sid: result.sid };
}

module.exports = { sendSms, isSmsEnabled };