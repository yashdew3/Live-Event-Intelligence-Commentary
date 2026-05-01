// Accumulation Worker

const { Worker } = require('bullmq');
const { EventStream } = require('../models');
const { updateStage } = require('../stageHelper');
const { groqCommentaryQueue } = require('../queues');

const createAccumulationWorker = (redisConnection) => {
    const worker = new Worker('accumulation-queue', async (job) => {
        const eventData = job.data;
        const event_id = eventData.event_id;

        console.log(`[Accumulation] Processing stream for event: ${event_id}`);

        await updateStage(event_id, 2, 'active');

        try {
            const updates = eventData.updates || [];
            const latestUpdate = updates[updates.length - 1] || 'Game in progress';

            await EventStream.create({
                event_id,
                update_text: latestUpdate,
                home_score: eventData.home_score,
                away_score: eventData.away_score,
                sport: eventData.sport,
                home_team: eventData.home_team,
                away_team: eventData.away_team,
                timestamp: new Date(),
            });

            const count = await EventStream.countDocuments({ event_id });
            if (count > 50) {
                const oldest = await EventStream.findOne({ event_id }).sort({ timestamp: 1 });
                if (oldest) {
                    await EventStream.deleteOne({ _id: oldest._id });
                }
            }

            await updateStage(event_id, 2, 'done');
            console.log(`[Accumulation] Stream updated for ${event_id} (${Math.min(count, 50)} entries)`);

            await groqCommentaryQueue.add(
                `commentary-${event_id}-${Date.now()}`,
                { ...eventData, latest_update: latestUpdate },
                { attempts: 2, backoff: { type: 'fixed', delay: 1000 } }
            );

        } catch (error) {
            await updateStage(event_id, 2, 'failed', error.message);
            console.error(`[Accumulation] Failed for ${event_id}:`, error.message);
            throw error;
        }
    }, {
        connection: redisConnection,
        concurrency: 5,
    });

    worker.on('failed', (job, err) => {
        console.error(`[Accumulation] Job ${job?.id} failed:`, err.message);
    });

    return worker;
};

module.exports = { createAccumulationWorker };