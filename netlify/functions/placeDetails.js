// netlify/functions/placeDetails.js
export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return ok('');
  try {
    const { place_id } = JSON.parse(event.body || '{}');
    if (!place_id) return bad('place_id required');

    const key = process.env.GOOGLE_MAPS_API_KEY;

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', place_id);
    url.searchParams.set('fields', [
      'place_id','name','formatted_address','formatted_phone_number','website',
      'opening_hours','rating','user_ratings_total','price_level','geometry/location','photos'
    ].join(','));
    url.searchParams.set('key', key);

    const res = await fetch(url);
    const data = await res.json();
    if (data.status && !['OK','ZERO_RESULTS'].includes(data.status)) {
      return ok({ error: data.status, error_message: data.error_message || null });
    }

    const r = data.result || {};
    const photo_ref = r?.photos?.[0]?.photo_reference || null;

    return ok({
      place_id: r.place_id,
      name: r.name,
      address: r.formatted_address,
      phone: r.formatted_phone_number || null,
      website: r.website || null,
      opening_hours: r.opening_hours || null,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      price_level: r.price_level,
      location: r.geometry?.location || null,
      photo_ref
    });
  } catch (e) {
    return err(e);
  }
}

function headers() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };
}
function ok(body){ return { statusCode: 200, headers: headers(), body: JSON.stringify(body) }; }
function bad(msg){ return { statusCode: 400, headers: headers(), body: JSON.stringify({ error: msg }) }; }
function err(e){ return { statusCode: 500, headers: headers(), body: JSON.stringify({ error: e.message || String(e) }) }; }
