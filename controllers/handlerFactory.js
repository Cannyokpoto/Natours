const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

//to delete documents
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

//to update documents
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

//to create a document
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        data: newDoc,
      },
    });
  });

//to get a document
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = Model.findById(req.params.id).populate(popOptions);

    const singleDoc = await query;

    const searchID = req.params.id;
    console.warn("searchID:", searchID);

    if (!singleDoc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      data: {
        data: singleDoc,
      },
    });
  });

//to get all document from a particular collection
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //to allow users to get all reviews for a specific tour using the tour ID
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //Calling Api features
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //The explain() method helps to show (on postman) query statistic; like how many documents were scanned to finally filter the desired data
    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
