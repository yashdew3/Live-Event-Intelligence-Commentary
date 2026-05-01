//  Ingestion Worker

const { Worker } = require('bullmq');
const { Event } = require('../models');
const { updateStage, initStages } = require('../stageHelper');
const { accumulationQueue, groqCommentaryQueue } = require('../queues');

const createIngestionWorker = (redisConnection) => {
    const worker = new Worker('ingest-queue', async (job) => {
        const eventData = job.data;
        const event_id = eventData.event_id;

        console.log(`[Ingestion] Processing event: ${event_id}`);

        await initStages(event_id);
        await updateStage(event_id, 1, 'active');

        try {
            await Event.findOneAndUpdate(
                { event_id },
                {
                    $set: {
                        event_id: eventData.event_id,
                        sport: eventData.sport,
                        home_team: eventData.home_team,
                        away_team: eventData.away_team,
                        home_score: eventData.home_score,
                        away_score: eventData.away_score,
                        status: eventData.status,
                        venue: eventData.venue,
                        date: eventData.date,
                        league: eventData.league,
                        updates: eventData.updates,
                        updated_at: new Date(),
                    },
                },
                { upsert: true, new: true }
            );

            await updateStage(event_id, 1, 'done');
            console.log(`[Ingestion] Event ${event_id} saved successfully`);

            await accumulationQueue.add(
                `accumulate-${event_id}`,
                { ...eventData },
                { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
            );

        } catch (error) {
            await updateStage(event_id, 1, 'failed', error.message);
            console.error(`[Ingestion] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 5,
    });

    worker.on('completed', (job) => {
        console.log(`[Ingestion] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Ingestion] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createIngestionWorker };