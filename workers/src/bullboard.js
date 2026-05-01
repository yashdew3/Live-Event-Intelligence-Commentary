require('dotenv').config();
const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const {
    ingestQueue,
    accumulationQueue,
    groqCommentaryQueue,
    geminiAnalysisQueue,
    alertEvaluationQueue,
    reportGenerationQueue,
} = require('./queues');

const startBullBoard = () => {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
        queues: [
            new BullMQAdapter(ingestQueue),
            new BullMQAdapter(accumulationQueue),
            new BullMQAdapter(groqCommentaryQueue),
            new BullMQAdapter(geminiAnalysisQueue),
            new BullMQAdapter(alertEvaluationQueue),
            new BullMQAdapter(reportGenerationQueue),
        ],
        serverAdapter,
    });

    const app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/admin/queues', serverAdapter.getRouter());

    app.post('/internal/enqueue', async (req, res) => {
        try {
            const { queue_name, job_name, data, opts } = req.body;
            const queues = {
                'ingest-queue': ingestQueue,
                'accumulation-queue': accumulationQueue,
                'groq-commentary-queue': groqCommentaryQueue,
                'gemini-analysis-queue': geminiAnalysisQueue,
                'alert-evaluation-queue': alertEvaluationQueue,
                'report-generation-queue': reportGenerationQueue,
            };
            const targetQueue = queues[queue_name];
            if (!targetQueue) {
                return res.status(400).json({ error: `Unknown queue: ${queue_name}` });
            }
            await targetQueue.add(job_name, data, opts || {});
            res.json({ success: true, queue: queue_name, job: job_name });
        } catch (err) {
            console.error('[EnqueueAPI] Error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/internal/enqueue-batch', async (req, res) => {
        try {
            const { jobs } = req.body;
            const queues = {
                'ingest-queue': ingestQueue,
                'accumulation-queue': accumulationQueue,
                'groq-commentary-queue': groqCommentaryQueue,
                'gemini-analysis-queue': geminiAnalysisQueue,
                'alert-evaluation-queue': alertEvaluationQueue,
                'report-generation-queue': reportGenerationQueue,
            };
            let count = 0;
            for (const job of jobs) {
                const targetQueue = queues[job.queue_name];
                if (targetQueue) {
                    await targetQueue.add(job.job_name, job.data, job.opts || {});
                    count++;
                }
            }
            res.json({ success: true, enqueued: count });
        } catch (err) {
            console.error('[EnqueueAPI] Batch error:', err.message);
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/internal/health', (req, res) => {
        res.json({ status: 'ok', queues: 6 });
    });

    app.get('/internal/failed-jobs', async (req, res) => {
        try {
            const allQueues = {
                'ingest-queue': ingestQueue,
                'accumulation-queue': accumulationQueue,
                'groq-commentary-queue': groqCommentaryQueue,
                'gemini-analysis-queue': geminiAnalysisQueue,
                'alert-evaluation-queue': alertEvaluationQueue,
                'report-generation-queue': reportGenerationQueue,
            };

            const failedJobs = [];
            for (const [queueName, queue] of Object.entries(allQueues)) {
                const failed = await queue.getFailed(0, 50);
                for (const job of failed) {
                    failedJobs.push({
                        job_id: job.id,
                        queue_name: queueName,
                        name: job.name,
                        data: job.data,
                        error_message: job.failedReason || 'Unknown error',
                        retry_count: job.attemptsMade,
                        last_attempted: job.processedOn ? new Date(job.processedOn).toISOString() : null,
                    });
                }
            }

            res.json({ failed_jobs: failedJobs, total: failedJobs.length });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/internal/retry-job', async (req, res) => {
        try {
            const { job_id, queue_name } = req.body;
            const queues = {
                'ingest-queue': ingestQueue,
                'accumulation-queue': accumulationQueue,
                'groq-commentary-queue': groqCommentaryQueue,
                'gemini-analysis-queue': geminiAnalysisQueue,
                'alert-evaluation-queue': alertEvaluationQueue,
                'report-generation-queue': reportGenerationQueue,
            };
            const queue = queues[queue_name];
            if (!queue) return res.status(400).json({ error: 'Unknown queue' });

            const job = await queue.getJob(job_id);
            if (!job) return res.status(404).json({ error: 'Job not found' });

            await job.retry();
            res.json({ success: true, job_id, queue_name });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    const port = process.env.BULL_BOARD_PORT || 3001;
    app.listen(port, () => {
        console.log(`Bull Board running at http://localhost:${port}/admin/queues`);
        console.log(`Enqueue API running at http://localhost:${port}/internal/enqueue`);
    });
};

module.exports = { startBullBoard };