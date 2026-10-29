import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { requestPasswordReset } from '../api/auth';
import { FormField } from '../components/ui/FormField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { EMAIL_PATTERN } from '../lib/validation';
import { describeAuthError } from '../lib/authErrors';

/** In-app path of the backend's development reset link, whatever host it names. */
const appPath = (url) => {
  try {
    const { pathname, search } = new URL(url);
    return pathname + search;
  } catch {
    return null;
  }
};

/** Asks for a password reset link (#186, backend #185). */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setFormError(null);
    setBusy(true);
    try {
      const result = await requestPasswordReset(value);
      setSent({ email: value, devLink: result?.dev_reset_url && appPath(result.dev_reset_url) });
    } catch (apiError) {
      setFormError(describeAuthError(apiError).form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Forgot your password?" accent="We will help you back in.">
      {sent ? (
        <div className="auth-sent" role="status">
          <MailCheck size={40} aria-hidden="true" />
          <h1 className="auth-card__title">Check your email</h1>
          <p className="auth-card__lead">
            If an account uses <strong>{sent.email}</strong>, we have sent a link to choose a new
            password. It works for 60 minutes.
          </p>
          {sent.devLink && (
            <p className="auth-callout">
              Test mode: no email server is set up, so here is the link.{' '}
              <Link to={sent.devLink}>Open the reset link</Link>
            </p>
          )}
          <p className="auth-card__switch">
            <Link to="/sign-in">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <>
          <h1 className="auth-card__title">Reset your password</h1>
          <p className="auth-card__lead">
            Enter the email you shop with and we will send you a link to choose a new password.
          </p>
          <form onSubmit={submit} noValidate className="auth-form">
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <FormField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
            />
            <button type="submit" className="btn btn--accent btn--block" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <div className="auth-card__divider" />
          <p className="auth-card__switch">
            Remembered it? <Link to="/sign-in">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
