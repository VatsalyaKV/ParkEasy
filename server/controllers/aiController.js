const ParkingLocation = require('../models/ParkingLocation');
const ParkingSlot = require('../models/ParkingSlot');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

exports.parkingAssistant = async (req, res, next) => {
  try {
    const { question, userLocation, parkingOptions = [] } = req.body;
    if (!String(question || '').trim()) {
      return res.status(400).json({ success: false, message: 'Please ask a parking question.' });
    }

    const options = Array.isArray(parkingOptions) && parkingOptions.length
      ? parkingOptions.slice(0, 10)
      : await buildLiveOptions(userLocation);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Gemini is not configured. Add GEMINI_API_KEY to server/.env to enable ParkEasy AI.',
      });
    }

    const system = `You are ParkEasy AI, a concise parking assistant inside a smart parking reservation app.
Use ONLY the supplied parking options for factual availability, price and distance claims.
Never invent a parking facility, slot count, price, ETA, booking or live sensor state.
If distance is missing, say it is unavailable.
Recommend the best option based on the user's question and explain the trade-off in 2-5 short sentences.
You may suggest the user open the parking card to reserve a slot.`;

    const prompt = `${system}

User location: ${JSON.stringify(userLocation || null)}
Current ParkEasy parking options:
${JSON.stringify(options, null, 2)}

User question: ${String(question).trim()}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'Gemini request failed.';
      return res.status(502).json({ success: false, message });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!answer) return res.status(502).json({ success: false, message: 'Gemini returned an empty response.' });

    res.json({ success: true, answer, model: MODEL });
  } catch (error) {
    next(error);
  }
};

async function buildLiveOptions(userLocation) {
  const locations = await ParkingLocation.find({ isApproved: true }).limit(10).lean();
  const withSlots = await Promise.all(locations.map(async (loc) => {
    const slots = await ParkingSlot.find({ location: loc._id }).select('status type').lean();
    return {
      name: loc.name,
      address: loc.address,
      distanceKm: distance(userLocation, loc),
      availableSlots: slots.filter((s) => s.status === 'Available').length,
      evSlotsAvailable: slots.filter((s) => s.type === 'EV' && s.status === 'Available').length,
      hourlyRate: loc.hourlyRate,
      rating: loc.rating,
    };
  }));
  return withSlots.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

function distance(point, loc) {
  if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) return null;
  if (!Number.isFinite(Number(loc.latitude)) || !Number.isFinite(Number(loc.longitude))) return null;
  const toRad = (n) => n * Math.PI / 180;
  const dLat = toRad(Number(loc.latitude) - Number(point.lat));
  const dLng = toRad(Number(loc.longitude) - Number(point.lng));
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(Number(point.lat))) * Math.cos(toRad(Number(loc.latitude))) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
