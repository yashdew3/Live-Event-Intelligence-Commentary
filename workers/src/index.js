require('dotenv').config();
const { connectMongo } = require('./mongodb');
const { startBullBoard } = require('./bullboard');
const { redisConnection } = require('./queues');

const { createIngestionWorker } = require('./workers/ingestionWorker');
const { createAccumulationWorker } = require('./workers/accumulationWorker');
const { createGroqWorker } = require('./workers/groqWorker');
const { createGeminiWorker } = require('./workers/geminiWorker');
const { createAlertWorker } = require('./workers/alertWorker');
const { createReportWorker } = require('./workers/reportWorker');

const start = async () => {
    await connectMongo();

    startBullBoard();

    createIngestionWorker(redisConnection);
    createAccumulationWorker(redisConnection);
    createGroqWorker(redisConnection);
    createGeminiWorker(redisConnection);
    createAlertWorker(redisConnection);
    createReportWorker(redisConnection);

    console.log('All 6 BullMQ workers started and listening for jobs');
    console.log('Bull Board → http://localhost:3001/admin/queues');
};

start().catch((err) => {
    console.error('Worker startup failed:', err);
    process.exit(1);
});