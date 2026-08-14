const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || 'GRABB-IT Clothing <noreply@grabb-it.com>';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD
    }
  });
}

/**
 * Sends an email or logs to console in development
 */
async function sendEmail({ to, subject, html, text }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
        text
      });
      console.log(`Email sent successfully to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('SMTP Delivery Error:', err.message);
      return { success: false, error: err.message };
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL PRODUCTION EMAIL ERROR: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASSWORD) are not configured.');
      return { success: false, error: 'Email service is not configured.' };
    }
    // Development / Sandbox mode fallback logging
    console.log('----------------------------------------------------');
    console.log(`[EMAIL DISPATCH - DEV SIMULATOR]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log('----------------------------------------------------');
    return { success: true, simulated: true };
  }
}

/**
 * Sends OTP Email for Password Reset or Verification
 */
async function sendOtpEmail(email, otp, purpose = 'Password Reset') {
  const subject = `Your GRABB-IT Security Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5;">
      <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; color: #111;">GRABB-IT CLOTHING</h1>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #111;">${purpose} Verification</h2>
      <p style="color: #555; line-height: 1.6;">Use the following 6-digit one-time code to complete your request. This code will expire in <strong>5 minutes</strong>.</p>
      <div style="background: #f8f9fa; border: 1px solid #111; padding: 15px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #111;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this code, please ignore this message.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Your GRABB-IT ${purpose} code is: ${otp}. Expires in 5 minutes.` });
}

/**
 * Sends Order Notification Email
 */
async function sendOrderEmail(email, customerName, orderNumber, orderStatus, totalAmount) {
  const subject = `Grabb-it Order #${orderNumber} Update: ${orderStatus}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5;">
      <div style="text-align: center; border-bottom: 2px solid #111; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; color: #111;">GRABB-IT CLOTHING</h1>
      </div>
      <h2 style="font-size: 18px; font-weight: 700; color: #111;">Hi ${customerName},</h2>
      <p style="color: #555; line-height: 1.6;">Your order <strong>#${orderNumber}</strong> has been updated to: <strong style="color: #111;">${orderStatus.toUpperCase()}</strong>.</p>
      <div style="background: #f8f9fa; border-left: 4px solid #111; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #333;">Order Number: <strong>${orderNumber}</strong></p>
        <p style="margin: 5px 0 0 0; color: #333;">Total Amount: <strong>₹${Math.round(totalAmount)}</strong></p>
      </div>
      <p style="color: #555; line-height: 1.6;">Track your order directly in your account page anytime.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Hi ${customerName}, your Grabb-it order #${orderNumber} is now ${orderStatus}. Total: ₹${Math.round(totalAmount)}.` });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendOrderEmail
};
