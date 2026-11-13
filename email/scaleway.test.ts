import { expect, test, vi } from 'vitest';
import {
  createScalewaySender,
  EmailDeliveryError,
  SCALEWAY_ENDPOINT,
  type ScalewayConfig,
  scalewayPayload,
} from './scaleway';

const config = (fetchImpl?: typeof fetch): ScalewayConfig => ({
  secretKey: 'scw-secret',
  projectId: 'project-id',
  from: { email: 'no-reply@example.com', name: 'Game' },
  ...(fetchImpl ? { fetchImpl } : {}),
});

const message = { to: 'player@example.com', subject: 'Subject', text: 'Text', html: '<p>Html</p>' };

test('shapes the email as the API expects it', () => {
  expect(scalewayPayload(message, config())).toEqual({
    from: { email: 'no-reply@example.com', name: 'Game' },
    to: [{ email: 'player@example.com' }],
    subject: 'Subject',
    text: 'Text',
    html: '<p>Html</p>',
    project_id: 'project-id',
  });
  const { html: _html, ...textOnly } = message;
  expect(scalewayPayload(textOnly, config())).not.toHaveProperty('html');
});

test('posts to the Paris endpoint with the secret key', async () => {
  const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
  await createScalewaySender(config(fetchImpl as unknown as typeof fetch))(message);
  const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe(SCALEWAY_ENDPOINT);
  expect(url).toContain('/regions/fr-par/');
  expect(init.method).toBe('POST');
  expect(init.headers).toMatchObject({ 'X-Auth-Token': 'scw-secret' });
});

test('fails with the status only, never the answer, which can quote the address', async () => {
  const fetchImpl = vi.fn(
    async () => new Response('{"message":"player@example.com is invalid"}', { status: 403 }),
  );
  const error = await createScalewaySender(config(fetchImpl as unknown as typeof fetch))(
    message,
  ).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(EmailDeliveryError);
  expect((error as EmailDeliveryError).status).toBe(403);
  expect((error as Error).message).not.toContain('player@example.com');
});
