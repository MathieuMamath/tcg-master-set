import { beforeEach, expect, test, vi } from 'vitest';
import { getDb } from '@/db/client';
import { GET } from './route';

vi.mock('@/db/client', () => ({ getDb: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

test('reports ok when the database answers', async () => {
  vi.mocked(getDb).mockReturnValue({ execute: async () => [] } as never);

  const response = await GET();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok', db: 'up' });
});

test('reports 503 without exposing the error when the database is down', async () => {
  vi.mocked(getDb).mockReturnValue({
    execute: async () => {
      throw new Error('connection to secret-host refused');
    },
  } as never);

  const response = await GET();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
