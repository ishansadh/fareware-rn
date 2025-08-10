// netlify/functions/photo.js
export async function handler(event) {
  const hdr = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: hdr, body: '' };

  try {
    const { ref, maxwidth = '800' } = event.queryStringParameters || {};
    if (!ref) return { statusCode: 400, headers: hdr, body: 'ref required' };

    const key = process.env.GOOGLE_MAPS_API_KEY;
    const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
    url.searchParams.set('photo_reference', ref);
    url.searchParams.set('maxwidth', String(maxwidth));
    url.searchParams.set('key', key);

    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get('content-type') || 'image/jpeg';

    return {
      statusCode: 200,
      headers: { ...hdr, 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, headers: hdr, body: e.message || String(e) };
  }
}
