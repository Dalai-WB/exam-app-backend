const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/students/:teacherId', userController.getStudentsByTeacher);
router.get('/teacher/all', userController.getTeachers);
router.post('/register', userController.register);
router.put('/approve/:userId', userController.approve);
router.get('/role-status/:fireId', userController.getUserRole);
router.get('/status/:status', userController.getPendingRequests);
router.delete('/:userId', userController.deleteUser);

module.exports = router;
