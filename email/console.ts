import type { SendEmail } from './types';

// Prints the email instead of sending it, so that a developer can follow the link from the
// server's output. In production that would put a live reset link in the logs, so it only says
// that nothing was sent.
export function createConsoleSender(options: {
  isProduction: boolean;
  write?: (line: string) => void;
}): SendEmail {
  const write = options.write ?? ((line: string) => console.info(line));
  return async (message) => {
    if (options.isProduction) {
      write(`[email] No email provider is set: "${message.subject}" was not sent.`);
      return;
    }
    write(`[email] to=${message.to} subject="${message.subject}"\n${message.text}`);
  };
}
