import { expect, test } from 'vitest';
import en from '../messages/en.json';
import fr from '../messages/fr.json';

function keysOf(messages: object, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

test('English and French define the same messages', () => {
  expect(keysOf(fr).sort()).toEqual(keysOf(en).sort());
});
