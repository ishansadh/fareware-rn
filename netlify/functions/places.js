// netlify/functions/places.js
export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  try {
    // read request body with filters
    const {
      query,
      lat,
      lng,
      radius = 5000,     // meters
      pagetoken,
      openNow = 0,       // 0/1
      maxprice           // 0..4 (0=$, 4=$$$$$)
    } = JSON.parse(event.body || '{}');

    // If not using Google's next_page_token, we need query + coords
    if (!pagetoken && (!query || typeof lat !== 'number' || typeof lng !== 'number')) {
      return json(400, { error: 'query, lat, lng required (unless using pagetoken)' });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');

    if (pagetoken) {
      // fetch the next page
      url.searchParams.set('pagetoken', pagetoken);
    } else {
      // initial page with filters
      url.searchParams.set('query', query);
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', String(radius)); // meters

      // filters
      if (openNow) url.searchParams.set('opennow', 'true');
      if (Number.isInteger(maxprice)) url.searchParams.set('maxprice', String(maxprice)); // 0..4
      // you can add more (e.g., type/keyword) if needed:
      // url.searchParams.set('type', 'restaurant');
    }

    url.searchParams.set('key', key);

    const res = await fetch(url);
    const data = await res.json();

    // surface Google status for easy debugging
    const status = data.status || 'UNKNOWN';
    if (!['OK', 'ZERO_RESULTS'].includes(status)) {
      return json(200, { places: [], error: status, error_message: data.error_message || null });
    }

    // normalize results
    const places = (data.results || []).map(p => ({
      place_id: p.place_id,
      name: p.name,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      price_level: p.price_level,
      address: p.formatted_address,
      location: p.geometry?.location || null,
      types: p.types || [],
      photo_ref: p.photos?.[0]?.photo_reference || null
    }));

    return json(200, {
      places,
      next_page_token: data.next_page_token || null
    });
  } catch (err) {
    return json(500, { error: err.message || String(err) });
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
