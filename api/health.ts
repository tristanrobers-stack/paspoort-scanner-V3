export default function handler(req: any, res: any) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  res.status(200).json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
}
