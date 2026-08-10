(() => {
  const send = (eventName, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      ...params,
      page_path: window.location.pathname,
      page_title: document.title
    });
  };

  window.area1Track = send;

  const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 120);

  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const label = cleanText(link.textContent || link.getAttribute('aria-label') || '');

    if (/wa\.me\//i.test(href)) {
      const isQuote = /cotiza|presupuest|equipamiento/i.test(`${href} ${label}`);
      send(isQuote ? 'quote_request' : 'whatsapp_click', {
        link_text: label || (isQuote ? 'Pedir cotización' : 'WhatsApp'),
        contact_channel: 'whatsapp'
      });
      return;
    }

    if (/instagram\.com\/areauno\.servicios/i.test(href)) {
      send('instagram_click', {
        link_text: label || 'Instagram',
        contact_channel: 'instagram'
      });
      return;
    }

    if (/catalogo-area1\.pdf/i.test(href)) {
      send('catalog_download', {
        file_name: 'catalogo-area1.pdf',
        link_text: label || 'Descargar catálogo'
      });
      return;
    }

    if (link.matches('.product-action, .featured-card a')) {
      const card = link.closest('.product-card, .featured-card');
      const title = cleanText(card?.querySelector('h3')?.textContent || 'Producto Mercado Libre');
      const category = cleanText(card?.querySelector('.product-category, .featured-meta > span')?.textContent || '');
      send('mercadolibre_click', {
        product_name: title,
        product_category: category,
        outbound: true
      });
    }
  });

  // Shop category filters are generated dynamically, so delegation is used.
  document.addEventListener('click', event => {
    const button = event.target.closest('.filter-button[data-category]');
    if (!button) return;
    send('category_selected', { category_name: cleanText(button.dataset.category) });
  });

  // Track Shop searches after a short pause, not on every keystroke.
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let timer = null;
    let lastValue = '';
    searchInput.addEventListener('input', () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const value = cleanText(searchInput.value);
        if (value.length < 2 || value === lastValue) return;
        lastValue = value;
        send('shop_search', {
          search_term: value,
          search_length: value.length
        });
      }, 900);
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      send('shop_sort', { sort_option: cleanText(sortSelect.value) });
    });
  }

  const loadMore = document.getElementById('loadMoreButton');
  if (loadMore) {
    loadMore.addEventListener('click', () => send('shop_load_more'));
  }
})();
