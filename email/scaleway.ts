import type { EmailMessage, SendEmail } from './types';

// Scaleway Transactional Email, through one call to its API rather than an SDK. Paris is its only
// region, which also keeps the players' addresses in France.
export const SCALEWAY_ENDPOINT =
  'https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails';

// Past this, the request is given up, so that a stuck provider never holds the server.
const TIMEOUT_MS = 10_000;

export type ScalewayConfig = {
  secretKey: string;
  projectId: string;
  from: { email: string; name: string };
  fetchImpl?: typeof fetch;
};

// Carries the status only: the provider's answer can quote the address back, and errors are
// logged.
export class EmailDeliveryError extends Error {
  constructor(readonly status: number) {
    super(`The email provider answered ${status}.`);
    this.name = 'EmailDeliveryError';
  }
}

export function scalewayPayload(message: EmailMessage, config: ScalewayConfig) {
  return {
    from: config.from,
    to: [{ email: message.to }],
    subject: message.subject,
    text: message.text,
    ...(message.html ? { html: message.html } : {}),
    project_id: config.projectId,
  };
}

export function createScalewaySender(config: ScalewayConfig): SendEmail {
  const fetchImpl = config.fetchImpl ?? fetch;
  return async (message) => {
    const response = await fetchImpl(SCALEWAY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': config.secretKey },
      body: JSON.stringify(scalewayPayload(message, config)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new EmailDeliveryError(response.status);
    }
  };
}
