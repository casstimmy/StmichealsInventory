import nodemailer from "nodemailer";

function parsePort(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function parseBoolean(value, fallbackValue) {
  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  return String(value).toLowerCase() === "true";
}

export function createMailTransport() {
  const mailHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const mailPort = parsePort(process.env.SMTP_PORT || process.env.EMAIL_PORT, mailHost ? 465 : 587);
  const mailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const mailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const mailSecure = parseBoolean(
    process.env.SMTP_SECURE || process.env.EMAIL_SECURE,
    mailPort === 465
  );
  const allowSelfSigned = parseBoolean(
    process.env.SMTP_ALLOW_SELF_SIGNED || process.env.EMAIL_ALLOW_SELF_SIGNED,
    process.env.NODE_ENV !== "production"
  );

  if (mailHost && mailUser && mailPass) {
    return nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: mailUser,
        pass: mailPass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      tls: allowSelfSigned
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
}

export function getMailFromAddress(defaultLabel = "St's Micheal's Place") {
  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;

  return fromAddress ? `${defaultLabel} <${fromAddress}>` : defaultLabel;
}