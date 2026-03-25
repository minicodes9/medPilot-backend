const fetch = require('node-fetch');
const {
  doseReminderTemplate,
  refillAlertTemplate,
  refillConfirmationTemplate,
} = require('../templates/email.template');

// BASE EMAIL SENDER 
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Email Error:', data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Email Service Failed:', error.message);
    return null;
  }
};

// SEND DOSE REMINDER
const sendDoseReminder = async ({ to, name, medicationName, dosage, time }) => {
  return sendEmail({
    to,
    subject: `Time to take your ${medicationName}`,
    text: `Hi ${name}, take ${medicationName} (${dosage}) at ${time}.`,
    html: doseReminderTemplate({ name, medicationName, dosage, time }),
  });
};

// SEND REFILL ALERT
const sendRefillAlert = async ({ to, name, medicationName, remainingQuantity }) => {
  return sendEmail({
    to,
    subject: `Low supply alert — ${medicationName}`,
    text: `Hi ${name}, only ${remainingQuantity} doses left of ${medicationName}.`,
    html: refillAlertTemplate({ name, medicationName, remainingQuantity }),
  });
};

// SEND REFILL CONFIRMATION
const sendRefillConfirmation = async ({ to, name, medicationName, pharmacyName }) => {
  return sendEmail({
    to,
    subject: `Refill confirmed — ${medicationName}`,
    text: `Hi ${name}, your refill for ${medicationName} at ${pharmacyName} is confirmed.`,
    html: refillConfirmationTemplate({ name, medicationName, pharmacyName }),
  });
};

module.exports = {
  sendEmail,
  sendDoseReminder,
  sendRefillAlert,
  sendRefillConfirmation,
};