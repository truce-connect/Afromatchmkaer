const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let code = '';

  for (let i = 0; i < length; i += 1) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }

  return code;
};

const getOtpExpiryDate = () => {
  const minutes = Number(process.env.OTP_EXPIRES_IN_MIN || 10);
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, getOtpExpiryDate };
