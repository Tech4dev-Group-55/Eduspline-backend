const express = require('express');
const router = express.Router();
const {
  uploadPredictions,
  getDashboardMetrics,
  getInsights,
  getStudentPrediction,
  predictSingleStudent
} = require('../controllers/prediction.controller');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

router.post('/upload', protect, allowRoles('super_admin', 'admin'), upload.single('file'), uploadPredictions);
router.get('/dashboard', protect, allowRoles('super_admin', 'admin'), getDashboardMetrics);
router.get('/insights', protect, allowRoles('super_admin', 'admin'), getInsights);
router.get('/student', protect, getStudentPrediction);
router.post('/predict', protect, allowRoles('super_admin', 'admin'), predictSingleStudent);

module.exports = router;