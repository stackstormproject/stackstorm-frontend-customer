import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { getInvoice } from '../../api/orders';
import { saveBlob } from '../../lib/download';
import { useToast } from '../../state/ToastContext';

/** Downloads the order's PDF invoice; not offered until the order is paid (#177). */
export function InvoiceButton({ order, className = 'btn btn--secondary' }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!order || order.status === 'payment_pending') return null;

  const download = async () => {
    setBusy(true);
    try {
      const pdf = await getInvoice(order.id);
      saveBlob(pdf, `${order.invoice_number}.pdf`);
    } catch (err) {
      toast.error(
        err.status === 409
          ? 'The invoice is ready once the payment has gone through.'
          : 'The invoice could not be downloaded. Try again in a moment.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className={className} onClick={download} disabled={busy}>
      <FileDown size={18} aria-hidden="true" />
      {busy ? 'Preparing invoice…' : 'Download invoice (PDF)'}
    </button>
  );
}
