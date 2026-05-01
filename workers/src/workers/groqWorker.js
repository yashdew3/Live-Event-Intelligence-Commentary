const { Worker } = require('bullmq');
const axios = require('axios');
const { Event, Commentary, GroqPrediction } = require('../models');
const { updateStage } = require('../stageHelper');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEBOUNCE_SECONDS = 60;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGroqWithRetry = async (messages, maxTokens = 80, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: 'llama-3.1-8b-instant',
                    messages,
                    max_tokens: maxTokens,
                    temperature: 0.8,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                }
            );
            return response.data.choices[0].message.content.trim();
        } catch (error) {
            const status = error.response?.status;
            if (status === 429) {
                const waitMs = attempt * 5000;
                console.log(`[Groq] Rate limited (attempt ${attempt}/${retries}), waiting ${waitMs}ms...`);
                await sleep(waitMs);
                if (attempt === retries) throw error;
            } else {
                throw error;
            }
        }
    }
};

const createGroqWorker = (redisConnection) => {
    const worker = new Worker('groq-commentary-queue', async (job) => {
        const eventData = job.data;
        const event_id = eventData.event_id;

        await sleep(Math.random() * 2000);

        console.log(`[Groq] Processing commentary for event: ${event_id}`);
        await updateStage(event_id, 3, 'active');

        try {
            const event = await Event.findOne({ event_id });
            if (!event) {
                await updateStage(event_id, 3, 'failed', 'Event not found');
                return;
            }

            if (event.last_commentary_at) {
                const secondsSinceLast = (Date.now() - new Date(event.last_commentary_at).getTime()) / 1000;
                if (secondsSinceLast < DEBOUNCE_SECONDS) {
                    console.log(`[Groq] Debounced for ${event_id} — ${Math.round(secondsSinceLast)}s ago`);
                    await updateStage(event_id, 3, 'done');
                    return;
                }
            }

            const startTime = Date.now();

            const commentaryText = await callGroqWithRetry([
                {
                    role: 'user',
                    content: `You are a live sports commentator. Generate ONE exciting commentary sentence (max 20 words).
Sport: ${eventData.sport}
Match: ${eventData.home_team} vs ${eventData.away_team}
Score: ${eventData.home_score} - ${eventData.away_score}
Update: ${eventData.latest_update || 'Game in progress'}
Respond with ONLY the commentary sentence.`,
                },
            ], 60);

            const elapsed = Date.now() - startTime;
            console.log(`[Groq] Commentary generated in ${elapsed}ms for ${event_id}`);

            await Commentary.create({
                event_id,
                commentary_text: commentaryText,
                model: 'llama-3.1-8b-instant',
                created_at: new Date(),
            });

            await sleep(500);

            let predictionData = { prediction: `${eventData.home_team} in a close contest.`, confidence: 0.5 };
            try {
                const predictionText = await callGroqWithRetry([
                    {
                        role: 'user',
                        content: `Sports analyst: predict the winner in 1-2 sentences.
Sport: ${eventData.sport}
Match: ${eventData.home_team} vs ${eventData.away_team}
Score: ${eventData.home_score} - ${eventData.away_score}
Return ONLY valid JSON: {"prediction": "text", "confidence": 0.75}`,
                    },
                ], 100);

                let cleaned = predictionText.replace(/```json|```/g, '').trim();
                predictionData = JSON.parse(cleaned);
            } catch {
                console.log(`[Groq] Prediction skipped for ${event_id} — using default`);
            }

            await GroqPrediction.create({
                event_id,
                prediction: predictionData.prediction,
                confidence: Math.max(0, Math.min(1, predictionData.confidence || 0.5)),
                model: 'llama-3.1-8b-instant',
                created_at: new Date(),
            });

            await Event.updateOne({ event_id }, { $set: { last_commentary_at: new Date() } });
            await updateStage(event_id, 3, 'done');

            try {
                await axios.post(`${process.env.FASTAPI_INTERNAL_URL}/internal/ws-broadcast`, {
                    event_id,
                    message: {
                        type: 'commentary',
                        event_id,
                        commentary: commentaryText,
                        home_score: eventData.home_score,
                        away_score: eventData.away_score,
                        timestamp: new Date().toISOString(),
                    },
                }, { timeout: 5000 });
            } catch {
                console.log(`[Groq] WS broadcast skipped`);
            }

            console.log(`[Groq] Stage 3 complete for ${event_id}`);

        } catch (error) {
            await updateStage(event_id, 3, 'failed', error.message);
            console.error(`[Groq] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 1,
        limiter: {
            max: 8,
            duration: 60000,
        },
    });

    worker.on('failed', (job, err) => {
        console.error(`[Groq] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createGroqWorker };