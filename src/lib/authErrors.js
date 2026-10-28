/**
 * Maps auth API errors to a form-level message and per-field messages.
 * @returns {{ form: string|null, fields: Record<string,string> }}
 */
export const describeAuthError = (error) => {
  const fields = {};
  (Array.isArray(error?.details) ? error.details : []).forEach((detail) => {
    if (detail?.field && !fields[detail.field]) fields[detail.field] = detail.message;
  });
  switch (error?.code) {
    case 'INVALID_CREDENTIALS':
      return { form: 'That email and password do not match an account.', fields };
    case 'ACCOUNT_LOCKED':
      return {
        form: 'Too many failed attempts. Your account is locked for 15 minutes; try again after that.',
        fields,
      };
    case 'DUPLICATE_ENTRY':
      return {
        form: null,
        fields: { ...fields, email: 'An account with this email already exists.' },
      };
    case 'VALIDATION_ERROR':
      return { form: Object.keys(fields).length ? null : error.message, fields };
    default:
      if (error?.status === 429) {
        return {
          form: 'Too many attempts from this device. Wait a few minutes and try again.',
          fields,
        };
      }
      return { form: error?.message || 'Something went wrong. Please try again.', fields };
  }
};

/** Only same-site paths are allowed as a post-sign-in destination (no open redirect). */
export const safeNext = (next) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
