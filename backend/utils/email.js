const nodemailer = require('nodemailer');

let cachedTransporterPromise;
let usingTestAccount = false;

const resolveServiceAuth = () => {
  const service = process.env.EMAIL_SERVICE_NAME || 'SendGrid';
  const pass = process.env.EMAIL_SERVICE_PASS || process.env.EMAIL_SERVICE_KEY;
  const defaultUser = service.toLowerCase() === 'sendgrid' ? 'apikey' : undefined;
  return {
    service,
    user: process.env.EMAIL_SERVICE_USER || defaultUser,
    pass
  };
};

const hasSmtpCredentials = () => Boolean(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && (process.env.EMAIL_SMTP_PASS || process.env.EMAIL_SMTP_PASSWORD));
const hasServiceCredentials = () => Boolean(resolveServiceAuth().pass);

const createServiceTransport = () => {
  const auth = resolveServiceAuth();
  return nodemailer.createTransport({
    service: auth.service,
    auth: {
      user: auth.user,
      pass: auth.pass
    }
  });
};

const createSmtpTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 587),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS || process.env.EMAIL_SMTP_PASSWORD
    }
  });

const createTestTransport = async () => {
  const account = await nodemailer.createTestAccount();
  usingTestAccount = true;
  console.warn('Email credentials missing. Using Nodemailer test account.');
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
};

const getTransporter = async () => {
  if (!cachedTransporterPromise) {
    if (hasSmtpCredentials()) {
      cachedTransporterPromise = Promise.resolve(createSmtpTransport());
    } else if (hasServiceCredentials()) {
      cachedTransporterPromise = Promise.resolve(createServiceTransport());
    } else {
      cachedTransporterPromise = createTestTransport();
    }
  }
  return cachedTransporterPromise;
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@afromatchmaker.com',
    to,
    subject,
    html
  });

  if (usingTestAccount) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log('[EMAIL PREVIEW]', preview);
    }
  }
};

module.exports = sendEmail;
