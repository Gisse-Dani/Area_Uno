const BUILD_VERSION = "5.4.0-home-deeplinks";


const CATEGORY_ORDER = [
  "Tecnología",
  "Electrodomésticos",
  "Hogar y Jardín",
  "Herramientas",
  "Oficina y Comercio",
  "Gaming",
  "Audio y Video",
  "Redes y Conectividad",
  "Servidores e Infraestructura",
  "Automotor",
  "Belleza y Cuidado Personal",
  "Deportes y Tiempo Libre",
  "Otros"
];

const state = {
  products: [],
  category: "Tecnología",
  search: "",
  sort: "default",
  visibleCount: 12
};

const els = {
  productGrid: document.querySelector("#productGrid"),
  featuredGrid: document.querySelector("#featuredGrid"),
  categoryFilters: document.querySelector("#categoryFilters"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  resultsCopy: document.querySelector("#resultsCopy"),
  emptyState: document.querySelector("#emptyState"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  heroProductCount: document.querySelector("#heroProductCount"),
  heroCategoryCount: document.querySelector("#heroCategoryCount"),
  currentYear: document.querySelector("#currentYear"),
  backTop: document.querySelector("#backTop"),
  menuToggle: document.querySelector(".menu-toggle"),
  nav: document.querySelector(".nav"),
  header: document.querySelector(".site-header"),
  catalogLoading: document.querySelector("#catalogLoading"),
  loadingProgress: document.querySelector("#loadingProgress")
};

const defaultMoney = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function normalizeText(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get("categoria");
  const requestedSearch = params.get("q");
  if (requestedCategory) state.category = requestedCategory.trim();
  if (requestedSearch) {
    state.search = requestedSearch.trim();
    if (els.searchInput) els.searchInput.value = state.search;
  }
}

function extractUrl(line = "") {
  const match = String(line).match(/https?:\/\/[^\s|]+/i);
  return match ? match[0].trim() : "";
}

async function getLinks() {
  const response = await fetch(`/shop/productos.txt?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo leer productos.txt");
  const text = await response.text();
  const seen = new Set();

  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .map(extractUrl)
    .filter(url => {
      if (!/^https?:\/\//i.test(url) || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .map((url, index) => ({
      url,
      order: index,
      badge: index < 3 ? "Destacado" : "Recomendado"
    }));
}

async function fetchProduct(linkData) {
  try {
    const query = new URLSearchParams({ url: linkData.url });
    const response = await fetch(`/api/product?${query.toString()}`, { cache: "default" });
    if (!response.ok) throw new Error("Producto no disponible");
    const data = await response.json();
    return {
      ...data,
      affiliateUrl: linkData.url,
      badge: linkData.badge,
      order: linkData.order,
      category: data.category || "Otros",
      subcategory: data.subcategory || data.marketplaceCategory || "Otros productos",
      marketplaceCategory: data.marketplaceCategory || "",
      marketplaceCategoryPath: data.marketplaceCategoryPath || "",
      classificationSource: data.classificationSource || "",
      error: false
    };
  } catch {
    return {
      title: "Producto recomendado en Mercado Libre",
      category: "Otros",
      subcategory: "Otros productos",
      marketplaceCategory: "",
      marketplaceCategoryPath: "",
      classificationSource: "fallback",
      image: "",
      price: null,
      effectivePrice: null,
      originalPrice: null,
      discountPercentage: null,
      bonusPercentage: null,
      savings: null,
      hasDiscount: false,
      hasBonus: false,
      currency: "ARS",
      priceAutomatic: false,
      priceNotice: "Consultá el precio actualizado en Mercado Libre",
      affiliateUrl: linkData.url,
      badge: linkData.badge,
      order: linkData.order,
      error: true
    };
  }
}

async function mapWithConcurrency(items, limit, mapper, onProgress) {
  const results = new Array(items.length);
  let cursor = 0;
  let completed = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
      completed += 1;
      if (typeof onProgress === "function") onProgress(completed, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function showCatalogLoading(total = 0) {
  if (els.catalogLoading) els.catalogLoading.hidden = false;
  if (els.loadingProgress) {
    els.loadingProgress.textContent = total > 0
      ? `Buscando 0 de ${total} productos…`
      : "Preparando catálogo…";
  }
  els.resultsCopy.textContent = "Estamos preparando las recomendaciones para vos…";
}

function updateCatalogLoading(completed, total) {
  if (els.loadingProgress) els.loadingProgress.textContent = `Buscando ${completed} de ${total} productos…`;
}

function hideCatalogLoading() {
  if (els.catalogLoading) els.catalogLoading.hidden = true;
}

function formatPrice(value, currency = "ARS") {
  if (!Number.isFinite(Number(value))) return "Ver precio actualizado";
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0
    }).format(Number(value));
  } catch {
    return defaultMoney.format(Number(value));
  }
}

function finalPrice(product) {
  return product.effectivePrice ?? product.price ?? null;
}

function productPricingMarkup(product) {
  const effective = finalPrice(product);

  if (product.hasBonus && effective != null && product.price != null && effective < product.price) {
    return `
      <div class="product-price product-price-bonus">
        <small>Precio final con bonificaci&oacute;n</small>
        <div class="price-offer-row">
          <strong>${escapeHtml(formatPrice(effective, product.currency))}</strong>
          <span class="discount-pill bonus-pill">${escapeHtml(product.promotionLabel || `${product.bonusPercentage}%`)}</span>
        </div>
        <div class="published-price-row">
          <span>Precio publicado</span>
          <b>${escapeHtml(formatPrice(product.price, product.currency))}</b>
        </div>
        ${product.savings != null ? `<small class="price-saving">Ahorr&aacute;s ${escapeHtml(formatPrice(product.savings, product.currency))}</small>` : ""}
      </div>`;
  }

  if (product.hasDiscount && effective != null && product.originalPrice != null && product.originalPrice > effective) {
    return `
      <div class="product-price product-price-offer">
        <div class="price-reference-row">
          <span>Precio anterior</span>
          <del>${escapeHtml(formatPrice(product.originalPrice, product.currency))}</del>
        </div>
        <div class="price-offer-row">
          <strong>${escapeHtml(formatPrice(effective, product.currency))}</strong>
          <span class="discount-pill">${escapeHtml(product.promotionLabel || `${product.discountPercentage}% OFF`)}</span>
        </div>
        ${product.savings != null ? `<small class="price-saving">Ahorr&aacute;s ${escapeHtml(formatPrice(product.savings, product.currency))}</small>` : ""}
      </div>`;
  }

  if (product.price != null) {
    return `
      <div class="product-price product-price-simple">
        <small>Precio publicado</small>
        <strong>${escapeHtml(formatPrice(product.price, product.currency))}</strong>
        <small class="price-condition">${escapeHtml(product.priceNotice || "Verificá promociones y precio final en Mercado Libre.")}</small>
      </div>`;
  }

  return `
    <div class="product-price product-price-simple">
      <small>Precio y promociones</small>
      <strong class="price-link-copy">Ver precio actualizado</strong>
      <small class="price-condition">Mercado Libre confirmará el valor final al ingresar.</small>
    </div>`;
}

function productFlags(product) {
  const flags = [];
  if (product.freeShipping) flags.push("Envío gratis");
  if (product.condition === "new") flags.push("Nuevo");
  if (product.brand) flags.push(product.brand);
  return flags.slice(0, 2);
}

function imageMarkup(product, className = "") {
  if (product.image) {
    return `<img class="${className}" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy" referrerpolicy="no-referrer">`;
  }
  return `<div class="fallback-mark">A1</div><small>Ver producto</small>`;
}

function renderHeroPreview() {
  // El hero de v5.1 utiliza la identidad de marca y no depende de un producto dinámico.
}

function featuredCard(product) {
  const effective = finalPrice(product);
  return `
    <article class="featured-card ${product.image ? "" : "product-fallback"}">
      <a href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener">
        <div class="featured-media">${imageMarkup(product)}</div>
        <div class="featured-overlay">
          <div class="featured-meta">
            <span>${escapeHtml(product.category).toUpperCase()}</span>
            <div class="featured-price">
              ${(product.hasDiscount || product.hasBonus) && product.originalPrice ? `<small>${escapeHtml(formatPrice(product.originalPrice, product.currency))}</small>` : ""}
              <b>${escapeHtml(formatPrice(effective, product.currency))}</b>
              ${(product.hasDiscount || product.hasBonus) ? `<em>${escapeHtml(product.promotionLabel || "Oferta")}</em>` : ""}
            </div>
          </div>
          <h3>${escapeHtml(product.title)}</h3>
        </div>
      </a>
    </article>`;
}

function renderFeatured() {
  const featured = state.products.slice(0, 3);
  if (!featured.length) {
    els.featuredGrid.innerHTML = `
      <div class="featured-card product-fallback"><div class="featured-media"><div><div class="fallback-mark">A1</div><p>Selección visual profesional</p></div></div></div>
      <div class="featured-card product-fallback"><div class="featured-media"><div><div class="fallback-mark">✓</div><p>Lectura clara y rápida</p></div></div></div>
      <div class="featured-card product-fallback"><div class="featured-media"><div><div class="fallback-mark">↗</div><p>Salida directa a la compra</p></div></div></div>`;
    return;
  }
  els.featuredGrid.innerHTML = featured.map(featuredCard).join("");
}

function productCard(product) {
  const flags = productFlags(product);
  return `
    <article class="product-card ${product.image ? "" : "product-fallback"}">
      <div class="product-image">
        <span class="product-chip">${escapeHtml(product.badge || "RECOMENDADO").toUpperCase()}</span>
        ${imageMarkup(product)}
      </div>
      <div class="product-body">
        <p class="product-category">${escapeHtml(product.category)}</p>
        <h3 class="product-title">${escapeHtml(product.title)}</h3>
        <div class="product-flags">${flags.map(flag => `<span class="product-flag">${escapeHtml(flag)}</span>`).join("")}</div>
        ${productPricingMarkup(product)}
        <a class="product-action" href="${escapeHtml(product.affiliateUrl)}" target="_blank" rel="sponsored nofollow noopener">
          <span>Ver producto y precio final</span><span>↗</span>
        </a>
      </div>
    </article>`;
}

function filteredProducts() {
  let list = [...state.products];
  if (state.category !== "Todos") list = list.filter(item => item.category === state.category);
  if (state.search) {
    const needle = normalizeText(state.search);
    list = list.filter(item => normalizeText(`${item.title} ${item.category} ${item.subcategory || ""} ${item.marketplaceCategory || ""} ${item.marketplaceCategoryPath || ""} ${item.brand || ""}`).includes(needle));
  }
  if (state.sort === "priceAsc") list.sort((a, b) => (Number(finalPrice(a)) || Infinity) - (Number(finalPrice(b)) || Infinity));
  if (state.sort === "priceDesc") list.sort((a, b) => (Number(finalPrice(b)) || -1) - (Number(finalPrice(a)) || -1));
  if (state.sort === "name") list.sort((a, b) => a.title.localeCompare(b.title, "es"));
  return list;
}

function renderFilters() {
  const available = [...new Set(state.products.map(item => item.category).filter(Boolean))];
  available.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "es");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  if (!available.includes(state.category)) {
    state.category = available.includes("Tecnología") ? "Tecnología" : (available[0] || "Todos");
  }
  const categories = [...available, "Todos"];
  els.categoryFilters.innerHTML = categories.map(category => `
    <button class="filter-button ${state.category === category ? "active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");
  els.categoryFilters.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      state.visibleCount = 12;
      renderFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const list = filteredProducts();
  const visible = list.slice(0, state.visibleCount);
  els.productGrid.innerHTML = visible.map(productCard).join("");

  const emptyHeading = els.emptyState.querySelector("h3");
  const emptyText = els.emptyState.querySelector("p");
  emptyHeading.textContent = "No encontramos coincidencias";
  emptyText.textContent = "Probá con otra búsqueda o elegí la categoría “Todos”.";
  els.emptyState.hidden = list.length > 0 || state.products.length === 0;
  els.productGrid.hidden = list.length === 0;

  if (els.loadMoreButton) {
    els.loadMoreButton.hidden = visible.length >= list.length || list.length === 0;
  }

  const total = list.length;
  const shown = visible.length;
  const categoryCopy = state.category !== "Todos" ? ` en ${state.category}` : "";
  els.resultsCopy.textContent = total > shown
    ? `Mostrando ${shown} de ${total} productos${categoryCopy}`
    : `${total} ${total === 1 ? "producto" : "productos"}${categoryCopy}`;
}

function updateCounters() {
  const categories = new Set(state.products.map(item => item.category));
  els.heroProductCount.textContent = state.products.length;
  els.heroCategoryCount.textContent = categories.size;
}

function setupInteractions() {
  els.searchInput.addEventListener("input", event => {
    state.search = event.target.value.trim();
    state.visibleCount = 12;
    renderProducts();
  });
  els.sortSelect.addEventListener("change", event => {
    state.sort = event.target.value;
    state.visibleCount = 12;
    renderProducts();
  });
  if (els.loadMoreButton) {
    els.loadMoreButton.addEventListener("click", () => {
      state.visibleCount += 12;
      renderProducts();
    });
  }
  els.currentYear.textContent = new Date().getFullYear();
  els.backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  els.menuToggle.addEventListener("click", () => {
    const open = els.nav.classList.toggle("open");
    document.body.classList.toggle("menu-open", open);
    els.menuToggle.setAttribute("aria-expanded", String(open));
  });
  els.nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    els.nav.classList.remove("open");
    document.body.classList.remove("menu-open");
    els.menuToggle.setAttribute("aria-expanded", "false");
  }));
  window.addEventListener("scroll", () => {
    els.backTop.classList.toggle("show", window.scrollY > 650);
    els.header.classList.toggle("is-sticky", window.scrollY > 80);
  }, { passive: true });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(node => observer.observe(node));
}

async function init() {
  setupInteractions();
  applyUrlFilters();
  showCatalogLoading();
  try {
    const links = await getLinks();
    showCatalogLoading(links.length);
    if (!links.length) {
      state.products = [];
      els.productGrid.innerHTML = "";
      els.productGrid.hidden = true;
      els.emptyState.hidden = false;
      els.emptyState.querySelector("h3").textContent = "Próximamente habrá productos disponibles";
      els.emptyState.querySelector("p").textContent = "Estamos preparando la selección para que puedas explorarla muy pronto.";
      els.resultsCopy.textContent = "Todavía no hay productos publicados";
      updateCounters();
      renderHeroPreview();
      renderFeatured();
      hideCatalogLoading();
      return;
    }
    state.products = await mapWithConcurrency(links, 6, fetchProduct, updateCatalogLoading);
    updateCounters();
    renderHeroPreview();
    renderFeatured();
    renderFilters();
    renderProducts();
    hideCatalogLoading();
  } catch {
    els.productGrid.innerHTML = "";
    els.productGrid.hidden = true;
    els.emptyState.hidden = false;
    els.emptyState.querySelector("h3").textContent = "No pudimos cargar el catálogo";
    els.emptyState.querySelector("p").textContent = "Probá nuevamente en unos instantes.";
    els.resultsCopy.textContent = "No pudimos cargar los productos";
    hideCatalogLoading();
    renderHeroPreview();
    renderFeatured();
  }
}

console.info(`[Área Uno] catálogo ${BUILD_VERSION}`);
init();
