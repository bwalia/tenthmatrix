'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { leadsEndpoint } from '@/utils/opsapiEnv.mjs';

/* Where enquiries go: the OpsAPI public CRM lead-capture endpoint,
   POST {base}/api/v2/public/leads/tenthmatrix.

   {base} is resolved per environment at runtime from the host the page is
   served on (int/test/acc/www.tenthmatrix.com → int-/test-/acc-/api.tenthmatrix.com).
   It cannot come from a runtime env var: one image is shared by every
   environment and Next inlines NEXT_PUBLIC_* at build time. See
   src/utils/opsapiEnv.mjs and `npm run verify:opsapi`. */

const EMPTY = { name: '', email: '', phone: '', comments: '', website: '' };
const PHONE_ALLOWED = /^[0-9+()\-.\s]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* crm_leads stores first/last separately (first_name NOT NULL): split on the
   first space and keep the rest. */
const splitName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.length > 1 ? parts.slice(1).join(' ') : undefined };
};

export default function ContactForm({ apiUrl, source = 'tenthmatrix_contact_form' }) {
  const t = useTranslations('form');
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('nameRequired');
    if (!form.email.trim()) e.email = t('emailRequired');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('emailInvalid');
    const digits = form.phone.replace(/\D/g, '').length;
    if (form.phone && (!PHONE_ALLOWED.test(form.phone) || digits < 7 || digits > 15)) e.phone = t('phoneInvalid');
    if (!form.comments.trim()) e.comments = t('messageRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === 'sending' || !validate()) return;
    if (form.website) {
      setStatus('done'); // honeypot filled: pretend success, send nothing
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(leadsEndpoint({ override: apiUrl }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...splitName(form.name),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          comments: form.comments.trim(),
          source,
          channel: 'web',
          landing_page_url: window.location.href,
          referrer_url: document.referrer || undefined,
        }),
      });
      /* 201 captured, 200 duplicate within 5 minutes (still success), or
         4xx/5xx { success:false, error }. Proxies can answer HTML — parse defensively. */
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
      setForm(EMPTY);
      setStatus('done');
    } catch (err) {
      console.error('Lead submission failed:', err);
      setStatus('error');
    }
  };

  const field = (name, label, props = {}) => (
    <div className="tm-field">
      <label htmlFor={`tm-${name}`}>{label}</label>
      {props.multiline ? (
        <textarea
          id={`tm-${name}`}
          name={name}
          rows={5}
          value={form[name]}
          onChange={set(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `tm-${name}-err` : undefined}
        />
      ) : (
        <input
          id={`tm-${name}`}
          name={name}
          type={props.type || 'text'}
          autoComplete={props.autoComplete}
          value={form[name]}
          onChange={set(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `tm-${name}-err` : undefined}
        />
      )}
      {errors[name] ? (
        <p id={`tm-${name}-err`} className="tm-field__error">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form className="tm-form tm-contact-form" onSubmit={submit} noValidate>
      {field('name', t('name'), { autoComplete: 'name' })}
      {field('email', t('email'), { type: 'email', autoComplete: 'email' })}
      {field('phone', t('phone'), { type: 'tel', autoComplete: 'tel' })}
      {field('comments', t('message'), { multiline: true })}
      <div className="tm-visually-hidden" aria-hidden="true">
        <label htmlFor="tm-website">Website</label>
        <input id="tm-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>
      <button type="submit" className="tm-button tm-tap" disabled={status === 'sending'}>
        {status === 'sending' ? t('sending') : t('submit')}
      </button>
      <p role="status" aria-live="polite" className="tm-form__status">
        {status === 'done' ? t('submitSuccess') : status === 'error' ? t('submitError') : ''}
      </p>
    </form>
  );
}
