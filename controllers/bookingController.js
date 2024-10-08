const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
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



//this will not work because my controller is not complete
const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};


//create a webhook checkout on stripe
//this will not work because my controller is not complete
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};



exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);