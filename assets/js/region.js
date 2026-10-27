(async () => {
  const MANUAL_REGION_KEY = 'area1_region_manual';
  const SESSION_REGION_KEY = 'area1_region_auto';
  const LEGACY_REGION_KEY = 'area1_region';
  const supportedRegions = ['ar', 'cl'];
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get('region') || '').toLowerCase();
  const manual = (localStorage.getItem(MANUAL_REGION_KEY) || '').toLowerCase();
  const sessionRegion = (sessionStorage.getItem(SESSION_REGION_KEY) || '').toLowerCase();
  const host = (window.location.hostname || '').toLowerCase();
  const domainRegion = host.endsWith('.cl') ? 'cl' : (host.endsWith('.com.ar') ? 'ar' : '');

  // v5.3: the old key mixed automatic and manual selections. Remove it once so
  // geolocation can work correctly for visitors who used previous versions.
  if (localStorage.getItem(LEGACY_REGION_KEY) !== null) localStorage.removeItem(LEGACY_REGION_KEY);

  async function detectRegionByIp() {
    try {
      const response = await fetch('/api/region', { cache: 'no-store' });
      if (!response.ok) throw new Error('region detection unavailable');
      const data = await response.json();
      return supportedRegions.includes(String(data.region || '').toLowerCase())
        ? String(data.region).toLowerCase()
        : '';
    } catch {
      return '';
    }
  }

  let detectedRegion = '';
  const hasRequested = supportedRegions.includes(requested);
  const hasManual = supportedRegions.includes(manual);
  const hasSession = supportedRegions.includes(sessionRegion);

  if (!hasRequested && !hasManual && !domainRegion && !hasSession) {
    detectedRegion = await detectRegionByIp();
  }

  const browserRegion = /^es-cl\b/i.test(navigator.language || '') ? 'cl' : 'ar';
  const region = hasRequested
    ? requested
    : (hasManual
      ? manual
      : (domainRegion || (hasSession ? sessionRegion : (detectedRegion || browserRegion))));
  const regionName = region === 'cl' ? 'Chile' : 'Argentina';
  const locale = region === 'cl' ? 'es-CL' : 'es-AR';
  const currency = region === 'cl' ? 'CLP' : 'ARS';

  if (!hasManual) sessionStorage.setItem(SESSION_REGION_KEY, region);
  document.documentElement.lang = locale;
  document.documentElement.dataset.region = region;

  const pageVertical = (() => {
    const p = window.location.pathname.toLowerCase();
    if (p.includes('equipamiento')) return 'equipment';
    if (p.includes('datos')) return 'analytics';
    if (p.includes('proyectos-digitales') || p.includes('eventos')) return 'projects';
    if (p.includes('/shop')) return 'shop';
    return 'general';
  })();

  const messages = {
    general: 'Hola, vengo desde el sitio de Área 1 y quiero hacer una consulta sobre sus servicios.',
    analytics: 'Hola, vengo desde Área 1 Analítica & Procesos. Quiero mejorar procesos y ordenar la información de mi organización. ¿Podemos conversar?',
    equipment: 'Hola, vengo desde Área 1 Equipamiento. Quiero cotizar equipamiento para mi proyecto. ¿Me ayudan a definir la opción adecuada?',
    shop: 'Hola, vengo desde Área 1 Shop. Quiero consultar por un producto recomendado.',
    projects: 'Hola, vengo desde Área 1 Proyectos Digitales. Quiero una propuesta para mi proyecto digital o evento.'
  };

  const arDefaults = {
    region: 'ar', regionName: 'Argentina', locale: 'es-AR', currency: 'ARS',
    whatsapp: {
      general: '5492984713844', generalDisplay: '+54 9 2984 713844',
      equipment: '5492984713844', equipmentDisplay: '+54 9 2984 713844',
      analytics: '5492984713844', analyticsDisplay: '+54 9 2984 713844',
      shop: '5492984713844', shopDisplay: '+54 9 2984 713844',
      projects: '5492984713844', projectsDisplay: '+54 9 2984 713844'
    },
    instagram: 'areauno.servicios'
  };

  const clDefaults = {
    region: 'cl', regionName: 'Chile', locale: 'es-CL', currency: 'CLP',
    whatsapp: {
      general: '56922184205', generalDisplay: '+56 9 2218 4205',
      equipment: '56922184205', equipmentDisplay: '+56 9 2218 4205',
      analytics: '56922184205', analyticsDisplay: '+56 9 2218 4205',
      shop: '', shopDisplay: '',
      projects: '56922184205', projectsDisplay: '+56 9 2218 4205'
    },
    instagram: 'areaunocl'
  };

  let publicConfig = region === 'ar' ? arDefaults : clDefaults;

  function internalLinkWithRegion(rawHref) {
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return rawHref;
    try {
      const url = new URL(rawHref, window.location.origin);
      if (url.origin !== window.location.origin) return rawHref;
      if (/\.(pdf|png|jpg|jpeg|webp|svg|zip|txt)$/i.test(url.pathname)) return rawHref;
      url.searchParams.set('region', region);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return rawHref;
    }
  }

  function updateInternalLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (/wa\.me|instagram\.com/i.test(href || '')) return;
      const next = internalLinkWithRegion(href);
      if (next && next !== href) link.setAttribute('href', next);
    });
  }

  function applyRegionalAvailability() {
    if (region !== 'cl') return;

    // Área 1 Shop opera exclusivamente en Argentina.
    if (pageVertical === 'shop') {
      const target = new URL('/?region=cl', window.location.origin);
      target.hash = 'soluciones';
      window.location.replace(target.toString());
      return;
    }

    // Remove Shop from the Chilean customer journey.
    document.querySelectorAll('a[href]').forEach(link => {
      try {
        const url = new URL(link.getAttribute('href'), window.location.origin);
        if (url.origin === window.location.origin && (url.pathname === '/shop' || url.pathname.startsWith('/shop/'))) {
          link.hidden = true;
          link.setAttribute('aria-hidden', 'true');
          link.setAttribute('tabindex', '-1');
        }
      } catch {}
    });

    const shopFeature = document.querySelector('.solution-shop');
    if (shopFeature) shopFeature.hidden = true;

    // Home copy and numbering for Chile: three active verticals.
    document.querySelectorAll('span, p').forEach(node => {
      const text = (node.textContent || '').trim();
      if (text === 'Una marca. Cuatro áreas con un mismo criterio.') node.textContent = 'Una marca. Tres áreas con un mismo criterio.';
      if (text === 'Analítica & Procesos · Equipamiento · Shop · Proyectos Digitales') node.textContent = 'Analítica & Procesos · Equipamiento · Proyectos Digitales';
      if (text === 'Cuatro áreas, una identidad') node.textContent = 'Tres áreas, una identidad';
    });
    document.querySelectorAll('.solution-index').forEach(node => {
      if ((node.textContent || '').includes('Área 1 Proyectos Digitales')) node.textContent = '03 · Área 1 Proyectos Digitales';
    });

    // Contact form: Shop is not offered in Chile.
    document.querySelectorAll('option[value="Shop / Productos recomendados"]').forEach(option => option.remove());

    // Regional SEO copy visible to browsers after region resolution.
    if (document.body && !document.body.classList.contains('shop-page')) {
      if (document.title.includes('Shop')) {
        document.title = document.title
          .replace(', Shop y Proyectos Digitales', ' y Proyectos Digitales')
          .replace('Shop, ', '');
      }
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.content = description.content
          .replace(', Shop o Proyectos Digitales', ' o Proyectos Digitales')
          .replace(', Shop y Proyectos Digitales', ' y Proyectos Digitales')
          .replace(', Shop,', ',');
      }
    }
  }

  function createSwitcher() {
    if (document.querySelector('[data-area1-region-switcher]')) return;
    const host = document.querySelector('.topbar-row') || document.querySelector('.ecosystem-inner');
    if (!host) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'area1-region-switcher';
    wrapper.dataset.area1RegionSwitcher = '';
    wrapper.setAttribute('aria-label', 'Seleccionar región');
    wrapper.innerHTML = `
      <span class="area1-region-label">Región</span>
      <button type="button" data-region="ar" aria-pressed="${region === 'ar'}" aria-label="Ver Área 1 Argentina" title="Argentina"><span class="area1-region-flag" aria-hidden="true">🇦🇷</span><span class="area1-region-country">Argentina</span></button>
      <button type="button" data-region="cl" aria-pressed="${region === 'cl'}" aria-label="Ver Área 1 Chile" title="Chile"><span class="area1-region-flag" aria-hidden="true">🇨🇱</span><span class="area1-region-country">Chile</span></button>`;
    host.appendChild(wrapper);

    wrapper.querySelectorAll('button[data-region]').forEach(button => {
      button.addEventListener('click', () => {
        const nextRegion = button.dataset.region;
        if (nextRegion === region) return;
        localStorage.setItem(MANUAL_REGION_KEY, nextRegion);
        sessionStorage.setItem(SESSION_REGION_KEY, nextRegion);
        const nextUrl = (pageVertical === 'shop' && nextRegion === 'cl')
          ? new URL('/?region=cl', window.location.origin)
          : new URL(window.location.href);
        nextUrl.searchParams.set('region', nextRegion);
        if (typeof window.area1Track === 'function') {
          window.area1Track('region_selected', { region_from: region, region_to: nextRegion });
        }
        window.location.assign(nextUrl.toString());
      });
    });
  }

  function replaceTextNodes(replacements) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => { value = value.split(from).join(to); });
      if (value !== node.nodeValue) node.nodeValue = value;
    });
  }

  function localizeCopy() {
    // Images can be regionalized without duplicating pages when assets are provided later.
    document.querySelectorAll('img[data-src-ar][data-src-cl]').forEach(img => {
      const regionalSrc = region === 'cl' ? img.dataset.srcCl : img.dataset.srcAr;
      if (regionalSrc) img.src = regionalSrc;
    });

    document.querySelectorAll('[data-region-name]').forEach(node => { node.textContent = regionName; });

    if (region === 'cl') {
      // Chile: tuteo, terminología comercial local y términos de procesos habituales.
      const replacements = [
        ['Elegí el área que mejor responde a tu necesidad.', 'Elige el área que mejor responde a tu necesidad.'],
        ['Encontrá lo que necesitás', 'Encuentra lo que necesitas'],
        ['Contanos qué necesitás analizar, ordenar o mejorar', 'Cuéntanos qué necesitas analizar, ordenar o mejorar'],
        ['Tu proyecto puede empezar acá', 'Tu proyecto puede empezar aquí'],
        ['Contanos la idea', 'Cuéntanos la idea'],
        ['Podés iniciar la consulta', 'Puedes iniciar la consulta'],
        ['Contanos qué necesitás.', 'Cuéntanos qué necesitas.'],
        ['Podés enviarnos una consulta desde el formulario o escribirnos directamente por WhatsApp. Para novedades, proyectos y contenidos, también podés encontrarnos en Instagram.', 'Puedes enviarnos una consulta desde el formulario o escribirnos directamente por WhatsApp. Para novedades, proyectos y contenidos, también puedes encontrarnos en Instagram.'],
        ['Escribinos desde acá.', 'Escríbenos desde aquí.'],
        ['Completá tus datos y elegí el motivo de la consulta.', 'Completa tus datos y elige el motivo de la consulta.'],
        ['Seleccioná una opción', 'Selecciona una opción'],
        ['Al enviar, aceptás que usemos los datos ingresados únicamente para responder esta consulta.', 'Al enviar, aceptas que usemos los datos ingresados únicamente para responder esta consulta.'],
        ['¿Preferís conversar?', '¿Prefieres conversar?'],
        ['Volvé al ecosistema Área 1', 'Vuelve al ecosistema Área 1'],
        ['El contenido que buscás', 'El contenido que buscas'],
        ['Casamientos · Ceremonias', 'Matrimonios · Ceremonias'],
        ['relevamiento y mejora de procesos', 'levantamiento y mejora de procesos'],
        ['Relevamiento del flujo real', 'Levantamiento del flujo real'],
        ['Relevar', 'Levantar'],
        ['identificar y presupuestar infraestructura', 'identificar y cotizar infraestructura'],
        ['soluciones presupuestables', 'soluciones cotizables'],
        ['alternativas presupuestables', 'alternativas cotizables'],
        ['Familias y modelos para presupuestar según el proyecto.', 'Familias y modelos para cotizar según el proyecto.'],
        ['Para presupuestar mejor', 'Para cotizar mejor'],
        ['al momento de presupuestar.', 'al momento de cotizar.'],
        ['indicá categoría, cantidad, uso, capacidad requerida, ubicación del proyecto y fecha estimada de necesidad.', 'indica categoría, cantidad, uso, capacidad requerida, ubicación del proyecto y fecha estimada de necesidad.'],
        ['Productos recomendados para vos.', 'Productos recomendados para ti.'],
        ['Aguardá un momento. Estamos buscando productos para vos.', 'Espera un momento. Estamos buscando productos para ti.'],
        ['Probá con otra búsqueda o elegí la categoría “Todos”.', 'Prueba con otra búsqueda o elige la categoría “Todos”.'],
        ['Ingresás a la publicación original y completás pago, envío y condiciones dentro de Mercado Libre.', 'Ingresas a la publicación original y completas pago, envío y condiciones dentro de Mercado Libre.'],
        ['Si realizás una compra desde ellos', 'Si realizas una compra desde ellos'],
        ['sin costo adicional para vos', 'sin costo adicional para ti'],
        ['Explorá una vidriera', 'Explora una vitrina'],
        ['Buscá por producto, marca o categoría.', 'Busca por producto, marca o categoría.']
      ];
      replaceTextNodes(replacements);

      document.querySelectorAll('img[alt*="casamiento" i]').forEach(img => {
        img.alt = img.alt.replace(/casamiento/gi, 'matrimonio');
      });
      document.querySelectorAll('input[placeholder="¿Cómo querés que te llamemos?"]').forEach(input => { input.placeholder = '¿Cómo quieres que te llamemos?'; });
      document.querySelectorAll('input[placeholder="Repetí tu correo"]').forEach(input => { input.placeholder = 'Repite tu correo'; });
      document.querySelectorAll('textarea[placeholder^="Contanos brevemente"]').forEach(input => { input.placeholder = 'Cuéntanos brevemente qué necesitas, cantidades, alcance o cualquier dato que nos ayude a responderte mejor.'; });

      // También regionalizamos metadatos visibles para buscadores/social cuando Chile es la región activa.
      if (document.title) {
        document.title = document.title
          .replace(/presupuestables/gi, 'cotizables')
          .replace(/casamientos/gi, 'matrimonios');
      }
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.content = description.content
          .replace(/presupuestables/gi, 'cotizables')
          .replace(/casamientos/gi, 'matrimonios')
          .replace(/relevamiento/gi, 'levantamiento');
      }
    }

    const marketplaceLabel = region === 'cl' ? 'Mercado Libre Chile' : 'Mercado Libre Argentina';
    document.querySelectorAll('[data-marketplace-label]').forEach(node => { node.textContent = marketplaceLabel; });
  }

  function phoneForCurrentPage(config) {
    const wa = config.whatsapp || {};
    const key = ['equipment', 'analytics', 'shop', 'projects'].includes(pageVertical) ? pageVertical : 'general';
    return {
      number: wa[key] || wa.general || '',
      display: wa[`${key}Display`] || wa.generalDisplay || ''
    };
  }

  function applyContactConfig(config) {
    publicConfig = { ...publicConfig, ...config, whatsapp: { ...publicConfig.whatsapp, ...(config.whatsapp || {}) } };
    const phone = phoneForCurrentPage(publicConfig);
    const message = messages[pageVertical] || messages.general;

    document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
      const isFloating = link.classList.contains('whatsapp-float');
      if (!phone.number) {
        if (isFloating || link.classList.contains('contact-whatsapp')) {
          link.hidden = true;
          return;
        }
        const fallback = `/contacto.html?region=${region}&motivo=${encodeURIComponent(pageVertical === 'equipment' ? 'Equipamiento / Cotización' : 'Consulta general')}#formulario`;
        link.setAttribute('href', fallback);
        link.removeAttribute('target');
        link.removeAttribute('rel');
        if (/whatsapp/i.test(link.textContent || '')) link.textContent = pageVertical === 'equipment' ? 'Solicitar cotización' : 'Enviar consulta';
        return;
      }
      link.hidden = false;
      link.href = `https://wa.me/${phone.number}?text=${encodeURIComponent(message)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.querySelectorAll('strong').forEach(node => { if (/\d/.test(node.textContent || '')) node.textContent = phone.display; });
      if (/WhatsApp\s*\+?\d/i.test(link.textContent || '')) link.textContent = `WhatsApp ${phone.display}`;
    });

    const instagram = publicConfig.instagram || 'areauno.servicios';
    document.querySelectorAll('a[href*="instagram.com/"]').forEach(link => {
      link.href = `https://www.instagram.com/${instagram}/`;
      link.querySelectorAll('strong').forEach(node => { node.textContent = `@${instagram}`; });
      if (/Instagram\s*·/i.test(link.textContent || '')) link.textContent = `Instagram · @${instagram}`;
    });
  }

  async function loadPublicConfig() {
    if (region === 'ar') {
      applyContactConfig(arDefaults);
      return arDefaults;
    }
    try {
      const response = await fetch(`/api/public-config?region=${region}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('config unavailable');
      const config = await response.json();
      applyContactConfig(config);
      return config;
    } catch {
      applyContactConfig(publicConfig);
      return publicConfig;
    }
  }

  window.Area1Region = {
    region,
    regionName,
    locale,
    currency,
    getRegion: () => region,
    getConfig: () => publicConfig,
    ready: null
  };

  function init() {
    applyRegionalAvailability();
    if (region === 'cl' && pageVertical === 'shop') return;
    createSwitcher();
    localizeCopy();
    updateInternalLinks();
    applyContactConfig(publicConfig);
    window.Area1Region.ready = loadPublicConfig().then(config => {
      if (typeof window.gtag === 'function') {
        window.gtag('set', 'user_properties', { site_region: regionName });
      }
      document.dispatchEvent(new CustomEvent('area1:region-ready', { detail: config }));
      return config;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
