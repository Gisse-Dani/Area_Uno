const ALLOWED_HOSTS = [
  "mercadolibre.com.ar",
  "www.mercadolibre.com.ar",
  "articulo.mercadolibre.com.ar",
  "listado.mercadolibre.com.ar",
  "mercadolibre.com",
  "www.mercadolibre.com",
  "meli.la",
  "www.meli.la"
];

function allowedUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function decodeEntities(text = "") {
  return String(text)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escapedKey}["'][^>]*>`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return "";
}

function parseLocalizedNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value == null) return null;

  let text = decodeEntities(String(value))
    .replace(/\u00a0/g, " ")
    .replace(/[^\d.,-]/g, "")
    .trim();

  if (!text) return null;

  const negative = text.startsWith("-");
  text = text.replace(/-/g, "");
  const hasDot = text.includes(".");
  const hasComma = text.includes(",");

  if (hasDot && hasComma) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = text.split(",");
    text = parts.length === 2 && parts[1].length <= 2 ? `${parts[0].replace(/\./g, "")}.${parts[1]}` : text.replace(/,/g, "");
  } else if (hasDot) {
    const parts = text.split(".");
    const thousandsGroups = parts.length > 1 && parts.slice(1).every(part => part.length === 3);
    if (thousandsGroups) text = parts.join("");
  }

  const number = Number(text);
  if (!Number.isFinite(number)) return null;
  return negative ? -number : number;
}

function validPrice(value) {
  const number = parseLocalizedNumber(value);
  return number != null && number > 0 && number < 1_000_000_000_000 ? number : null;
}

function validPercentage(value) {
  const number = parseLocalizedNumber(value);
  return number != null && number > 0 && number < 100 ? number : null;
}

function findItemId(value = "") {
  const normalized = decodeEntities(String(value)).replace(/%2D/gi, "-");
  const patterns = [
    /\b(MLA)[-_]?(\d{7,})\b/i,
    /[?&](?:item_id|itemId|id)=(MLA)[-_]?(\d{7,})\b/i,
    /\/(MLA)[-_]?(\d{7,})[-_/]/i
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return `${match[1].toUpperCase()}${match[2]}`;
  }
  return "";
}

function attributeValue(attributes, id) {
  const attribute = (attributes || []).find(item => item.id === id);
  return attribute?.value_name || "";
}

function walk(value, visitor, path = "", seen = new WeakSet()) {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  visitor(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, visitor, `${path}[${index}]`, seen));
  } else {
    Object.entries(value).forEach(([key, child]) => walk(child, visitor, path ? `${path}.${key}` : key, seen));
  }
}

function extractJsonScripts(html) {
  const values = [];
  const regex = /<script\b[^>]*(?:type=["']application\/(?:ld\+json|json)["']|id=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    const raw = decodeEntities(match[1].trim());
    if (!raw || raw.length > 8_000_000) continue;
    try {
      values.push(JSON.parse(raw));
    } catch {
      try {
        values.push(JSON.parse(raw.replace(/\u2028|\u2029/g, " ")));
      } catch {}
    }
  }
  return values;
}

function findStructuredProduct(jsonValues) {
  let found = null;
  for (const root of jsonValues) {
    walk(root, node => {
      if (found) return;
      const type = node?.["@type"];
      if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) found = node;
    });
    if (found) break;
  }
  return found;
}

function offerFromProduct(product) {
  if (!product) return null;
  if (Array.isArray(product.offers)) return product.offers[0] || null;
  return product.offers || null;
}


function htmlToReadableText(html = "") {
  return decodeEntities(String(html))
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br|\/p|\/div|\/li|\/article|\/section|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function indexOfInsensitive(haystack, needle, fromIndex = 0) {
  if (!needle) return -1;
  return String(haystack).toLocaleLowerCase("es-AR").indexOf(String(needle).toLocaleLowerCase("es-AR"), fromIndex);
}

function earliestIndex(html, needles, fromIndex = 0) {
  let best = -1;
  for (const needle of needles) {
    const index = indexOfInsensitive(html, needle, fromIndex);
    if (index >= 0 && (best < 0 || index < best)) best = index;
  }
  return best;
}

function titleVariants(title = "") {
  const clean = decodeEntities(String(title)).trim();
  if (!clean) return [];
  return [...new Set([
    clean,
    clean.replace(/&/g, "&amp;"),
    clean.replace(/"/g, "&quot;"),
    clean.replace(/'/g, "&#39;")
  ])];
}

/**
 * Los enlaces meli.la de afiliados abren una página social que incluye el
 * producto compartido y, debajo, muchas recomendaciones. Leer todo el HTML
 * mezcla precios de artículos diferentes. Esta función recorta solamente el
 * bloque principal: título/imagen -> precio -> "Ir a producto".
 */
function extractPrimaryProductScope({ html, finalUrl = "", title = "", image = "" }) {
  const fullHtml = String(html || "");
  const isSocialPage = /mercadolibre\.[^/]+\/social\//i.test(finalUrl) || /\/social\//i.test(fullHtml.slice(0, 25000));
  if (!fullHtml || !isSocialPage) {
    return {
      html: fullHtml,
      scoped: false,
      reason: "direct-or-unidentified-page",
      start: 0,
      end: fullHtml.length,
      anchor: -1
    };
  }

  const bodyStart = Math.max(0, indexOfInsensitive(fullHtml, "<body"));
  const firstProductEnd = earliestIndex(fullHtml, ["Ir a producto", "Ir al producto"], bodyStart);
  let anchor = -1;

  // Preferimos la aparición del título situada antes del primer botón del
  // producto. Así evitamos og:title y los artículos recomendados posteriores.
  for (const variant of titleVariants(title)) {
    let cursor = bodyStart;
    while (cursor >= 0) {
      const found = indexOfInsensitive(fullHtml, variant, cursor);
      if (found < 0) break;
      if (firstProductEnd < 0 || found < firstProductEnd) anchor = Math.max(anchor, found);
      cursor = found + Math.max(1, variant.length);
    }
  }

  if (anchor < 0 && image) {
    const basename = String(image).split("/").pop()?.split("?")[0] || "";
    if (basename) anchor = indexOfInsensitive(fullHtml, basename, bodyStart);
  }

  if (anchor < 0 && firstProductEnd >= 0) anchor = Math.max(bodyStart, firstProductEnd - 18000);
  if (anchor < 0) anchor = bodyStart;

  // El inicio deja margen para la imagen y atributos de la tarjeta. El final
  // se corta antes de recomendaciones como "Para vos" o "Quienes vieron...".
  const start = Math.max(bodyStart, anchor - 12000);
  const boundaryFrom = firstProductEnd >= 0 ? firstProductEnd : anchor;
  const recommendationStart = earliestIndex(fullHtml, [
    "Quienes vieron este producto también compraron",
    "Quienes vieron este producto tambien compraron",
    "Para vos",
    "Más vendidos",
    "Mas vendidos"
  ], boundaryFrom);

  let end;
  if (recommendationStart >= 0) {
    end = recommendationStart;
  } else if (firstProductEnd >= 0) {
    end = Math.min(fullHtml.length, firstProductEnd + 3500);
  } else {
    end = Math.min(fullHtml.length, anchor + 30000);
  }

  // Si el recorte resultara demasiado pequeño, usamos una ventana segura.
  if (end - start < 800 && recommendationStart < 0) end = Math.min(fullHtml.length, start + 25000);

  return {
    html: fullHtml.slice(start, end),
    scoped: true,
    reason: recommendationStart >= 0 ? "social-primary-before-recommendations" : "social-primary-window",
    start,
    end,
    anchor
  };
}

function collectPrimaryTextPrices(html, add) {
  const source = String(html || "");
  if (!source) return;

  // Primero usamos la estructura HTML: un importe con clase "previous" y la
  // siguiente fracción monetaria forman la pareja precio anterior/precio final.
  const previousPattern = /(?:andes-money-amount--previous|ui-pdp-price__original-value|data-testid=["']price-original["'])[\s\S]{0,1800}?andes-money-amount__fraction[^>]*>([\d.,]+)/i;
  const previousMatch = previousPattern.exec(source);
  if (previousMatch) {
    add(previousMatch[1], "primary-html-original", 245, "original");
    const afterPrevious = source.slice(previousMatch.index + previousMatch[0].length, previousMatch.index + previousMatch[0].length + 6000);
    const nextFraction = /andes-money-amount__fraction[^>]*>([\d.,]+)/i.exec(afterPrevious);
    if (nextFraction) add(nextFraction[1], "primary-html-sale", 246, "sale");
  } else {
    // Sin precio tachado, la primera fracción monetaria del bloque principal es
    // el precio publicado del producto compartido.
    const firstFraction = /andes-money-amount__fraction[^>]*>([\d.,]+)/i.exec(source);
    if (firstFraction) add(firstFraction[1], "primary-html-sale", 246, "sale");
  }

  const text = htmlToReadableText(source);
  if (!text) return;

  // Recortamos nuevamente a nivel texto para no incorporar cuotas ni envíos.
  const cutoff = earliestIndex(text, [
    "Mismo precio",
    "cuotas de",
    "Envío gratis",
    "Envio gratis",
    "Ir a producto",
    "Ir al producto",
    "Quienes vieron"
  ], 0);
  const primaryText = cutoff >= 0 ? text.slice(0, cutoff) : text.slice(0, 3500);
  const moneyMatches = [...primaryText.matchAll(/\$\s*([\d.]+(?:,[\d]{1,2})?)/g)]
    .map(match => validPrice(match[1]))
    .filter(value => value != null);

  const discountMatch = primaryText.match(/(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:OFF|de descuento|descuento)/i);
  const visibleDiscount = validPercentage(discountMatch?.[1]);

  if (visibleDiscount != null && moneyMatches.length >= 2) {
    add(moneyMatches[0], "primary-text-original", 235, "original");
    add(moneyMatches[1], "primary-text-sale", 236, "sale");
    return;
  }

  if (moneyMatches.length >= 1) {
    add(moneyMatches[0], "primary-text-sale", 236, "sale");
  }
}

function collectPriceCandidates({ html, item, jsonValues, structuredProduct, pricesData }) {
  const candidates = [];
  const add = (value, source, score, role = "sale") => {
    const price = validPrice(value);
    if (price != null) candidates.push({ price, source, score, role });
  };

  // La secuencia visual del producto principal tiene prioridad sobre cualquier
  // selector global. Es la clave para no mezclar precios de recomendaciones.
  collectPrimaryTextPrices(html, add);

  // El endpoint sale_price es la fuente de verdad cuando hay token.
  add(item?.sale_price?.amount, "api-sale-price", 220, "sale");
  add(item?.sale_price?.regular_amount, "api-sale-price-regular", 220, "original");

  // /prices puede contener valores standard y promotion.
  for (const priceItem of pricesData?.prices || []) {
    const restrictions = priceItem?.conditions?.context_restrictions || [];
    const marketplace = restrictions.length === 0 || restrictions.includes("channel_marketplace");
    const activeNow = (!priceItem?.conditions?.start_time || Date.parse(priceItem.conditions.start_time) <= Date.now()) &&
      (!priceItem?.conditions?.end_time || Date.parse(priceItem.conditions.end_time) >= Date.now());
    if (!marketplace || !activeNow) continue;
    if (priceItem.type === "promotion") {
      add(priceItem.amount, "api-prices-promotion", 205, "sale");
      add(priceItem.regular_amount, "api-prices-regular", 205, "original");
    } else if (priceItem.type === "standard") {
      add(priceItem.amount, "api-prices-standard", 125, "standard");
    }
  }

  // Los campos del recurso /items son respaldo; no deben pisar una promoción visible.
  add(item?.original_price, "api-item-original", 145, "original");
  add(item?.base_price, "api-item-base", 115, "standard");
  add(item?.price, "api-item-price", 105, "standard");

  const offer = offerFromProduct(structuredProduct);
  add(offer?.price, "jsonld-offer", 185, "sale");
  add(offer?.lowPrice, "jsonld-low-price", 180, "sale");
  add(offer?.highPrice, "jsonld-high-price", 130, "original");

  [
    ["product:price:amount", 182],
    ["og:price:amount", 180],
    ["price", 165]
  ].forEach(([key, score]) => add(metaContent(html, key), `meta-${key}`, score, "sale"));

  for (const root of jsonValues) {
    walk(root, (node, path) => {
      if (!node || typeof node !== "object") return;
      const lowerPath = path.toLowerCase();
      const irrelevant = /(installment|shipping|finance|interest|monthly|coupon_amount)/.test(lowerPath);
      if (irrelevant) return;

      add(node?.sale_price?.amount, `state:${path}.sale_price.amount`, 195, "sale");
      add(node?.sale_price?.regular_amount, `state:${path}.sale_price.regular_amount`, 195, "original");
      add(node?.current_price?.amount, `state:${path}.current_price.amount`, 192, "sale");
      add(node?.current_price?.regular_amount, `state:${path}.current_price.regular_amount`, 192, "original");

      if (typeof node.original_price === "number" || typeof node.original_price === "string") {
        add(node.original_price, `state:${path}.original_price`, 176, "original");
      }
      if (typeof node.regular_amount === "number" || typeof node.regular_amount === "string") {
        add(node.regular_amount, `state:${path}.regular_amount`, 174, "original");
      }
      if (typeof node.base_price === "number" || typeof node.base_price === "string") {
        add(node.base_price, `state:${path}.base_price`, 142, "standard");
      }

      const preferredSale = /(sale_price|current_price|offer|buybox|winner|promotion|discounted)/.test(lowerPath);
      if ((typeof node.price === "number" || typeof node.price === "string") && preferredSale) {
        add(node.price, `state:${path}.price`, 172, "sale");
      }
      if ((typeof node.amount === "number" || typeof node.amount === "string") && preferredSale) {
        add(node.amount, `state:${path}.amount`, 170, "sale");
      }
    });
  }

  // Precio promocional principal visible en la publicación.
  const salePatterns = [
    /ui-pdp-price__main-container[\s\S]{0,3000}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /ui-pdp-price__second-line[\s\S]{0,2200}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /data-testid=["']price-part["'][\s\S]{0,1500}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /class=["'][^"']*andes-money-amount[^"']*["'][^>]*aria-label=["'][^"']*?([\d.]{3,}(?:,[\d]{1,2})?)[^"']*["']/i,
    /aria-label=["'][^"']*?([\d.]{3,}(?:,[\d]{1,2})?)[^"']*["'][^>]*class=["'][^"']*andes-money-amount/i
  ];
  salePatterns.forEach((pattern, index) => {
    const match = html.match(pattern);
    if (match) add(match[1], `html-sale-${index + 1}`, 200 - index, "sale");
  });

  // Precio tachado / anterior.
  const originalPatterns = [
    /ui-pdp-price__original-value[\s\S]{0,1400}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /andes-money-amount--previous[\s\S]{0,1200}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /data-testid=["']price-original["'][\s\S]{0,1200}?andes-money-amount__fraction[^>]*>([\d.,]+)</i,
    /(?:Precio anterior|Precio original|Antes)[^\d]{0,80}([\d.]{3,}(?:,[\d]{1,2})?)/i
  ];
  originalPatterns.forEach((pattern, index) => {
    const match = html.match(pattern);
    if (match) add(match[1], `html-original-${index + 1}`, 198 - index, "original");
  });

  const serializedPatterns = [
    [/[["']sale_price["']\s*:\s*\{[^{}]{0,700}?["']amount["']\s*:\s*([\d.]+)/i, "sale", 188],
    [/[["']current_price["']\s*:\s*\{[^{}]{0,700}?["']amount["']\s*:\s*([\d.]+)/i, "sale", 186],
    [/[["']regular_amount["']\s*:\s*([\d.]+)/i, "original", 184],
    [/[["']original_price["']\s*:\s*([\d.]+)/i, "original", 182],
    [/[["']base_price["']\s*:\s*([\d.]+)/i, "standard", 140]
  ];
  serializedPatterns.forEach(([pattern, role, score], index) => {
    const match = html.match(pattern);
    if (match) add(match[1], `html-json-${index + 1}`, score, role);
  });

  // Último respaldo: primeras fracciones monetarias. Menor prioridad.
  const genericFractions = [...html.matchAll(/andes-money-amount__fraction[^>]*>([\d.,]+)</gi)].slice(0, 15);
  genericFractions.forEach((match, index) => add(match[1], `html-fraction-${index + 1}`, 90 - index, "sale"));

  candidates.sort((a, b) => b.score - a.score || a.price - b.price);
  return candidates;
}

function extractPromotionInfo(html, jsonValues) {
  const text = decodeEntities(String(html).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ");

  const groups = [
    {
      kind: "bonus",
      label: "bonificación",
      patterns: [
        /(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:de\s*)?(?:bonificaci[oó]n|reintegro)/i,
        /(?:bonificaci[oó]n|reintegro)\s*(?:de\s*)?(\d{1,2}(?:[.,]\d+)?)\s*%/i,
        /(\d{1,2}(?:[.,]\d+)?)\s*%[^.]{0,100}(?:con cup[oó]n|usando cup[oó]n|al pagar con|con Mercado Pago)/i
      ]
    },
    {
      kind: "discount",
      label: "descuento",
      patterns: [
        /(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:OFF|de descuento|descuento)/i,
        /(?:descuento)\s*(?:de\s*)?(\d{1,2}(?:[.,]\d+)?)\s*%/i
      ]
    }
  ];

  for (const group of groups) {
    for (const pattern of group.patterns) {
      const match = text.match(pattern);
      const percentage = validPercentage(match?.[1]);
      if (percentage != null) return { percentage, kind: group.kind, label: group.label, source: "visible-text" };
    }
  }

  let found = null;
  for (const root of jsonValues) {
    walk(root, (node, path) => {
      if (found != null || !node || typeof node !== "object") return;
      const pathText = path.toLowerCase();
      for (const [key, value] of Object.entries(node)) {
        const fullKey = `${pathText}.${key.toLowerCase()}`;
        const parsed = validPercentage(value);
        if (parsed == null) continue;
        if (/(bonus|bonification|cashback|rebate|coupon).*percent|percent.*(bonus|bonification|cashback|rebate|coupon)/i.test(fullKey)) {
          found = { percentage: parsed, kind: "bonus", label: "bonificación", source: `state:${path}.${key}` };
          return;
        }
        if (/(discount.*percent|percent.*discount|discount_percentage|discount_rate|meli_boosted_percentage)/i.test(fullKey)) {
          found = { percentage: parsed, kind: "discount", label: "descuento", source: `state:${path}.${key}` };
          return;
        }
      }
    });
    if (found != null) break;
  }
  return found;
}
function roundDiscount(value) {
  if (!Number.isFinite(value)) return null;
  const roundedInteger = Math.round(value);
  return Math.abs(value - roundedInteger) < 0.08 ? roundedInteger : Math.round(value * 10) / 10;
}

function roundMoney(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function choosePricing(candidates, promotionInfo) {
  const saleCandidates = candidates.filter(candidate => candidate.role === "sale");
  const originalCandidates = candidates.filter(candidate => candidate.role === "original" || candidate.role === "standard");

  let saleCandidate = saleCandidates[0] || originalCandidates.find(candidate => candidate.role === "standard") || null;
  let originalCandidate = null;

  // Cuando hay un OFF visible, evaluamos parejas completas en lugar de aceptar
  // el primer importe. Esto resuelve cambios de markup donde el precio tachado
  // también puede ser capturado por un selector de precio de venta.
  if (promotionInfo?.kind === "discount" && promotionInfo.percentage != null) {
    let bestPair = null;
    for (const original of originalCandidates) {
      for (const sale of saleCandidates) {
        if (!(original.price > sale.price * 1.002)) continue;
        const calculated = ((original.price - sale.price) / original.price) * 100;
        const difference = Math.abs(calculated - promotionInfo.percentage);
        const structuralBonus = /primary-(?:html|text)/.test(`${sale.source} ${original.source}`) ? 500 : 0;
        const consistencyBonus = difference <= 2.5 ? 1000 - difference * 100 : -difference * 60;
        const score = sale.score + original.score + structuralBonus + consistencyBonus;
        if (!bestPair || score > bestPair.score) bestPair = { sale, original, calculated, difference, score };
      }
    }
    if (bestPair && bestPair.difference <= 3) {
      saleCandidate = bestPair.sale;
      originalCandidate = bestPair.original;
    }
  }

  const price = saleCandidate?.price ?? null;

  if (!originalCandidate && promotionInfo?.kind !== "bonus") {
    originalCandidate = originalCandidates
      .filter(candidate => price == null || candidate.price > price * 1.002)
      .sort((a, b) => b.score - a.score || b.price - a.price)[0] || null;
  }

  const originalPrice = originalCandidate?.price ?? null;
  const hasDirectDiscount = Boolean(price != null && originalPrice != null && originalPrice > price);

  // Nunca reconstruimos un supuesto precio original a partir de un porcentaje.
  const calculatedDiscount = hasDirectDiscount
    ? ((originalPrice - price) / originalPrice) * 100
    : null;

  let discountPercentage = null;
  if (hasDirectDiscount) {
    const explicit = promotionInfo?.kind === "discount" ? promotionInfo.percentage : null;
    discountPercentage = explicit != null && Math.abs(explicit - calculatedDiscount) <= 2.5
      ? roundDiscount(explicit)
      : roundDiscount(calculatedDiscount);
  }

  const bonusPercentage = promotionInfo?.kind === "bonus"
    ? roundDiscount(promotionInfo.percentage)
    : null;
  const hasBonus = Boolean(price != null && bonusPercentage != null && bonusPercentage > 0 && bonusPercentage < 100);
  const effectivePrice = hasBonus
    ? roundMoney(price * (1 - bonusPercentage / 100))
    : price;

  const directSavings = hasDirectDiscount ? Math.max(0, originalPrice - price) : 0;
  const bonusSavings = hasBonus ? Math.max(0, price - effectivePrice) : 0;
  const savings = hasDirectDiscount || hasBonus ? roundMoney(directSavings + bonusSavings) : null;

  return {
    price,
    effectivePrice,
    originalPrice: hasDirectDiscount ? originalPrice : null,
    discountPercentage,
    bonusPercentage,
    savings,
    directSavings: hasDirectDiscount ? roundMoney(directSavings) : null,
    bonusSavings: hasBonus ? roundMoney(bonusSavings) : null,
    hasDiscount: hasDirectDiscount,
    hasBonus,
    promotionType: hasBonus ? "bonus" : (hasDirectDiscount ? "discount" : ""),
    priceSource: saleCandidate?.source || "",
    originalPriceSource: hasDirectDiscount ? (originalCandidate?.source || "") : "",
    promotionSource: promotionInfo?.source || ""
  };
}
function extractCurrency({ html, item, structuredProduct, jsonValues }) {
  const offer = offerFromProduct(structuredProduct);
  const direct = item?.sale_price?.currency_id || item?.currency_id || offer?.priceCurrency ||
    metaContent(html, "product:price:currency") || metaContent(html, "og:price:currency");
  if (direct) return String(direct).toUpperCase();

  let found = "";
  for (const root of jsonValues) {
    walk(root, node => {
      if (found || !node || typeof node !== "object") return;
      const currency = node.currency_id || node.currency || node.priceCurrency;
      if (typeof currency === "string" && /^[A-Z]{3}$/i.test(currency)) found = currency.toUpperCase();
    });
    if (found) break;
  }
  return found || "ARS";
}

function extractImage({ html, item, structuredProduct, jsonValues }) {
  const fromLd = Array.isArray(structuredProduct?.image) ? structuredProduct.image[0] : structuredProduct?.image;
  const direct = item?.pictures?.[0]?.secure_url || item?.thumbnail?.replace("-I.jpg", "-O.jpg") || fromLd || metaContent(html, "og:image");
  if (direct) return direct;

  let image = "";
  for (const root of jsonValues) {
    walk(root, node => {
      if (image || !node || typeof node !== "object") return;
      const candidate = node.secure_url || node.url || node.src;
      if (typeof candidate === "string" && /^https:\/\//i.test(candidate) && /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(candidate)) image = candidate;
    });
    if (image) break;
  }
  return image;
}

function extractTitle({ html, item, structuredProduct, jsonValues }) {
  const direct = item?.title || structuredProduct?.name || metaContent(html, "og:title") || metaContent(html, "twitter:title");
  if (direct) return String(direct).replace(/\s*\|\s*Mercado\s*Libre.*$/i, "").trim();

  let title = "";
  for (const root of jsonValues) {
    walk(root, node => {
      if (title || !node || typeof node !== "object") return;
      const candidate = node.title || node.name;
      if (typeof candidate === "string" && candidate.length > 12 && candidate.length < 240) title = candidate;
    });
    if (title) break;
  }
  return title || "Producto recomendado en Mercado Libre";
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "es-AR,es;q=0.9,en;q=0.6",
      "cache-control": "no-cache"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { html: await response.text(), finalUrl: response.url };
}

async function fetchJson(url, token = "") {
  const headers = {
    "accept": "application/json",
    "user-agent": "AreaUnoProductPreview/4.1"
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const rawUrl = typeof req.query.url === "string" ? req.query.url.trim() : "";
  if (!allowedUrl(rawUrl)) return res.status(400).json({ error: "Enlace de Mercado Libre inválido" });

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");

  let page = { html: "", finalUrl: rawUrl };
  let pageError = "";
  try {
    page = await fetchText(rawUrl);
  } catch (error) {
    pageError = error.message || "No se pudo leer el enlace";
  }

  const jsonValues = extractJsonScripts(page.html);
  const structuredProduct = findStructuredProduct(jsonValues);
  const preliminaryTitle = extractTitle({ html: page.html, item: null, structuredProduct, jsonValues });
  const preliminaryImage = extractImage({ html: page.html, item: null, structuredProduct, jsonValues });
  const productScope = extractPrimaryProductScope({
    html: page.html,
    finalUrl: page.finalUrl,
    title: preliminaryTitle,
    image: preliminaryImage
  });
  const scopedJsonValues = productScope.scoped ? extractJsonScripts(productScope.html) : jsonValues;
  const itemId = findItemId(`${page.finalUrl} ${productScope.html}`) || findItemId(page.html);

  let item = null;
  let category = "";

  if (itemId) {
    try {
      item = await fetchJson(`https://api.mercadolibre.com/items/${itemId}`);
    } catch {}
  }

  if (item?.category_id) {
    try {
      const categoryData = await fetchJson(`https://api.mercadolibre.com/categories/${item.category_id}`);
      category = categoryData?.name || "";
    } catch {}
  }

  const priceCandidates = collectPriceCandidates({
    html: productScope.html,
    item,
    jsonValues: scopedJsonValues,
    structuredProduct: productScope.scoped ? null : structuredProduct,
    pricesData: null
  });
  const promotionInfo = extractPromotionInfo(productScope.html, scopedJsonValues);
  const pricing = choosePricing(priceCandidates, promotionInfo);
  const title = item?.title || preliminaryTitle || "Producto recomendado en Mercado Libre";
  const image = extractImage({ html: productScope.html, item, structuredProduct: productScope.scoped ? null : structuredProduct, jsonValues: scopedJsonValues }) || preliminaryImage;
  const currency = extractCurrency({ html: productScope.html, item, structuredProduct: productScope.scoped ? null : structuredProduct, jsonValues: scopedJsonValues });
  const brand = attributeValue(item?.attributes, "BRAND") ||
    (typeof structuredProduct?.brand === "string" ? structuredProduct.brand : structuredProduct?.brand?.name) || "";

  const payload = {
    id: itemId || null,
    title: title || "Producto recomendado en Mercado Libre",
    image: image || "",
    price: pricing.price,
    effectivePrice: pricing.effectivePrice,
    originalPrice: pricing.originalPrice,
    discountPercentage: pricing.discountPercentage,
    bonusPercentage: pricing.bonusPercentage,
    savings: pricing.savings,
    directSavings: pricing.directSavings,
    bonusSavings: pricing.bonusSavings,
    hasDiscount: pricing.hasDiscount,
    hasBonus: pricing.hasBonus,
    promotionType: pricing.promotionType,
    promotionLabel: pricing.hasBonus
      ? `${pricing.bonusPercentage}% de bonificación`
      : (pricing.discountPercentage != null ? `${pricing.discountPercentage}% OFF` : ""),
    currency,
    priceSource: pricing.priceSource,
    originalPriceSource: pricing.originalPriceSource,
    priceAutomatic: pricing.price != null,
    category: category || "Otras recomendaciones",
    brand,
    condition: item?.condition || "",
    freeShipping: Boolean(item?.shipping?.free_shipping),
    status: item?.status || "",
    sourceUrl: page.finalUrl,
    affiliateUrl: rawUrl,
    fetchedPage: Boolean(page.html),
    priceNotice: pricing.price == null
      ? "Consultá el precio actualizado en Mercado Libre"
      : ((pricing.hasDiscount || pricing.hasBonus)
          ? "Promoción detectada en los datos públicos del enlace"
          : "Precio publicado; promociones adicionales pueden verse al ingresar")
  };

  if (req.query.debug === "1") {
    payload.debug = {
      pageError,
      finalUrl: page.finalUrl,
      htmlLength: page.html.length,
      jsonScripts: jsonValues.length,
      itemFound: Boolean(item),
      productScope: {
        scoped: productScope.scoped,
        reason: productScope.reason,
        start: productScope.start,
        end: productScope.end,
        length: productScope.html.length,
        anchor: productScope.anchor
      },
      promotionInfo,
      candidatePrices: priceCandidates.slice(0, 20)
    };
  }

  return res.status(200).json(payload);
};

// Helpers expuestos únicamente para pruebas locales; no afectan el endpoint.
module.exports.__test = {
  extractPrimaryProductScope,
  collectPriceCandidates,
  extractPromotionInfo,
  choosePricing,
  htmlToReadableText
};
