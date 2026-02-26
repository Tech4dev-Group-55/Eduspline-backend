const axios = require('axios');
const { parse } = require('csv-parse/sync');
const FormData = require('form-data');
const User = require('../models/User');
const Prediction = require('../models/Prediction');

const ML_API_URL = 'https://eduspline-ai-prediction-model-1.onrender.com';

const REQUIRED_COLUMNS = [
  'StudyHours', 'Attendance', 'Resources', 'Extracurricular',
  'Motivation', 'Internet', 'Gender', 'Age', 'OnlineCourses',
  'Discussions', 'AssignmentCompletion', 'EDTech_Usage_Level',
  'StressLevel', 'LearningStyle'
];

// POST /api/predictions/upload
const uploadPredictions = async (req, res) => {
  try {
    const institutionId = req.user.institution;
    if (!institutionId) {
      return res.status(400).json({ message: 'Complete institution setup first' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    // parse csv
    let rows;
    try {
      rows = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (err) {
      return res.status(400).json({ message: 'Invalid CSV format' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    // validate required columns
    const firstRow = rows[0];
    const missing = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    if (missing.length > 0) {
      return res.status(400).json({
        message: `CSV is missing required columns: ${missing.join(', ')}`
      });
    }

    // validate email column exists
    if (!('email' in firstRow) && !('Email' in firstRow)) {
      return res.status(400).json({ message: 'CSV must include an email column to link students' });
    }

    // call ML API with the CSV buffer
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: 'students.csv',
      contentType: 'text/csv'
    });

    let mlResponse;
    try {
      mlResponse = await axios.post(`${ML_API_URL}/predict/batch/json`, form, {
        headers: form.getHeaders(),
        timeout: 60000
      });
    } catch (err) {
      return res.status(502).json({
        message: 'ML model API is unavailable. Please try again shortly.',
        error: err.message
      });
    }

    const { predictions } = mlResponse.data;

    if (!predictions || predictions.length === 0) {
      return res.status(500).json({ message: 'ML model returned no predictions' });
    }

    // save or overwrite predictions
    let saved = 0;
    let skipped = 0;

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const row = rows[i]; // match by index position

      if (!row) {
        skipped++;
        continue;
      }

      const email = (row.email || row.Email || '').toLowerCase().trim();

      if (!email) {
        skipped++;
        continue;
      }

      const studentName = row.name || row.Name || email;

      // try to find matching user account
      const existingUser = await User.findOne({ email, institution: institutionId });

      // upsert — overwrite if exists
      await Prediction.findOneAndUpdate(
        { studentEmail: email, institutionId },
        {
          studentId: existingUser ? existingUser._id : null,
          institutionId,
          studentName,
          studentEmail: email,
          riskLevel: pred.risk_level,
          riskCode: pred.risk_code,
          confidence: pred.confidence,
          studyHours: parseFloat(row.StudyHours) || 0,
          attendance: parseFloat(row.Attendance) || 0,
          assignmentCompletion: parseFloat(row.AssignmentCompletion) || 0,
          recommendations: pred.recommendations || []
        },
        { upsert: true, new: true }
      );

      saved++;
    }

    res.status(201).json({
      message: 'Predictions saved successfully',
      total: predictions.length,
      saved,
      skipped
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/predictions/dashboard
const getDashboardMetrics = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    const totalLearners = await Prediction.countDocuments({ institutionId });
    const highRiskCount = await Prediction.countDocuments({ institutionId, riskLevel: 'High Risk' });

    const avgData = await Prediction.aggregate([
      { $match: { institutionId: institutionId } },
      {
        $group: {
          _id: null,
          avgEngagement: { $avg: '$attendance' },
          avgCourseCompletion: { $avg: '$assignmentCompletion' }
        }
      }
    ]);

    const metrics = avgData[0] || { avgEngagement: 0, avgCourseCompletion: 0 };

    res.json({
      totalLearners,
      highRiskLearners: highRiskCount,
      averageEngagement: Math.round(metrics.avgEngagement || 0),
      courseCompletionRate: Math.round(metrics.avgCourseCompletion || 0)
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/predictions/insights
const getInsights = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    const predictions = await Prediction.find({ institutionId })
      .select('studentName studentEmail attendance riskLevel confidence updatedAt')
      .sort({ riskCode: 1 }); // high risk first

    const insights = predictions.map(p => ({
      name: p.studentName,
      email: p.studentEmail,
      engagement: `${p.attendance}%`,
      riskLevel: p.riskLevel,
      confidence: `${p.confidence}%`,
      lastUpdated: p.updatedAt
    }));

    res.json({ total: insights.length, insights });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/predictions/student
const getStudentPrediction = async (req, res) => {
  try {
    const email = req.user.email;
    const institutionId = req.user.institution;

    const prediction = await Prediction.findOne({ studentEmail: email, institutionId });

    if (!prediction) {
      return res.status(404).json({ message: 'No prediction found for this student yet' });
    }

    res.json({
      riskLevel: prediction.riskLevel,
      confidence: prediction.confidence,
      totalStudyHours: prediction.studyHours,
      averageEngagement: `${prediction.attendance}%`,
      courseCompletionRate: `${prediction.assignmentCompletion}%`,
      recommendations: prediction.recommendations,
      lastUpdated: prediction.updatedAt
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  uploadPredictions,
  getDashboardMetrics,
  getInsights,
  getStudentPrediction
};