import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField } from '../ui/FormField';

/**
 * Password input with a show/hide eye inside the box. `action` (e.g. a "Forgot password?"
 * link) sits on the label row (#186).
 */
export function PasswordField({ action, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <FormField {...props} type={visible ? 'text' : 'password'} />
      {action && <div className="password-field__action">{action}</div>}
      <button
        type="button"
        className="password-field__toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
