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
    return EMPTY_WATERING_INFO;
  }

  try {
    const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are a botanist expert. Given the scientific name of a plant, return ONLY a JSON object with no additional text, no markdown, no backticks. The JSON must have exactly these two fields: wateringFrequencyDays (integer: the recommended number of days between waterings for this species under normal indoor conditions) and wateringNotes (string: brief practical watering observations for this species, such as seasonal variations or special considerations). If you cannot determine the information with confidence, return null for that field. Scientific name: ${speciesName}`;

    const response = await model.generateContent(prompt);
    const rawText = response.response.text();
    const parsed = JSON.parse(rawText) as Record<string, unknown>;

    if (!parsed || typeof parsed !== 'object') {
      return EMPTY_WATERING_INFO;
    }

    return {
      wateringFrequencyDays: normalizeFrequencyDays(parsed.wateringFrequencyDays),
      wateringNotes: normalizeNotes(parsed.wateringNotes),
    };
  } catch {
    return EMPTY_WATERING_INFO;
  }
}