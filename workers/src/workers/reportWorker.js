const { Worker } = require('bullmq');
const axios = require('axios');
const { Event, EventStream, GeminiAnalysis, GroqPrediction, Commentary, EventReport } = require('../models');
const { updateStage } = require('../stageHelper');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const callGemini = async (prompt) => {
    const response = await axios.post(
        `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        },
        { timeout: 60000 }
    );
    return response.data.candidates[0].content.parts[0].text.trim();
};

const createReportWorker = (redisConnection) => {
    const worker = new Worker('report-generation-queue', async (job) => {
        const { event_id } = job.data;

        console.log(`[Report] Generating full report for event: ${event_id}`);
        await updateStage(event_id, 8, 'active');

        try {
            const existing = await EventReport.findOne({ event_id });
            if (existing) {
                console.log(`[Report] Report already exists for ${event_id}, skipping`);
                await updateStage(event_id, 8, 'done');
                return;
            }

            const event = await Event.findOne({ event_id });
            if (!event) {
                await updateStage(event_id, 8, 'failed', 'Event not found');
                return;
            }

            const streamDocs = await EventStream.find({ event_id }).sort({ timestamp: 1 }).limit(100);
            const commentaryDocs = await Commentary.find({ event_id }).sort({ created_at: 1 });
            const analysisDocs = await GeminiAnalysis.find({ event_id }).sort({ created_at: 1 });
            const predictionDocs = await GroqPrediction.find({ event_id }).sort({ created_at: 1 });

            const streamSummary = streamDocs.map(d => d.update_text).join(' | ');
            const commentarySummary = commentaryDocs.slice(-10).map(d => d.commentary_text).join('\n');
            const lastAnalysis = analysisDocs[analysisDocs.length - 1];
            const lastPrediction = predictionDocs[predictionDocs.length - 1];

            const prompt = `You are a sports journalist writing a post-match report.

MATCH: ${event.home_team} vs ${event.away_team}
SPORT: ${event.sport}
FINAL SCORE: ${event.home_score} - ${event.away_score}
VENUE: ${event.venue}
LEAGUE: ${event.league}

MATCH UPDATES SUMMARY:
${streamSummary.substring(0, 2000)}

COMMENTARY HIGHLIGHTS:
${commentarySummary.substring(0, 1000)}

FINAL AI ANALYSIS:
${lastAnalysis ? `Summary: ${lastAnalysis.updated_summary}\nTrend: ${lastAnalysis.trend}\nPrediction: ${lastAnalysis.prediction}` : 'No analysis available'}

GROQ PREDICTION:
${lastPrediction ? lastPrediction.prediction : 'No prediction available'}

Return ONLY valid JSON:
{
  "narrative_summary": "3-4 paragraph narrative of the match",
  "top_5_key_moments": ["moment 1", "moment 2", "moment 3", "moment 4", "moment 5"],
  "prediction_accuracy_score": 0.0 to 1.0,
  "winning_team": "${event.home_score > event.away_score ? event.home_team : event.home_score < event.away_score ? event.away_team : 'Draw'}",
  "match_rating": "1-10",
  "model_performance": {
    "groq_accuracy": 0.0 to 1.0,
    "gemini_accuracy": 0.0 to 1.0,
    "better_model": "groq or gemini"
  }
}`;

            let reportData;
            try {
                const rawResponse = await callGemini(prompt);
                let cleaned = rawResponse.replace(/```json|```/g, '').trim();
                reportData = JSON.parse(cleaned);
            } catch {
                reportData = {
                    narrative_summary: `${event.home_team} faced ${event.away_team} in a ${event.sport} match at ${event.venue}. The final score was ${event.home_score}-${event.away_score}.`,
                    top_5_key_moments: ['Match started', 'Teams competed', 'Final whistle blown'],
                    prediction_accuracy_score: 0.5,
                    winning_team: event.home_score > event.away_score ? event.home_team : event.home_score < event.away_score ? event.away_team : 'Draw',
                    match_rating: '7',
                    model_performance: { groq_accuracy: 0.5, gemini_accuracy: 0.5, better_model: 'gemini' },
                };
            }

            await EventReport.create({
                event_id,
                narrative_summary: reportData.narrative_summary,
                top_5_key_moments: reportData.top_5_key_moments,
                prediction_accuracy_score: reportData.prediction_accuracy_score,
                winning_team: reportData.winning_team,
                match_rating: reportData.match_rating,
                model_performance: reportData.model_performance,
                created_at: new Date(),
            });

            await updateStage(event_id, 8, 'done');
            console.log(`[Report] Full report generated for ${event_id}`);

            try {
                await axios.post(`${process.env.FASTAPI_INTERNAL_URL}/internal/ws-broadcast`, {
                    event_id,
                    message: {
                        type: 'report_ready',
                        event_id,
                        winning_team: reportData.winning_team,
                        match_rating: reportData.match_rating,
                        timestamp: new Date().toISOString(),
                    },
                }, { timeout: 5000 });
            } catch {
                console.log(`[Report] WS broadcast skipped`);
            }

        } catch (error) {
            await updateStage(event_id, 8, 'failed', error.message);
            console.error(`[Report] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 1,
    });

    worker.on('failed', (job, err) => {
        console.error(`[Report] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createReportWorker };