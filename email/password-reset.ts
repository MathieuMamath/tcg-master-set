import { createTranslator, type Locale } from 'next-intl';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import type { EmailMessage } from './types';

const MESSAGES = { en, fr };

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// The email that sends a reset link, in the language of the page it was asked from. It names
// nobody and echoes no address, and says the two things a worried reader needs: how long the link
// lives, and that ignoring the email changes nothing.
export function passwordResetEmail(input: {
  to: string;
  url: string;
  locale: Locale;
  minutes: number;
}): EmailMessage {
  const t = createTranslator({
    locale: input.locale,
    messages: MESSAGES[input.locale],
    namespace: 'Email.passwordReset',
  });
  const game = MESSAGES[input.locale].Home.title;
  const lines = [
    t('greeting'),
    t('asked', { game }),
    t('action'),
    t('validity', { minutes: input.minutes }),
    t('ignore'),
  ];

  const text = [lines[0], '', lines[1], lines[2], '', input.url, '', lines[3], lines[4]].join('\n');
  const paragraph = (line: string) => `<p style="margin:0 0 16px">${escapeHtml(line)}</p>`;
  const html = `<!doctype html>
<html lang="${input.locale}">
<body style="margin:0;padding:24px;background:#f4ead8;font-family:Helvetica,Arial,sans-serif;color:#2c2a35;font-size:16px;line-height:1.5">
<div style="max-width:480px;margin:0 auto;background:#fffaf0;border:2px solid #2c2a35;border-radius:8px;padding:24px">
${paragraph(lines[0])}
${paragraph(lines[1])}
${paragraph(lines[2])}
<p style="margin:0 0 16px;text-align:center"><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#f3c14b;color:#2c2a35;border:2px solid #2c2a35;border-radius:6px;padding:10px 20px;font-weight:bold;text-decoration:none">${escapeHtml(t('button'))}</a></p>
${paragraph(lines[3])}
<p style="margin:0">${escapeHtml(lines[4])}</p>
</div>
</body>
</html>`;

  return { to: input.to, subject: t('subject', { game }), text, html };
}
