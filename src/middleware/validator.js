import validator from "validator";

//Email Validation function

export const validateEmail = (email) => {
  if (!validator.isEmail(email)) {
    return "Invalid email format";
  }
  return null;
};

export const validatePassword = (password) => {
  const isStrong = validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  });

  if (!isStrong) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number and symbol";
  }
  return null;
};
