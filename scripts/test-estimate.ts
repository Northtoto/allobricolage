/**
 * Verifies the Hugging Face cost-estimator integration end-to-end.
 *
 *   npm run test:estimate
 *
 * Pings HF_COST_MODEL directly (so errors are surfaced, not swallowed by the
 * service fallback), then runs the real aiService.estimateCost to show the
 * integrated result. Exits non-zero only on a hard failure (e.g. bad key).
 */
import "dotenv/config";
import { config } from "../server/config/index.ts";
import { aiService } from "../server/services/ai.service.ts";

const SAMPLE = {
  service: "plomberie",
  urgency: "high",
  complexity: "moderate",
  description: "Grosse fuite sous l'évier de la cuisine du café, il faut remplacer le siphon et 2 robinets. Le sol commence à être inondé.",
};

async function main() {
  console.log("=== AlloBricolage cost-estimator check ===\n");

  if (!config.HUGGINGFACE_API_KEY) {
    console.log("⚠️  HUGGINGFACE_API_KEY is not set.");
    console.log("   The estimator will use the deterministic formula fallback (this is fine for demo/local).");
    console.log("   Set HUGGINGFACE_API_KEY in .env to enable the AI estimator, then re-run.\n");
  } else {
    console.log(`Model: ${config.HF_COST_MODEL}`);
    console.log(`Key:   ${config.HUGGINGFACE_API_KEY.slice(0, 6)}…${config.HUGGINGFACE_API_KEY.slice(-3)}`);
    console.log("\nPinging Hugging Face Inference API…");

    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${config.HF_COST_MODEL}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.HF_COST_MODEL,
            messages: [{ role: "user", content: 'Réponds uniquement avec ce JSON: {"ok": true}' }],
            max_tokens: 20,
            temperature: 0,
          }),
          signal: controller.signal,
        }
      );

      const ms = Date.now() - start;
      if (!res.ok) {
        const body = await res.text();
        console.error(`❌ HF returned HTTP ${res.status} (${ms}ms)`);
        console.error(`   ${body.slice(0, 300)}`);
        if (res.status === 401 || res.status === 403) {
          console.error("\n   → Your token is invalid or lacks Inference API access. Check huggingface.co/settings/tokens.");
        } else if (res.status === 503) {
          console.error("\n   → Model is cold/loading. Wait ~30s and re-run; the live app handles this via fallback.");
        }
        process.exit(1);
      }

      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      console.log(`✅ HF responded in ${ms}ms`);
      console.log(`   Raw: ${data.choices?.[0]?.message?.content?.trim() ?? "(empty)"}\n`);
    } catch (err) {
      console.error(`❌ Request failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    } finally {
      clearTimeout(timer);
    }
  }

  console.log("Running aiService.estimateCost() with a sample job…");
  console.log(`  "${SAMPLE.description}"\n`);
  const estimate = await aiService.estimateCost(SAMPLE);
  console.log(`  min:    ${estimate.minCost} MAD`);
  console.log(`  likely: ${estimate.likelyCost} MAD`);
  console.log(`  max:    ${estimate.maxCost} MAD`);
  console.log(`  confidence: ${estimate.confidence}`);
  console.log(`  explanation: ${estimate.explanation}`);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
