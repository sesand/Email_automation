import { useMemo, useState } from 'react';
import { EmailForm } from './components/EmailForm';
import { EmailOutput } from './components/EmailOutput';
import { requestEmail } from './services/emailApi';
import { EMPTY_FORM, type EmailFormValues, type FieldErrors, type GeneratedEmail } from './types/email';
import { copyText, formatFullEmail } from './utils/clipboard';
import { firstErrorField, trimFormValues, validateForm, validateRefinement } from './utils/validation';

function App() {
  const [form, setForm] = useState<EmailFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [refinement, setRefinement] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const hasContent = useMemo(() => Boolean(email || form.purpose || form.recipientName || form.recipientDesignation || form.keyPoints), [email, form]);

  const focus = (id: string | undefined) => { if (id) window.requestAnimationFrame(() => document.getElementById(id)?.focus()); };
  const generate = async () => {
    if (isGenerating || isRefining) return;
    const clean = trimFormValues(form);
    const nextErrors = validateForm(clean);
    setForm(clean); setErrors(nextErrors); setApiError(null);
    if (Object.keys(nextErrors).length) { focus(firstErrorField(nextErrors)); return; }
    setIsGenerating(true);
    try {
      const result = await requestEmail({ ...clean, mode: 'generate' });
      setEmail(result); setRefinement('');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to generate the email right now.');
    } finally { setIsGenerating(false); }
  };

  const refine = async () => {
    if (!email || isGenerating || isRefining) return;
    const message = validateRefinement(refinement);
    if (message) { setErrors((current) => ({ ...current, refinementInstruction: message })); focus('refinementInstruction'); return; }
    setErrors((current) => ({ ...current, refinementInstruction: undefined })); setApiError(null); setIsRefining(true);
    try {
      const clean = trimFormValues(form);
      const result = await requestEmail({ ...clean, mode: 'refine', currentEmail: email, refinementInstruction: refinement.trim() });
      setEmail(result); setRefinement('');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to refine the email. Your previous draft is still here.');
    } finally { setIsRefining(false); }
  };

  const copy = async (kind: 'subject' | 'body' | 'full') => {
    if (!email) return;
    try {
      await copyText(kind === 'subject' ? email.subject : kind === 'body' ? email.body : formatFullEmail(email));
      setCopied(kind); window.setTimeout(() => setCopied(null), 1_800);
    } catch { setApiError('Copying was blocked by your browser. Select the text and copy it manually.'); }
  };

  const clear = () => {
    if (hasContent && !window.confirm('Start over? Your form details and generated draft will be cleared.')) return;
    setForm(EMPTY_FORM); setErrors({}); setEmail(null); setRefinement(''); setApiError(null); setCopied(null); focus('purpose');
  };

  return (
    <div className="app-shell">
      <header className="site-header"><a className="brand" href="#top" aria-label="Recruiter Email Studio home"><span>R</span><div>Recruiter Email Studio<small>Bangalore Strategic Solutions</small></div></a><div className="secure-note"><span aria-hidden="true">◇</span> Secure AI workspace</div></header>
      <main id="top">
        <section className="hero"><p className="eyebrow">Recruiter productivity, thoughtfully assisted</p><h1>Write better recruiting emails.<br /><em>In less time.</em></h1><p>Turn a few clear details into a polished, ready-to-send email—without losing your voice or inventing facts.</p></section>
        <div className="workspace">
          <EmailForm values={form} errors={errors} isGenerating={isGenerating} hasContent={hasContent}
            onChange={(next) => { setForm(next); setErrors({}); }} onSubmit={() => void generate()} onClear={clear} />
          <EmailOutput email={email} isGenerating={isGenerating} isRefining={isRefining} error={apiError} refinement={refinement}
            refinementError={errors.refinementInstruction} copied={copied} onEmailChange={setEmail} onCopy={copy}
            onRefinementChange={(value) => { setRefinement(value); setErrors((current) => ({ ...current, refinementInstruction: undefined })); }}
            onRefine={() => void refine()} onRetry={() => void (email ? refine() : generate())} />
        </div>
      </main>
      <footer><span>Your details are processed securely and are not stored by this application.</span><span>Review every draft before sending.</span></footer>
    </div>
  );
}

export default App;
