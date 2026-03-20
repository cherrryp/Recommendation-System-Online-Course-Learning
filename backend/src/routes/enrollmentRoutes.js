const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, enrollmentController.enroll);
router.get('/my', authMiddleware, enrollmentController.getMyEnrollments);
router.get('/:id', authMiddleware, enrollmentController.getEnrollmentById);
router.patch('/:id', authMiddleware, enrollmentController.updateEnrollment);
router.delete('/:id', authMiddleware, enrollmentController.deleteEnrollment);

module.exports = router;