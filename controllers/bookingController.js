const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require("./../models/tourModel");
const APIFeatures = require('./../utils/apiFeatures')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');



exports.getCheckoutSession = catchAsync(async (req, res, next) =>{
    // 1) get currently booked tour
  const  tour = await Tour.findById(req.params.tourId);

  // 2) create checkout session
 const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // line_items: [
    //     {
    //         name: `${tour.name} Tour`,
    //         description: tour.summary,
    //         // the image path would look like this for a deployed application https://www.natours.dev/img/tours/${tour.imageCover}
    //         images: [`https://handiworks.cosmossound.com.ng/uploads/1717176244231-117671712-oyin.jpg`],
    //         price: tour.price * 100,
    //         currency: 'usd',
    //         quantity: 1
    //     }
    // ]

    mode: 'payment',
    line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tour.name} Tour`,
            },
            unit_amount: tour.price * 100, // Amount in cents, so this is $20.00
          },
          quantity: 1,
        },
      ],
  });


  // 3) create session as response
  res.status(200).json({
    status: 'success',
    session
  })
});