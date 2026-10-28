import { useState } from 'react';
import { FormField } from '../ui/FormField';

export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <FormField {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="btn--link password-field__toggle"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Hide password' : 'Show password'}
      </button>
    </div>
  );
}
