import { GoogleGenerativeAI } from '@google/generative-ai';

export type PlantWateringInfo = {
  wateringFrequencyDays: number | null;
  wateringNotes: string | null;
};

const EMPTY_WATERING_INFO: PlantWateringInfo = {
  wateringFrequencyDays: null,
  wateringNotes: null,
};

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-1.5-flash';

const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function normalizeFrequencyDays(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeNotes(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const notes = value.trim();
  return notes.length > 0 ? notes : null;
}

export async function getPlantWateringInfo(scientificName: string): Promise<PlantWateringInfo> {
  const speciesName = scientificName.trim();

  if (!speciesName || !geminiClient) {
    console.warn('[Gemini] skipped call because speciesName or client is missing', {
      speciesName,
      hasClient: Boolean(geminiClient),
      hasApiKey: Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL,
    });
    return EMPTY_WATERING_INFO;
  }

  try {
    console.log('[Gemini] getPlantWateringInfo start:', speciesName);
    const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are a plant expert. Return ONLY a JSON object, no markdown, no extra text. Given this plant scientific name, provide: wateringFrequencyDays (integer: how many days between waterings) and wateringNotes (string: one short sentence about watering this plant, for example 'Needs very little water' or 'Water abundantly' or 'Mist regularly to simulate humidity'). Scientific name: ${speciesName}`;

    const response = await model.generateContent(prompt);
    const rawText = response.response.text();
    console.log('[Gemini] raw response:', rawText);
    const parsed = JSON.parse(rawText) as Record<string, unknown>;

    console.log('[Gemini] parsed response:', parsed);

    if (!parsed || typeof parsed !== 'object') {
      console.warn('[Gemini] parsed response was not an object');
      return EMPTY_WATERING_INFO;
    }

    const wateringInfo = {
      wateringFrequencyDays: normalizeFrequencyDays(parsed.wateringFrequencyDays),
      wateringNotes: normalizeNotes(parsed.wateringNotes),
    };

    console.log('[Gemini] normalized watering info:', wateringInfo);
    return wateringInfo;
  } catch (error) {
    console.warn('[Gemini] getPlantWateringInfo failed, returning empty watering info', error);
    return EMPTY_WATERING_INFO;
  }
}