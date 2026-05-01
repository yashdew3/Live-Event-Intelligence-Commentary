require('dotenv').config();
const { Queue } = require('bullmq');

const redisConnection = {
    url: process.env.REDIS_URL,
    enableTLSForSentinelMode: false,
    tls: {},
    maxRetriesPerRequest: null,
};

const ingestQueue = new Queue('ingest-queue', { connection: redisConnection });
const accumulationQueue = new Queue('accumulation-queue', { connection: redisConnection });
const groqCommentaryQueue = new Queue('groq-commentary-queue', { connection: redisConnection });
const geminiAnalysisQueue = new Queue('gemini-analysis-queue', { connection: redisConnection });
const alertEvaluationQueue = new Queue('alert-evaluation-queue', { connection: redisConnection });
const reportGenerationQueue = new Queue('report-generation-queue', { connection: redisConnection });

module.exports = {
    redisConnection,
    ingestQueue,
    accumulationQueue,
    groqCommentaryQueue,
    geminiAnalysisQueue,
    alertEvaluationQueue,
    reportGenerationQueue,
};