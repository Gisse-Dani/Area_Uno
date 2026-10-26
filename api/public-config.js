function digits(value = '') {
  return String(value || '').replace(/\D/g, '');
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  const region = String(req.query.region || 'ar').toLowerCase() === 'cl' ? 'cl' : 'ar';

  const defaults = region === 'ar'
    ? {
        general: '5492984713844',
        generalDisplay: '+54 9 2984 713844',
        equipment: '5492984283869',
        equipmentDisplay: '+54 9 2984 28-3869',
        analytics: '5492984713844',
        analyticsDisplay: '+54 9 2984 713844',
        shop: '5492984713844',
        shopDisplay: '+54 9 2984 713844',
        projects: '5492984713844',
        projectsDisplay: '+54 9 2984 713844',
        instagram: 'areauno.servicios'
      }
    : {
        general: '56922184205',
        generalDisplay: '+56 9 2218 4205',
        equipment: '56922184205',
        equipmentDisplay: '+56 9 2218 4205',
        analytics: '56922184205',
        analyticsDisplay: '+56 9 2218 4205',
        shop: '',
        shopDisplay: '',
        projects: '56922184205',
        projectsDisplay: '+56 9 2218 4205',
        instagram: 'areauno.servicios'
      };

  const suffix = region.toUpperCase();
  const generalRaw = process.env[`WHATSAPP_GENERAL_${suffix}`] || defaults.general;
  const equipmentRaw = process.env[`WHATSAPP_EQUIPMENT_${suffix}`] || defaults.equipment;
  const analyticsRaw = process.env[`WHATSAPP_ANALYTICS_${suffix}`] || defaults.analytics || generalRaw;
  const shopRaw = region === 'cl' ? '' : (process.env[`WHATSAPP_SHOP_${suffix}`] || defaults.shop || generalRaw);
  const projectsRaw = process.env[`WHATSAPP_PROJECTS_${suffix}`] || defaults.projects || generalRaw;
  const instagram = process.env[`INSTAGRAM_${suffix}`] || defaults.instagram;

  return res.status(200).json({
    region,
    regionName: region === 'cl' ? 'Chile' : 'Argentina',
    locale: region === 'cl' ? 'es-CL' : 'es-AR',
    currency: region === 'cl' ? 'CLP' : 'ARS',
    whatsapp: {
      general: digits(generalRaw),
      generalDisplay: process.env[`WHATSAPP_GENERAL_DISPLAY_${suffix}`] || defaults.generalDisplay || generalRaw,
      equipment: digits(equipmentRaw),
      equipmentDisplay: process.env[`WHATSAPP_EQUIPMENT_DISPLAY_${suffix}`] || defaults.equipmentDisplay || equipmentRaw,
      analytics: digits(analyticsRaw),
      analyticsDisplay: process.env[`WHATSAPP_ANALYTICS_DISPLAY_${suffix}`] || defaults.analyticsDisplay || analyticsRaw,
      shop: digits(shopRaw),
      shopDisplay: process.env[`WHATSAPP_SHOP_DISPLAY_${suffix}`] || defaults.shopDisplay || shopRaw,
      projects: digits(projectsRaw),
      projectsDisplay: process.env[`WHATSAPP_PROJECTS_DISPLAY_${suffix}`] || defaults.projectsDisplay || projectsRaw
    },
    instagram: String(instagram || '').replace(/^@/, '')
  });
};
