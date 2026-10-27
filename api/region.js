module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  const rawCountry = req.headers['x-vercel-ip-country'];
  const country = Array.isArray(rawCountry) ? rawCountry[0] : String(rawCountry || '');
  const countryCode = country.trim().toUpperCase();

  let region = '';
  if (countryCode === 'AR') region = 'ar';
  if (countryCode === 'CL') region = 'cl';

  return res.status(200).json({
    country: countryCode || null,
    region: region || null,
    supported: Boolean(region)
  });
};
