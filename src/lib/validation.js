// Client-side checks mirror backend/src/validators and checkout.service so shoppers see
// problems before submitting. The server remains the authority and re-validates everything.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[0-9 ]{9,15}$/;
export const POSTAL_CODE_PATTERN = /^[0-9]{5}$/; // Sri Lankan postal codes, e.g. 81200
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const NAME_MIN = 2;
const NAME_MAX = 100;

const isBlank = (value) => !value || !String(value).trim();

/** Returns a list of unmet password rules (empty when valid). */
export const passwordProblems = (password = '') => {
  const problems = [];
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    problems.push(`${PASSWORD_MIN}-${PASSWORD_MAX} characters`);
  }
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/\d/.test(password)) problems.push('a number');
  return problems;
};

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!EMAIL_PATTERN.test(String(email || '').trim()))
    errors.email = 'Enter a valid email address.';
  if (isBlank(password)) errors.password = 'Enter your password.';
  return errors;
};

export const validateRegistration = ({ name, email, password, phone }) => {
  const errors = {};
  const trimmedName = String(name || '').trim();
  if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
    errors.name = `Enter your name (${NAME_MIN}-${NAME_MAX} characters).`;
  }
  if (!EMAIL_PATTERN.test(String(email || '').trim()))
    errors.email = 'Enter a valid email address.';
  const problems = passwordProblems(password);
  if (problems.length) errors.password = `Password needs ${problems.join(', ')}.`;
  if (phone && !PHONE_PATTERN.test(phone.trim())) {
    errors.phone = 'Enter a phone number such as +94 77 123 4567.';
  }
  return errors;
};

/** Address fields shared by checkout and the address book. */
export const validateAddress = ({ line1, city, postalCode }) => {
  const errors = {};
  if (isBlank(line1)) errors.line1 = 'Enter the street address.';
  if (isBlank(city)) errors.city = 'Enter the town or city.';
  if (!POSTAL_CODE_PATTERN.test(String(postalCode || '').trim())) {
    errors.postalCode = 'Postal codes in Sri Lanka have 5 digits, e.g. 81200.';
  }
  return errors;
};

export const validateEmail = (email) =>
  EMAIL_PATTERN.test(String(email || '').trim()) ? null : 'Enter a valid email address.';

export const hasErrors = (errors) => Object.keys(errors).length > 0;
