import { createTranslator, type Locale } from 'next-intl';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import { type EmailContent, emailHtml, emailText } from './layout';
import type { EmailMessage } from './types';

const MESSAGES = { en, fr };

// The email that sends a reset link, in the language of the page it was asked from. It names
// nobody and echoes no address, and says the two things a worried reader needs: how long the link
// lives, and that ignoring the email changes nothing.
export function passwordResetEmail(input: {
  to: string;
  url: string;
  appUrl: string;
  locale: Locale;
  minutes: number;
}): EmailMessage {
  const t = createTranslator({
    locale: input.locale,
    messages: MESSAGES[input.locale],
    namespace: 'Email.passwordReset',
  });
  const game = MESSAGES[input.locale].Home.title;
  const content: EmailContent = {
    locale: input.locale,
    appUrl: input.appUrl,
    game,
    preview: t('preview', { minutes: input.minutes }),
    heading: t('heading'),
    intro: [t('greeting'), t('asked', { game }), t('action')],
    button: { label: t('button'), url: input.url },
    note: t('validity', { minutes: input.minutes }),
    outro: [t('ignore')],
    fallback: t('fallback'),
    footer: t('footer', { game }),
  };
  return {
    to: input.to,
    subject: t('subject', { game }),
    text: emailText(content),
    html: emailHtml(content),
  };
}
