import { BusinessDNA } from "./types";
import { SiteData, fetchAndParseSite } from "./websiteParser";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const callOpenRouter = async (model: string, messages: any[], jsonMode = false): Promise<any> => {
  const body: any = { model, messages };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error ${res.status}`);
  }

  return res.json();
};

/**
 * Fetches the website and analyzes it to extract Brand DNA.
 */
export const analyzeBrandIdentity = async (websiteInput: string): Promise<BusinessDNA> => {
  // Step 1: Fetch and parse real website data
  let siteData: SiteData | null = null;
  try {
    siteData = await fetchAndParseSite(websiteInput);
  } catch (e) {
    console.warn("Could not fetch website, will rely on AI knowledge:", e);
  }

  const siteContext = siteData ? `
    РЕАЛЬНЫЕ ДАННЫЕ С САЙТА (${siteData.baseUrl}):
    - Заголовок страницы: ${siteData.title}
    - Мета-описание: ${siteData.description}
    - Цвета из CSS (hex): ${siteData.colors.join(', ') || 'не найдены'}
    - Шрифты: ${siteData.fonts.join(', ') || 'не найдены'}
    - Заголовки на сайте: ${siteData.headings.join(' | ') || 'не найдены'}
    - Текст со страницы: ${siteData.bodyText.slice(0, 1000)}

    ВАЖНО: Используй РЕАЛЬНЫЕ цвета и шрифты с сайта. Распредели найденные цвета по ролям (primary, secondary, accent, background, text). Цвета должны быть яркими и различимыми — не используй белый (#ffffff) как основной если на сайте есть яркие цвета. Используй реальные шрифты с сайта.
  ` : `Не удалось загрузить данные с сайта. Используй свои знания о "${websiteInput}" для определения бренда.`;

  const prompt = `
    Ты — эксперт мирового класса по идентификации бренда. Отвечай ТОЛЬКО на русском языке.
    
    ${siteContext}

    ЗАДАЧА:
    На основе реальных данных с сайта создай полный ДНК бренда.
    Используй НАСТОЯЩИЕ цвета, шрифты и контент с сайта — НЕ выдумывай их.
    Все текстовые поля заполни на РУССКОМ языке.

    Верни JSON объект ТОЧНО такой структуры:
    {
      "businessName": "реальное название компании",
      "tagline": "реальный слоган или девиз компании",
      "brandSummary": "чем занимается бизнес (2-3 предложения, на русском)",
      "toneOfVoice": ["ключевое_слово1", "ключевое_слово2", ... (на русском)],
      "colors": {
        "primary": "#hex (основной цвет бренда с сайта, яркий и заметный)",
        "secondary": "#hex (вторичный цвет с сайта)",
        "accent": "#hex (акцентный цвет)",
        "background": "#hex (цвет фона сайта)",
        "text": "#hex (цвет текста)"
      },
      "typography": {
        "headingFont": "реальный шрифт заголовков с сайта или ближайший Google Font",
        "bodyFont": "реальный шрифт основного текста или ближайший Google Font",
        "description": "описание стиля типографики (на русском)"
      },
      "logoPrompt": "детальный промпт для генерации векторного логотипа этого бренда (на английском для AI генератора)",
      "imageStylePrompt": "детальный промпт для фотографии бренда (на английском для AI генератора)"
    }

    Верни ТОЛЬКО валидный JSON, без markdown.
  `;

  const response = await callOpenRouter(
    "google/gemini-3-pro-preview",
    [{ role: "user", content: prompt }],
    true
  );

  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error("Failed to generate brand analysis");
  
  const data = JSON.parse(text) as BusinessDNA;

  // Attach real logo and images from the website
  if (siteData?.logoUrl) {
    data.logoUrl = siteData.logoUrl;
  }
  if (siteData?.ogImage) {
    data.brandImageUrl = siteData.ogImage;
  }
  if (!data.logoUrl && siteData?.faviconUrl) {
    data.logoUrl = siteData.faviconUrl;
  }

  return data;
};