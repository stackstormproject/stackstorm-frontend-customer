import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';
import { FormField } from '../components/ui/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { AuthLayout } from '../components/auth/AuthLayout';
import { validateLogin, hasErrors } from '../lib/validation';
import { describeAuthError, safeNext } from '../lib/authErrors';

export default function SignInPage() {
  const { signIn, isSignedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Signed in or as a guest, the shopper goes on to where they were heading (e.g. checkout),
  // otherwise to the home page (#187).
  const next = safeNext(params.get('next'));
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isSignedIn && !busy) return <Navigate to={next} replace />;

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const found = validateLogin(values);
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;
    setBusy(true);
    try {
      const customer = await signIn({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${customer.name?.split(' ')[0] || 'there'}`);
      navigate(next, { replace: true });
    } catch (error) {
      const { form, fields } = describeAuthError(error);
      setFormError(form);
      setErrors(fields);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back!" accent="Shop handloom, faster and easier.">
      <h1 className="auth-card__title">Welcome back</h1>
      <p className="auth-card__lead">Sign in to your account</p>
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
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          action={<Link to="/forgot-password">Forgot password?</Link>}
        />
        <button type="submit" className="btn btn--accent btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="auth-card__divider" />
      <p className="auth-card__switch">
        Don&apos;t have an account?{' '}
        <Link to={`/register?next=${encodeURIComponent(next)}`}>
          Create one free <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </p>
      <p className="auth-card__guest">
        <Link to={next}>
          Continue as guest <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </p>
    </AuthLayout>
  );
}
