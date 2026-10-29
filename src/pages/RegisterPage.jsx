import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';
import { FormField } from '../components/ui/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { validateRegistration, hasErrors } from '../lib/validation';
import { describeAuthError, safeNext } from '../lib/authErrors';
import { AuthLayout } from '../components/auth/AuthLayout';

const PASSWORD_HINT =
  'At least 8 characters with an uppercase letter, a lowercase letter and a number.';

export default function RegisterPage() {
  const { signUp, isSignedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [values, setValues] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isSignedIn && !busy) return <Navigate to={next} replace />;

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const found = validateRegistration(values);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      await signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: values.phone.trim(),
      });
      toast.success('Your account is ready. You start at Silver loyalty tier.');
      navigate(next, { replace: true });
    } catch (error) {
      const { form, fields } = describeAuthError(error);
      setFormError(form);
      setErrors(fields);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Join Dickwella!" accent="Handloom and batik, delivered islandwide.">
      <h1 className="auth-card__title">Create your account</h1>
      <p className="auth-card__lead">It takes a minute and starts you at Silver loyalty tier.</p>
      <form onSubmit={submit} noValidate className="auth-form">
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <FormField
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={update('name')}
          error={errors.name}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          hint={PASSWORD_HINT}
        />
        <FormField
          label="Mobile number (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+94 77 123 4567"
          value={values.phone}
          onChange={update('phone')}
          error={errors.phone}
        />
        <button type="submit" className="btn btn--accent btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <div className="auth-card__divider" />
      <p className="auth-card__switch">
        Already have an account?{' '}
        <Link to={`/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}
