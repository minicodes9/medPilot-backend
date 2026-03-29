const mongoose = require('mongoose');
const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false, trim: true },
    role: { type: String, enum: ['patient', 'caregiver', 'admin'], default: 'patient' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    otpCode: String,
    otpExpires: Date,
  },
  { timestamps: true }
);

// HASH PASSWORD BEFORE SAVE
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await hashPassword(this.password);
});

// COMPARE PASSWORD
userSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

// GENERATE OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  this.otpCode = hashedOtp;
  this.otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry

  return otp; // return raw OTP to send via email
};

// VERIFY OTP
userSchema.methods.verifyOTP = function (otp) {
  if (!this.otpExpires || this.otpExpires < Date.now()) throw new Error('OTP expired');

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  if (this.otpCode !== hashedOtp) throw new Error('Incorrect OTP');

  this.otpCode = undefined;
  this.otpExpires = undefined;
  this.isVerified = true;

  return true;
};

// CLEAN RESPONSE
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.otpCode;
    delete ret.otpExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;