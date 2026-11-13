import { expect, test } from 'vitest';
import { createConsoleSender } from './console';

const message = {
  to: 'player@example.com',
  subject: 'Reset',
  text: 'http://localhost:3000/en/reset-password?token=secret-token',
};

test('prints the whole email in development, so that the link can be followed', async () => {
  const lines: string[] = [];
  await createConsoleSender({ isProduction: false, write: (line) => lines.push(line) })(message);
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('secret-token');
});

test('never prints the link or the address in production', async () => {
  const lines: string[] = [];
  await createConsoleSender({ isProduction: true, write: (line) => lines.push(line) })(message);
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('not sent');
  expect(lines[0]).not.toContain('secret-token');
  expect(lines[0]).not.toContain('player@example.com');
});
