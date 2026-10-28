import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';
import { FormField } from '../components/ui/FormField';
import { PasswordField } from '../components/auth/PasswordField';
import { validateLogin, hasErrors } from '../lib/validation';
import { describeAuthError, safeNext } from '../lib/authErrors';

export default function SignInPage() {
  const { signIn, isSignedIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
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
    <div className="container page auth-page">
      <h1>Sign in</h1>
      <p>Track orders, save addresses and keep a wishlist.</p>
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
        />
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-page__switch">
        New here? <Link to={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </div>
  );
}
