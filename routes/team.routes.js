const express = require('express');
const router = express.Router();
const {
  inviteTeamMember,
  csvInviteTeamMembers,
  acceptInvite,
  getTeamMembers
} = require('../controllers/team.controller');
const { protect, allowRoles } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

router.post('/invite', protect, allowRoles('super_admin', 'admin'), inviteTeamMember);
router.post('/invite/csv', protect, allowRoles('super_admin', 'admin'), upload.single('file'), csvInviteTeamMembers);
router.post('/accept-invite', acceptInvite);
router.get('/', protect, getTeamMembers);

module.exports = router;