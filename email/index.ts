import en from '@/messages/en.json';
import { createConsoleSender } from './console';
import { createScalewaySender } from './scaleway';
import type { SendEmail } from './types';

// Emails go through Scaleway once its three variables are set, and are printed in the server's
// output otherwise. Callers never pick a provider themselves.
function scalewayConfig() {
  const secretKey = process.env.SCALEWAY_SECRET_KEY;
  const projectId = process.env.SCALEWAY_PROJECT_ID;
  const from = process.env.EMAIL_FROM;
  return secretKey && projectId && from ? { secretKey, projectId, from } : null;
}

const isProduction = () => process.env.NODE_ENV === 'production';

// Whether emails can reach players: always in development, where they are printed, and in
// production only once a provider is set. Features that need an email hide themselves otherwise.
export function canSendEmail(): boolean {
  return !isProduction() || scalewayConfig() !== null;
}

let sender: SendEmail | undefined;

export function sendEmail(...args: Parameters<SendEmail>): ReturnType<SendEmail> {
  if (!sender) {
    const config = scalewayConfig();
    sender = config
      ? createScalewaySender({
          secretKey: config.secretKey,
          projectId: config.projectId,
          from: { email: config.from, name: en.Home.title },
        })
      : createConsoleSender({ isProduction: isProduction() });
  }
  return sender(...args);
}

export type { EmailMessage } from './types';
