const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    event_id: { type: String, required: true, unique: true },
    sport: String,
    home_team: String,
    away_team: String,
    home_score: { type: Number, default: 0 },
    away_score: { type: Number, default: 0 },
    status: { type: String, enum: ['Live', 'Upcoming', 'Final'], default: 'Upcoming' },
    venue: String,
    date: String,
    league: String,
    updates: [String],
    last_commentary_at: { type: Date, default: null },
    last_analysis_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const eventStreamSchema = new mongoose.Schema({
    event_id: { type: String, required: true, index: true },
    update_text: String,
    home_score: Number,
    away_score: Number,
    sport: String,
    home_team: String,
    away_team: String,
    timestamp: { type: Date, default: Date.now },
});

const pipelineStageSchema = new mongoose.Schema({
    event_id: { type: String, required: true },
    stage_number: { type: Number, required: true },
    stage_name: String,
    status: { type: String, enum: ['pending', 'active', 'done', 'failed'], default: 'pending' },
    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    error_message: { type: String, default: null },
});

const commentarySchema = new mongoose.Schema({
    event_id: { type: String, required: true, index: true },
    commentary_text: String,
    model: { type: String, default: 'llama-3.1-8b-instant' },
    created_at: { type: Date, default: Date.now },
});

const geminiAnalysisSchema = new mongoose.Schema({
    event_id: { type: String, required: true, index: true },
    updated_summary: String,
    key_moments: [String],
    trend: { type: String, enum: ['momentum', 'stable', 'reversal'], default: 'stable' },
    prediction: String,
    confidence: { type: Number, default: 0.5 },
    model: { type: String, default: 'gemini-1.5-flash' },
    created_at: { type: Date, default: Date.now },
});

const groqPredictionSchema = new mongoose.Schema({
    event_id: { type: String, required: true, index: true },
    prediction: String,
    confidence: { type: Number, default: 0.5 },
    model: { type: String, default: 'llama-3.1-8b-instant' },
    created_at: { type: Date, default: Date.now },
});

const alertRuleSchema = new mongoose.Schema({
    user_id: String,
    event_id: String,
    rule_type: String,
    keyword: String,
    threshold: Number,
    description: String,
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
});

const alertSchema = new mongoose.Schema({
    user_id: String,
    event_id: String,
    rule_id: String,
    rule_type: String,
    matched_value: String,
    triggered_at: { type: Date, default: Date.now },
});

const eventReportSchema = new mongoose.Schema({
    event_id: { type: String, required: true, unique: true },
    narrative_summary: String,
    top_5_key_moments: [String],
    prediction_accuracy_score: Number,
    winning_team: String,
    match_rating: String,
    model_performance: {
        groq_accuracy: Number,
        gemini_accuracy: Number,
        better_model: String,
    },
    created_at: { type: Date, default: Date.now },
});

const Event = mongoose.model('Event', eventSchema, 'events');
const EventStream = mongoose.model('EventStream', eventStreamSchema, 'event_stream');
const PipelineStage = mongoose.model('PipelineStage', pipelineStageSchema, 'pipeline_stages');
const Commentary = mongoose.model('Commentary', commentarySchema, 'commentary');
const GeminiAnalysis = mongoose.model('GeminiAnalysis', geminiAnalysisSchema, 'gemini_analyses');
const GroqPrediction = mongoose.model('GroqPrediction', groqPredictionSchema, 'groq_predictions');
const AlertRule = mongoose.model('AlertRule', alertRuleSchema, 'alert_rules');
const Alert = mongoose.model('Alert', alertSchema, 'alerts');
const EventReport = mongoose.model('EventReport', eventReportSchema, 'event_reports');

module.exports = {
    Event,
    EventStream,
    PipelineStage,
    Commentary,
    GeminiAnalysis,
    GroqPrediction,
    AlertRule,
    Alert,
    EventReport,
};