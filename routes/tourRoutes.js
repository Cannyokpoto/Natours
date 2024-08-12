const fs = require('fs')
const express = require('express');
const tourController = require('./../controllers/tourController')
const authController = require('./../controllers/authController')


const router = express.Router();

//Param middleware
// router.param('id', tourController.checkId)

//Tours

router.route('/top-5-cheap')
.get(tourController.aliasTopTour, tourController.getAllTours)

router.route('/tour-stats')
.get(tourController.getTourStats)

router.route('/monthly-plan/:year')
.get(tourController.getMonthlyPlan)

// router.route('/secret-tours')
// .get(tourController.getSecretTours)

router.route('/')
.get(authController.protect, tourController.getAllTours)
.post(tourController.createTour);


router.route('/:id')
.get(tourController.getOneTour)
.patch(tourController.updateTour)
.delete(authController.protect, authController.restrictTo('admin', 'lead-guide'),
     tourController.deleteTour);

module.exports = router;