const { Worker } = require('bullmq');
const axios = require('axios');
const { Event, EventStream, GeminiAnalysis } = require('../models');
const { updateStage } = require('../stageHelper');
const { alertEvaluationQueue } = require('../queues');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (prompt, retries = 2) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(
                `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.4,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json',
                    },
                },
                { timeout: 30000 }
            );
            return response.data.candidates[0].content.parts[0].text.trim();
        } catch (error) {
            const status = error.response?.status;
            if (status === 429) {
                const waitMs = attempt * 10000;
                console.log(`[Gemini] Rate limited, waiting ${waitMs}ms...`);
                await sleep(waitMs);
                if (attempt === retries) throw error;
            } else if (status === 404) {
                throw new Error(`Gemini API 404 — check API key and model name. URL: ${GEMINI_API_URL}`);
            } else {
                throw error;
            }
        }
    }
};

const parseGeminiJSON = (text) => {
    let cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
};

const createGeminiWorker = (redisConnection) => {
    const worker = new Worker('gemini-analysis-queue', async (job) => {
        const { event_id } = job.data;

        await sleep(Math.random() * 3000);
        console.log(`[Gemini] Processing analysis for event: ${event_id}`);
        await updateStage(event_id, 4, 'active');

        try {
            const event = await Event.findOne({ event_id });
            if (!event) {
                await updateStage(event_id, 4, 'failed', 'Event not found');
                return;
            }

            const streamDocs = await EventStream.find({ event_id })
                .sort({ timestamp: -1 })
                .limit(50);

            const streamData = streamDocs.reverse().map(doc => ({
                update: doc.update_text,
                score: `${doc.home_score}-${doc.away_score}`,
                time: doc.timestamp,
            }));

            const prompt = `You are a professional sports analyst. Analyze this live sports event and return a JSON object.

EVENT:
Sport: ${event.sport}
Match: ${event.home_team} vs ${event.away_team}
Score: ${event.home_score} - ${event.away_score}
Status: ${event.status}
Venue: ${event.venue}

RECENT UPDATES (${streamData.length} entries):
${JSON.stringify(streamData.slice(-20), null, 2)}

Return this exact JSON structure:
{
  "updated_summary": "2-3 sentence summary of current match situation",
  "key_moments": ["moment 1", "moment 2", "moment 3", "moment 4", "moment 5"],
  "trend": "momentum",
  "prediction": "1-2 sentence prediction of who will win and why",
  "confidence": 0.7
}

Rules: trend must be exactly one of: momentum, stable, reversal. confidence must be a number between 0 and 1.`;

            let analysisData;
            try {
                const rawResponse = await callGemini(prompt);
                analysisData = parseGeminiJSON(rawResponse);
                console.log(`[Gemini] First parse succeeded for ${event_id}`);
            } catch (parseError) {
                console.log(`[Gemini] First parse failed for ${event_id}, retrying with simpler prompt...`);
                await sleep(2000);
                const simplePrompt = `Analyze this sports match and return ONLY a JSON object with no extra text.

Match: ${event.home_team} vs ${event.away_team} (${event.sport})
Score: ${event.home_score} - ${event.away_score}
Status: ${event.status}

Return exactly:
{"updated_summary":"brief summary","key_moments":["moment1","moment2","moment3"],"trend":"stable","prediction":"brief prediction","confidence":0.6}`;

                try {
                    const retryResponse = await callGemini(simplePrompt);
                    analysisData = parseGeminiJSON(retryResponse);
                } catch {
                    analysisData = {
                        updated_summary: `${event.home_team} leads ${event.away_team} ${event.home_score}-${event.away_score} in this ${event.sport} match at ${event.venue}.`,
                        key_moments: ['Match underway', 'Teams competing hard', 'Score developing'],
                        trend: 'stable',
                        prediction: `${event.home_score > event.away_score ? event.home_team : event.away_team} currently has the advantage.`,
                        confidence: 0.5,
                    };
                    console.log(`[Gemini] Using fallback analysis for ${event_id}`);
                }
            }

            if (!['momentum', 'stable', 'reversal'].includes(analysisData.trend)) {
                analysisData.trend = 'stable';
            }
            analysisData.confidence = Math.max(0, Math.min(1, parseFloat(analysisData.confidence) || 0.5));

            await GeminiAnalysis.create({
                event_id,
                updated_summary: analysisData.updated_summary,
                key_moments: analysisData.key_moments,
                trend: analysisData.trend,
                prediction: analysisData.prediction,
                confidence: analysisData.confidence,
                model: 'gemini-2.5-flash',
                created_at: new Date(),
            });

            await Event.updateOne({ event_id }, { $set: { last_analysis_at: new Date() } });
            await updateStage(event_id, 4, 'done');
            console.log(`[Gemini] Analysis complete for ${event_id} — trend: ${analysisData.trend}, confidence: ${analysisData.confidence}`);

            await updateStage(event_id, 5, 'active');
            await updateStage(event_id, 5, 'done');

            try {
                await axios.post(`${process.env.FASTAPI_INTERNAL_URL}/internal/ws-broadcast`, {
                    event_id,
                    message: {
                        type: 'analysis',
                        event_id,
                        updated_summary: analysisData.updated_summary,
                        key_moments: analysisData.key_moments,
                        trend: analysisData.trend,
                        prediction: analysisData.prediction,
                        confidence: analysisData.confidence,
                        timestamp: new Date().toISOString(),
                    },
                }, { timeout: 5000 });
                await updateStage(event_id, 6, 'active');
                await updateStage(event_id, 6, 'done');
            } catch {
                console.log(`[Gemini] WS broadcast skipped for ${event_id}`);
            }

            await alertEvaluationQueue.add(
                `alert-${event_id}-${Date.now()}`,
                { event_id, analysis: analysisData },
                { attempts: 2 }
            );

        } catch (error) {
            await updateStage(event_id, 4, 'failed', error.message);
            console.error(`[Gemini] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 2,
        limiter: {
            max: 12,
            duration: 60000,
        },
    });

    worker.on('failed', (job, err) => {
        console.error(`[Gemini] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createGeminiWorker };