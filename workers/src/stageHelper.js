// Pipeline Stage Helper

const { PipelineStage } = require('./models');

const STAGE_NAMES = {
    1: 'Event Ingestion',
    2: 'Stream Accumulation',
    3: 'Groq Commentary',
    4: 'Gemini Flash Analysis',
    5: 'Redis Pub/Sub Publish',
    6: 'WebSocket Push',
    7: 'Alert Rule Evaluation',
    8: 'Post-Event Report',
};

const updateStage = async (event_id, stageNumber, status, errorMessage = null) => {
    const updateData = { status };
    if (status === 'active') {
        updateData.started_at = new Date();
    } else if (status === 'done' || status === 'failed') {
        updateData.completed_at = new Date();
    }
    if (errorMessage) {
        updateData.error_message = errorMessage;
    }

    const existing = await PipelineStage.findOne({ event_id, stage_number: stageNumber });
    if (!existing) {
        await PipelineStage.create({
            event_id,
            stage_number: stageNumber,
            stage_name: STAGE_NAMES[stageNumber],
            ...updateData,
        });
    } else {
        await PipelineStage.updateOne(
            { event_id, stage_number: stageNumber },
            { $set: updateData }
        );
    }
};

const initStages = async (event_id) => {
    const existing = await PipelineStage.findOne({ event_id });
    if (existing) return;
    const stages = Object.entries(STAGE_NAMES).map(([num, name]) => ({
        event_id,
        stage_number: parseInt(num),
        stage_name: name,
        status: 'pending',
        started_at: null,
        completed_at: null,
    }));
    await PipelineStage.insertMany(stages);
};

module.exports = { updateStage, initStages, STAGE_NAMES };