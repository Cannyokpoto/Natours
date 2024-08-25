const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authController = require("./../controllers/authController");

//mergeParams allows nested route
const router = express.Router({ mergeParams: true });

//This protects all the routes that come below this line of code (in the middleware stack)
//So there is no need adding 'authController.protect' middleware to those routes
router.use(authController.protect);

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .patch(
    authController.restrictTo("admin", "user"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview
  )
  .get(reviewController.getReview);

module.exports = router;
