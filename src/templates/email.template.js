const baseTemplate = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
    <div style="background:#00AD85;padding:16px 24px;border-radius:8px;margin-bottom:24px;">
      <h2 style="color:#ffffff;margin:0;">💊 MedPilot</h2>
    </div>
    ${content}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
    <p style="color:#6b7280;font-size:12px;text-align:center;">
      MedPilot — Your medication management companion<br/>
      If you did not request this email, please ignore it.
    </p>
  </div>
`;

// FORGOT PASSWORD 
const forgotPasswordTemplate = ({ name, resetUrl }) =>
  baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>You requested a password reset for your MedPilot account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}"
        style="background:#00AD85;color:#ffffff;padding:12px 32px;
        border-radius:8px;text-decoration:none;font-weight:bold;
        display:inline-block;">
        Reset Password
      </a>
    </div>
    <p>This link expires in <strong>30 minutes</strong>.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `);

//  DOSE REMINDER 
const doseReminderTemplate = ({ name, medicationName, dosage, time }) =>
  baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>This is your medication reminder:</p>
    <div style="background:#f0f9ff;padding:16px;border-radius:8px;
    border-left:4px solid #00AD85;margin:16px 0;">
      <p style="margin:0;"><strong>Medication:</strong> ${medicationName}</p>
      <p style="margin:8px 0 0;"><strong>Dosage:</strong> ${dosage}</p>
      <p style="margin:8px 0 0;"><strong>Time:</strong> ${time}</p>
    </div>
    <p>Stay consistent with your medication schedule for better health outcomes.</p>
  `);

// REFILL ALERT
const refillAlertTemplate = ({ name, medicationName, remainingQuantity }) =>
  baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your medication supply is running low:</p>
    <div style="background:#fef2f2;padding:16px;border-radius:8px;
    border-left:4px solid #E74C3C;margin:16px 0;">
      <p style="margin:0;"><strong>Medication:</strong> ${medicationName}</p>
      <p style="margin:8px 0 0;color:#E74C3C;">
        <strong>Remaining:</strong> ${remainingQuantity} dose(s) left
      </p>
    </div>
    <p>Please request a refill soon to avoid missing doses.</p>
  `);

//REFILL CONFIRMATION 
const refillConfirmationTemplate = ({ name, medicationName, pharmacyName }) =>
  baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your refill request has been confirmed:</p>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;
    border-left:4px solid #2ECC71;margin:16px 0;">
      <p style="margin:0;"><strong>Medication:</strong> ${medicationName}</p>
      <p style="margin:8px 0 0;"><strong>Pharmacy:</strong> ${pharmacyName}</p>
    </div>
    <p>Your medication will be ready for pickup soon.</p>
  `);

module.exports = {
  forgotPasswordTemplate,
  doseReminderTemplate,
  refillAlertTemplate,
  refillConfirmationTemplate,
};