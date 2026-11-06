import { describe, expect, it } from 'vitest';
import { MAX_VISIT_SECONDS, parseVisit, referrerDomain, visitSeconds } from './visits';

describe('referrerDomain', () => {
  it('keeps only the domain, without its usual prefixes', () => {
    expect(referrerDomain('https://discord.com/channels/1/2', 'game.example')).toBe('discord.com');
    expect(referrerDomain('https://www.google.com/search?q=x', 'game.example')).toBe('google.com');
    expect(referrerDomain('https://m.facebook.com/', 'game.example')).toBe('facebook.com');
  });

  it('has none for the game itself, a typed address or something unreadable', () => {
    expect(referrerDomain('https://game.example/fr/login', 'game.example')).toBeNull();
    expect(referrerDomain('http://localhost:3000/fr', 'localhost:3000')).toBeNull();
    expect(referrerDomain('', 'game.example')).toBeNull();
    expect(referrerDomain('not a url', 'game.example')).toBeNull();
    expect(referrerDomain(42, 'game.example')).toBeNull();
  });
});

describe('parseVisit', () => {
  it('takes a known device and the domain of its referrer', () => {
    expect(
      parseVisit({ device: 'phone', referrer: 'https://web.whatsapp.com/' }, 'game.example'),
    ).toEqual({ device: 'phone', referrer: 'web.whatsapp.com' });
  });

  it('refuses anything else', () => {
    expect(parseVisit({ device: 'fridge' }, 'game.example')).toBeNull();
    expect(parseVisit(null, 'game.example')).toBeNull();
  });
});

describe('visitSeconds', () => {
  const opened = new Date('2026-11-06T10:00:00Z');

  it('is the time since the page was opened', () => {
    expect(visitSeconds(opened, new Date('2026-11-06T10:12:30Z'))).toBe(750);
  });

  it('has none for a page left open too long, or a clock gone backwards', () => {
    expect(
      visitSeconds(opened, new Date(opened.getTime() + (MAX_VISIT_SECONDS + 1) * 1000)),
    ).toBeNull();
    expect(visitSeconds(opened, new Date('2026-11-06T09:59:00Z'))).toBeNull();
  });
});
