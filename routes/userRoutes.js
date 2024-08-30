const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

//This protects all the routes that come below this line of code (in the middleware stack)
//So there is no need adding 'authController.protect' middleware to those routes
router.use(authController.protect);

router.patch("/update-password", authController.updatePassword);

router.patch(
  "/update-me",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.delete("/delete-me", userController.deleteMe);

//to restrict the routes below to only admin
//only the admin can perform these actions
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route("/me").get(userController.getMe, userController.getUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
