export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    const { query, lat, lng, radius = 5000 } = JSON.parse(event.body || '{}');

    if (!query || !lat || !lng) {
      return json(400, { error: 'query, lat, lng required' });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', radius);
    url.searchParams.set('key', key);

    const res = await fetch(url);
    const data = await res.json();

    const places = (data.results || []).map(p => ({
      place_id: p.place_id,
      name: p.name,
      rating: p.rating,
      address: p.formatted_address,
      location: p.geometry?.location,
      types: p.types,
    }));

    return json(200, { places });
  } catch (err) {
    return json(500, { error: err.message });
  }
}

function json(code, obj) {
  return { statusCode: code, headers: corsHeaders(), body: JSON.stringify(obj) };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
