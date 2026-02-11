export interface SiteData {
  title: string;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: string[];
  fonts: string[];
  headings: string[];
  bodyText: string;
  ogImage: string | null;
  baseUrl: string;
}

function resolveUrl(base: string, relative: string | null): string | null {
  if (!relative) return null;
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

function proxyUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export async function fetchAndParseSite(inputUrl: string): Promise<SiteData> {
  const res = await fetch(`/api/fetch-site?url=${encodeURIComponent(inputUrl)}`);
  if (!res.ok) throw new Error("Failed to fetch website");

  const { html, finalUrl } = await res.json();
  const baseUrl = finalUrl || (inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Title
  const title = doc.querySelector('title')?.textContent?.trim() || '';

  // Meta description
  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

  // OG Image
  const ogImage = resolveUrl(
    baseUrl,
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || null
  );

  // Logo detection — prioritize larger/more specific matches
  let logoUrl: string | null = null;

  // 1. Try SVG logo first (highest quality)
  const svgLogoSelectors = [
    'header svg[class*="logo"]', '.logo svg', '#logo svg', '[class*="logo"] svg',
    'a[class*="logo"] svg', 'header a:first-child svg',
  ];
  for (const sel of svgLogoSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const svgStr = new XMLSerializer().serializeToString(el);
      logoUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
      break;
    }
  }

  // 2. Try image logo with explicit logo classes/attributes
  if (!logoUrl) {
    const imgLogoSelectors = [
      'img[src*="logo" i]', 'img[alt*="logo" i]',
      'a.logo img', '.logo img', '#logo img',
      '[class*="logo"] img', '[id*="logo"] img',
      'a.navbar-brand img', '.navbar-brand img',
      'header a img', 'img[class*="brand" i]',
    ];
    for (const sel of imgLogoSelectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const src = el.getAttribute('src') || el.getAttribute('data-src');
        logoUrl = resolveUrl(baseUrl, src);
        if (logoUrl) break;
      }
    }
  }

  // 3. Try apple-touch-icon (usually high quality brand icon)
  let appleTouchIcon: string | null = null;
  const appleIcon = doc.querySelector('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
  if (appleIcon) {
    appleTouchIcon = resolveUrl(baseUrl, appleIcon.getAttribute('href'));
  }

  // 4. Favicon as last resort
  let faviconUrl: string | null = null;
  const iconLink = doc.querySelector('link[rel="icon"][sizes="192x192"], link[rel="icon"][sizes="128x128"], link[rel="icon"][sizes="96x96"], link[rel="icon"], link[rel="shortcut icon"]');
  if (iconLink) {
    faviconUrl = resolveUrl(baseUrl, iconLink.getAttribute('href'));
  }
  if (!faviconUrl) {
    faviconUrl = resolveUrl(baseUrl, '/favicon.ico');
  }

  // Use apple-touch-icon if no logo found (it's usually the brand mark)
  if (!logoUrl && appleTouchIcon) {
    logoUrl = appleTouchIcon;
  }

  // Colors from inline styles and style tags
  const colors = new Set<string>();
  const colorRegex = /#[0-9a-fA-F]{3,8}\b/g;
  const rgbRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;

  // Extract from <style> tags
  doc.querySelectorAll('style').forEach(style => {
    const text = style.textContent || '';
    let match;
    while ((match = colorRegex.exec(text)) !== null) {
      const hex = match[0].toLowerCase();
      if (hex.length === 4 || hex.length === 7) colors.add(hex);
    }
    while ((match = rgbRegex.exec(text)) !== null) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      colors.add(`#${r}${g}${b}`);
    }
  });

  // Extract from inline styles
  doc.querySelectorAll('[style]').forEach(el => {
    const style = el.getAttribute('style') || '';
    let match;
    while ((match = colorRegex.exec(style)) !== null) {
      const hex = match[0].toLowerCase();
      if (hex.length === 4 || hex.length === 7) colors.add(hex);
    }
  });

  // Fonts from CSS
  const fonts = new Set<string>();
  const fontRegex = /font-family\s*:\s*([^;}"]+)/gi;
  doc.querySelectorAll('style').forEach(style => {
    const text = style.textContent || '';
    let match;
    while ((match = fontRegex.exec(text)) !== null) {
      const families = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
      families.forEach(f => {
        if (f && !['sans-serif', 'serif', 'monospace', 'inherit', 'initial'].includes(f.toLowerCase())) {
          fonts.add(f);
        }
      });
    }
  });

  // Google Fonts from <link> tags
  doc.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(link => {
    const href = link.getAttribute('href') || '';
    const familyMatch = href.match(/family=([^&]+)/);
    if (familyMatch) {
      familyMatch[1].split('|').forEach(f => {
        fonts.add(decodeURIComponent(f.split(':')[0].replace(/\+/g, ' ')));
      });
    }
  });

  // Headings
  const headings: string[] = [];
  doc.querySelectorAll('h1, h2, h3').forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 2 && text.length < 200) headings.push(text);
  });

  // Body text (first ~2000 chars)
  const bodyText = (doc.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);

  return {
    title,
    description,
    logoUrl: proxyUrl(logoUrl) || proxyUrl(ogImage),
    faviconUrl: proxyUrl(faviconUrl),
    colors: Array.from(colors).slice(0, 30),
    fonts: Array.from(fonts).slice(0, 10),
    headings: headings.slice(0, 10),
    bodyText,
    ogImage: proxyUrl(ogImage),
    baseUrl,
  };
}
