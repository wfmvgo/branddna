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
  brandImages: string[];
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

  // Extract domain for external logo APIs
  let domain = '';
  try { domain = new URL(baseUrl).hostname; } catch {}

  // === LOGO DETECTION — priority chain ===
  const logoCandidates: string[] = [];

  // 1. Clearbit Logo API (best quality, real logo with text)
  if (domain) {
    logoCandidates.push(`https://logo.clearbit.com/${domain}?size=400`);
  }

  // 2. SVG icon from <link> tags (e.g. /icon.svg — common in modern sites)
  const svgIconLink = doc.querySelector('link[rel="icon"][type="image/svg+xml"], link[href$=".svg"][rel="icon"]');
  if (svgIconLink) {
    const href = resolveUrl(baseUrl, svgIconLink.getAttribute('href'));
    if (href) logoCandidates.push(href);
  }

  // 3. SVG logo in HTML (header area)
  const svgLogoSelectors = [
    'header svg[class*="logo"]', '.logo svg', '#logo svg', '[class*="logo"] svg',
    'a[class*="logo"] svg', 'header a:first-child svg',
  ];
  for (const sel of svgLogoSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const svgStr = new XMLSerializer().serializeToString(el);
      logoCandidates.push(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`);
      break;
    }
  }

  // 4. IMG logo in HTML
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
      const resolved = resolveUrl(baseUrl, src);
      if (resolved) { logoCandidates.push(resolved); break; }
    }
  }

  // 5. Apple touch icon (usually high-quality brand mark)
  const appleIcon = doc.querySelector('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
  if (appleIcon) {
    const href = resolveUrl(baseUrl, appleIcon.getAttribute('href'));
    if (href) logoCandidates.push(href);
  }

  // 6. Large favicon
  const iconLink = doc.querySelector(
    'link[rel="icon"][sizes="192x192"], link[rel="icon"][sizes="128x128"], link[rel="icon"][sizes="96x96"], link[rel="icon"], link[rel="shortcut icon"]'
  );
  let faviconUrl: string | null = null;
  if (iconLink) {
    faviconUrl = resolveUrl(baseUrl, iconLink.getAttribute('href'));
  }
  if (!faviconUrl) {
    faviconUrl = resolveUrl(baseUrl, '/favicon.ico');
  }
  if (faviconUrl) logoCandidates.push(faviconUrl);

  // 7. Google high-res favicon API
  if (domain) {
    logoCandidates.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  }

  // Pick the best logo — validate each candidate with a quick check
  let logoUrl: string | null = null;
  for (const candidate of logoCandidates) {
    if (candidate.startsWith('data:')) {
      logoUrl = candidate;
      break;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const check = await fetch(`/api/proxy-image?url=${encodeURIComponent(candidate)}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (check.ok) {
        logoUrl = candidate;
        break;
      }
    } catch {
      continue;
    }
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

  // === BRAND IMAGES — collect key visual assets from the site ===
  const brandImageSet = new Set<string>();
  const skipPatterns = /icon|favicon|logo|pixel|tracking|analytics|badge|button|arrow|sprite|spacer|blank|1x1|transparent/i;
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?|$)/i;
  const minSize = 80; // minimum width/height to filter out tiny images

  // OG image first (usually the best hero/brand image)
  if (ogImage) brandImageSet.add(ogImage);

  // OG image alternatives (twitter:image, etc.)
  const twitterImage = resolveUrl(
    baseUrl,
    doc.querySelector('meta[name="twitter:image"], meta[property="twitter:image"]')?.getAttribute('content') || null
  );
  if (twitterImage) brandImageSet.add(twitterImage);

  // Hero/banner images (large prominent images in main sections)
  const heroSelectors = [
    'section img', '.hero img', '.banner img', '[class*="hero"] img', '[class*="banner"] img',
    '.slider img', '.carousel img', '[class*="slide"] img',
    'main img', '.content img', 'article img',
    '[class*="feature"] img', '[class*="promo"] img', '[class*="card"] img',
    '.product img', '[class*="product"] img',
    'picture source', 'picture img',
  ];

  for (const sel of heroSelectors) {
    doc.querySelectorAll(sel).forEach(el => {
      const src = el.getAttribute('src') || el.getAttribute('data-src') || 
                  el.getAttribute('data-lazy-src') || el.getAttribute('srcset')?.split(',')[0]?.trim()?.split(' ')[0];
      if (!src) return;
      
      // Skip tiny/tracking images
      const w = parseInt(el.getAttribute('width') || '0');
      const h = parseInt(el.getAttribute('height') || '0');
      if ((w > 0 && w < minSize) || (h > 0 && h < minSize)) return;
      
      // Skip utility images
      if (skipPatterns.test(src) || skipPatterns.test(el.getAttribute('class') || '')) return;
      
      const resolved = resolveUrl(baseUrl, src);
      if (resolved) brandImageSet.add(resolved);
    });
  }

  // Background images from inline styles
  doc.querySelectorAll('[style*="background"]').forEach(el => {
    const style = el.getAttribute('style') || '';
    const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (bgMatch && bgMatch[1]) {
      const src = bgMatch[1];
      if (!skipPatterns.test(src) && imageExtensions.test(src)) {
        const resolved = resolveUrl(baseUrl, src);
        if (resolved) brandImageSet.add(resolved);
      }
    }
  });

  // All remaining <img> tags not yet captured (filter by likely quality)
  doc.querySelectorAll('img').forEach(el => {
    const src = el.getAttribute('src') || el.getAttribute('data-src');
    if (!src) return;
    const w = parseInt(el.getAttribute('width') || '0');
    const h = parseInt(el.getAttribute('height') || '0');
    if ((w > 0 && w < minSize) || (h > 0 && h < minSize)) return;
    if (skipPatterns.test(src) || skipPatterns.test(el.getAttribute('alt') || '')) return;
    // Prefer images with real extensions
    if (!imageExtensions.test(src) && !src.startsWith('data:')) return;
    const resolved = resolveUrl(baseUrl, src);
    if (resolved) brandImageSet.add(resolved);
  });

  // Remove logo URL from brand images to avoid duplication
  if (logoUrl) brandImageSet.delete(logoUrl);

  // Proxy all brand images and limit to 12
  const brandImages = Array.from(brandImageSet)
    .slice(0, 12)
    .map(url => proxyUrl(url))
    .filter((url): url is string => url !== null);

  return {
    title,
    description,
    logoUrl: proxyUrl(logoUrl),
    faviconUrl: proxyUrl(faviconUrl),
    colors: Array.from(colors).slice(0, 30),
    fonts: Array.from(fonts).slice(0, 10),
    headings: headings.slice(0, 10),
    bodyText,
    ogImage: proxyUrl(ogImage),
    brandImages,
    baseUrl,
  };
}
