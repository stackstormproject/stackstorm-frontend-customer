import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { useToast } from '../state/ToastContext';
import { PasswordField } from '../components/auth/PasswordField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { passwordProblems } from '../lib/validation';
import { describeAuthError } from '../lib/authErrors';

const PASSWORD_HINT =
  'At least 8 characters with an uppercase letter, a lowercase letter and a number.';

/** Chooses a new password from the emailed link (#186, backend #185). */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [linkBroken, setLinkBroken] = useState(!/^[a-f0-9]{64}$/.test(token));
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    const problems = passwordProblems(values.password);
    if (problems.length) found.password = `Password needs ${problems.join(', ')}.`;
    if (values.confirm !== values.password) found.confirm = 'The two passwords do not match.';
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await resetPassword({ token, password: values.password });
      toast.success('Your password is changed. Sign in with the new one.');
      navigate('/sign-in', { replace: true });
    } catch (error) {
      setBusy(false);
      if (error?.code === 'INVALID_RESET_TOKEN') {
        setLinkBroken(true);
        return;
      }
      const { form, fields } = describeAuthError(error);
      setFormError(form);
      setErrors(fields);
    }
  };

  return (
    <AuthLayout title="Almost there!" accent="Choose a new password.">
      {linkBroken ? (
        <div className="auth-sent" role="alert">
          <h1 className="auth-card__title">This link has expired</h1>
          <p className="auth-card__lead">
            Reset links work once and for 60 minutes. Ask for a new one and use the newest email.
          </p>
          <Link to="/forgot-password" className="btn btn--accent btn--block">
            Send a new link
          </Link>
        </div>
      ) : (
        <>
          <h1 className="auth-card__title">Choose a new password</h1>
          <p className="auth-card__lead">You will be signed out everywhere else.</p>
          <form onSubmit={submit} noValidate className="auth-form">
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <PasswordField
              label="New password"
              autoComplete="new-password"
              value={values.password}
              onChange={update('password')}
              error={errors.password}
              hint={PASSWORD_HINT}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={values.confirm}
              onChange={update('confirm')}
              error={errors.confirm}
            />
            <button type="submit" className="btn btn--accent btn--block" disabled={busy}>
              {busy ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
