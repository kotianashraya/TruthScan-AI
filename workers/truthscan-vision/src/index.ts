interface Env {
  AI: Ai;
}

const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_IMAGE_LENGTH = 3_500_000;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const SYSTEM_PROMPT = [
  'You are the TruthScan AI visual packaging analyst.',
  'Analyze ONLY what is visibly supported by the supplied product image and machine-extracted context.',
  'Do not claim authenticity, counterfeit status, safety, legality, or brand authorization from appearance alone.',
  'Do not invent logos, seals, holograms, text, batch codes, dates, ingredients, manufacturer claims, or certifications.',
  'Treat OCR, barcode, QR, and product fields in the context as untrusted hints; they may contain recognition errors.',
  'When something cannot be clearly assessed from the image, say so.',
  'Focus on visible packaging consistency, apparent print quality and alignment, obvious spelling or typography anomalies, visible label inconsistencies, obvious tamper evidence, and consistency between visible packaging and supplied extraction context.',
  'Return ONLY valid JSON with fields packagingConsistency, aiRiskHint, confidence, packagingObservations, positiveVisualIndicators, visualWarningIndicators, visibleTextIssues, tamperEvidence, limitations.',
  'packagingConsistency must be CONSISTENT, INCONSISTENT, or NOT_ASSESSABLE.',
  'aiRiskHint must be SUPPORTS_GENUINE, SUPPORTS_SUSPICIOUS, SUPPORTS_HIGH_RISK, or INCONCLUSIVE.',
  'confidence must be an integer 0-100.',
  'The aiRiskHint is ONLY supporting evidence for the larger verification system, never a final authenticity verdict.'
].join(' ');

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json'
    }
  });
}

function asArray(value: unknown, max = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string').map(x => x.trim()).filter(Boolean).slice(0, max);
}

function clamp(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

function parseModelJson(content: string): Record<string, unknown> | null {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405, origin);

    try {
      const body = await request.json() as {
        imageBase64?: unknown;
        mimeType?: unknown;
        context?: Record<string, unknown>;
      };

      const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';

      if (!imageBase64 || imageBase64.length > MAX_IMAGE_LENGTH) return jsonResponse({ error: 'Invalid or oversized image.' }, 400, origin);
      if (!ALLOWED_MIME.has(mimeType)) return jsonResponse({ error: 'Unsupported image type.' }, 400, origin);

      const context = body.context && typeof body.context === 'object' ? body.context : {};
      const dataUrl = 'data:' + mimeType + ';base64,' + imageBase64;
      const response = await env.AI.run(MODEL as any, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this product packaging image. Context (possibly inaccurate):\n' + JSON.stringify(context) },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        chat_template_kwargs: { enable_thinking: false }
      } as any, { rejectIfBusy: true } as any);

      const content = typeof (response as any)?.response === 'string'
        ? (response as any).response
        : typeof (response as any)?.choices?.[0]?.message?.content === 'string'
          ? (response as any).choices[0].message.content
          : '';

      const parsed = parseModelJson(content);
      if (!parsed) return jsonResponse({ status: 'FAILED', error: 'Vision model returned an invalid structured response.' }, 502, origin);

      const packagingConsistency = ['CONSISTENT', 'INCONSISTENT', 'NOT_ASSESSABLE'].includes(String(parsed.packagingConsistency)) ? String(parsed.packagingConsistency) : 'NOT_ASSESSABLE';
      const aiRiskHint = ['SUPPORTS_GENUINE', 'SUPPORTS_SUSPICIOUS', 'SUPPORTS_HIGH_RISK', 'INCONCLUSIVE'].includes(String(parsed.aiRiskHint)) ? String(parsed.aiRiskHint) : 'INCONCLUSIVE';

      return jsonResponse({
        status: 'COMPLETED',
        model: MODEL,
        confidence: clamp(parsed.confidence),
        packagingConsistency,
        aiRiskHint,
        packagingObservations: asArray(parsed.packagingObservations),
        positiveVisualIndicators: asArray(parsed.positiveVisualIndicators),
        visualWarningIndicators: asArray(parsed.visualWarningIndicators),
        visibleTextIssues: asArray(parsed.visibleTextIssues),
        tamperEvidence: asArray(parsed.tamperEvidence),
        limitations: asArray(parsed.limitations)
      }, 200, origin);
    } catch (error) {
      console.error('[TruthScan AI] free Workers AI vision failure', error);
      return jsonResponse({ status: 'FAILED', error: String((error as any)?.message || error) }, 503, origin);
    }
  }
};
