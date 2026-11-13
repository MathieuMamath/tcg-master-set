// The look every email of the game shares, built from tables and inline styles, which are all
// that mail apps reliably draw: the banner on kraft, then a scrap of paper with a heading, the
// text, one button, and the link written out for apps that hide buttons, then a footer on the
// kraft. The game's fonts can't be loaded by mail apps, so the banner carries the name and the
// text falls back on rounded system fonts.

const INK = '#2c2a35';
const PAPER = '#fbf6ea';
const KRAFT = '#c8a574';
const ACCENT = '#f3c14b';
const ACCENT_DARK = '#b8861f';
const MUTED = '#5d5866';
const STAMP = '#c8453a';
const NOTE = '#fdf0c4';

const BODY_FONT = "'Trebuchet MS', 'Segoe UI', Helvetica, Arial, sans-serif";
const HEADING_FONT = "'Arial Rounded MT Bold', 'Trebuchet MS', Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export type EmailContent = {
  locale: string;
  appUrl: string;
  // The game's name, for the banner's description.
  game: string;
  // The line mail apps show beside the subject in the inbox.
  preview: string;
  heading: string;
  // Before the button, and after it.
  intro: string[];
  button: { label: string; url: string };
  // A line set apart under the button, such as how long a link lives.
  note?: string;
  outro: string[];
  // Introduces the link written out, for apps that hide the button.
  fallback: string;
  footer: string;
};

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-family:${BODY_FONT};font-size:16px;line-height:24px;color:${INK}">${escapeHtml(text)}</p>`;

const note = (text: string) =>
  `<p style="margin:0 0 16px;padding:10px 14px;background:${NOTE};border-left:4px solid ${STAMP};font-family:${BODY_FONT};font-size:15px;line-height:22px;font-weight:bold;color:${INK}">${escapeHtml(text)}</p>`;

export function emailHtml(content: EmailContent): string {
  const banner = new URL('/email-header.png', content.appUrl).toString();
  const url = escapeHtml(content.button.url);
  return `<!doctype html>
<html lang="${escapeHtml(content.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${KRAFT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(content.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${KRAFT}">
<tr><td align="center" style="padding:24px 12px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td align="center" style="padding:0 0 20px">
<img src="${escapeHtml(banner)}" width="560" height="140" alt="${escapeHtml(content.game)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;font-family:${HEADING_FONT};font-size:28px;font-weight:bold;color:${INK}">
</td></tr>
<tr><td style="background:${PAPER};border:2px solid ${INK};border-radius:4px;padding:32px 28px 28px;box-shadow:4px 5px 0 rgba(44,42,53,0.28)">
<h1 style="margin:0 0 20px;font-family:${HEADING_FONT};font-size:26px;line-height:32px;font-weight:bold;color:${INK}">${escapeHtml(content.heading)}</h1>
${content.intro.map(paragraph).join('\n')}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 24px">
<tr><td align="center" style="background:${ACCENT};border:2px solid ${INK};border-bottom-width:4px;border-radius:4px">
<a href="${url}" style="display:inline-block;padding:12px 28px;font-family:${HEADING_FONT};font-size:17px;font-weight:bold;color:${INK};text-decoration:none">${escapeHtml(content.button.label)}</a>
</td></tr>
</table>
${content.note ? note(content.note) : ''}
${content.outro.map(paragraph).join('\n')}
<p style="margin:24px 0 0;padding-top:16px;border-top:2px dashed ${ACCENT_DARK};font-family:${BODY_FONT};font-size:13px;line-height:20px;color:${MUTED}">${escapeHtml(content.fallback)}<br><a href="${url}" style="color:${INK};word-break:break-all">${url}</a></p>
</td></tr>
<tr><td align="center" style="padding:20px 16px 0;font-family:${BODY_FONT};font-size:12px;line-height:18px;color:${INK}">${escapeHtml(content.footer)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// The same email for apps that only show text.
export function emailText(content: EmailContent): string {
  return [
    content.heading,
    ...content.intro,
    content.button.url,
    ...(content.note ? [content.note] : []),
    ...content.outro,
    `— ${content.footer}`,
  ].join('\n\n');
}
