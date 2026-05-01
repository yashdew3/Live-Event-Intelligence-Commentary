const { Worker } = require('bullmq');
const axios = require('axios');
const { AlertRule, Alert, Commentary } = require('../models');
const { updateStage } = require('../stageHelper');

const evaluateKeywordRule = async (rule, event_id) => {
    const keyword = rule.keyword?.toLowerCase();
    if (!keyword) return null;

    const recentCommentary = await Commentary.find({ event_id })
        .sort({ created_at: -1 })
        .limit(5);

    for (const c of recentCommentary) {
        if (c.commentary_text?.toLowerCase().includes(keyword)) {
            return {
                matched: true,
                matched_value: `Keyword "${keyword}" found in: "${c.commentary_text.substring(0, 100)}"`,
            };
        }
    }
    return null;
};

const evaluateScoreRule = async (rule, eventData) => {
    const threshold = rule.threshold;
    if (threshold === null || threshold === undefined) return null;

    const homeScore = eventData?.home_score ?? 0;
    const awayScore = eventData?.away_score ?? 0;
    const gap = Math.abs(homeScore - awayScore);

    if (gap >= threshold) {
        return {
            matched: true,
            matched_value: `Score gap is ${gap} (${homeScore}-${awayScore}), threshold: ${threshold}`,
        };
    }
    return null;
};

const evaluateTrendRule = async (rule, analysis, event_id) => {
    const { GeminiAnalysis } = require('../models');
    const previousAnalyses = await GeminiAnalysis.find({ event_id })
        .sort({ created_at: -1 })
        .limit(2);

    if (previousAnalyses.length < 2) return null;

    const currentTrend = previousAnalyses[0].trend;
    const previousTrend = previousAnalyses[1].trend;

    if (currentTrend !== previousTrend) {
        return {
            matched: true,
            matched_value: `Trend changed from "${previousTrend}" to "${currentTrend}"`,
        };
    }
    return null;
};

const createAlertWorker = (redisConnection) => {
    const worker = new Worker('alert-evaluation-queue', async (job) => {
        const { event_id, analysis } = job.data;

        console.log(`[Alert] Evaluating rules for event: ${event_id}`);
        await updateStage(event_id, 7, 'active');

        try {
            const { Event } = require('../models');
            const eventDoc = await Event.findOne({ event_id });

            const rules = await AlertRule.find({ event_id, is_active: true });

            if (rules.length === 0) {
                console.log(`[Alert] No active rules for event ${event_id}`);
                await updateStage(event_id, 7, 'done');
                return;
            }

            console.log(`[Alert] Evaluating ${rules.length} rules for ${event_id}`);

            for (const rule of rules) {
                let result = null;

                if (rule.rule_type === 'keyword_detected') {
                    result = await evaluateKeywordRule(rule, event_id);
                } else if (rule.rule_type === 'score_threshold') {
                    result = await evaluateScoreRule(rule, eventDoc);
                } else if (rule.rule_type === 'trend_change') {
                    result = await evaluateTrendRule(rule, analysis, event_id);
                }

                if (result?.matched) {
                    console.log(`[Alert] Rule triggered for user ${rule.user_id}: ${result.matched_value}`);

                    await Alert.create({
                        user_id: rule.user_id,
                        event_id,
                        rule_id: rule._id.toString(),
                        rule_type: rule.rule_type,
                        matched_value: result.matched_value,
                        triggered_at: new Date(),
                    });

                    try {
                        await axios.post(
                            `${process.env.FASTAPI_INTERNAL_URL}/internal/ws-alert`,
                            {
                                user_id: rule.user_id,
                                message: {
                                    type: 'alert',
                                    event_id,
                                    rule_type: rule.rule_type,
                                    matched_value: result.matched_value,
                                    description: rule.description || rule.rule_type,
                                    timestamp: new Date().toISOString(),
                                },
                            },
                            { timeout: 5000 }
                        );
                    } catch {
                        console.log(`[Alert] WS alert push skipped for user ${rule.user_id}`);
                    }
                }
            }

            await updateStage(event_id, 7, 'done');
            console.log(`[Alert] Stage 7 complete for ${event_id}`);

        } catch (error) {
            await updateStage(event_id, 7, 'failed', error.message);
            console.error(`[Alert] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 3,
    });

    worker.on('failed', (job, err) => {
        console.error(`[Alert] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createAlertWorker };