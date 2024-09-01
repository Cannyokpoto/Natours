const dotenv = require('dotenv');
const mongoose = require('mongoose');

//to handle all uncaught exceptions (for synchronous operations), 
// like trying to access an undefined variable
process.on('uncaughtException', err =>{
    console.log('Uncaught exception! Shutting down...');
    console.log(err);
    // server.close(() =>{
    //     process.exit(1);
    // });
    process.exit(1);
});

dotenv.config({path: './config.env'});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con =>{
    console.log(con.connections)
    console.log('DB connected successfully')
})



//to create a tour
// const testTour = new Tour({
//     name: 'the 3rd tour',
//     price: 6000
// })

// testTour.save()
// .then(doc =>{
//     console.log(doc)
// })
// .catch(err =>{
//     console.log('An error occured while trying to create tour!!', err)
// })

//SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, ()=>{
    console.log(`Server running on port ${port}...`)
});


//to handle all unhandled rejected promises (for asynchronous operations), like error connecting to the 
// DB or any error outside express or mongoose
process.on('unhandledRejection', err =>{
    console.log('Unhandled Rejection! Shutting down...');
    console.log(err);
    server.close(() =>{
        process.exit(1);
    });
});


//this configuration is specific to heroku. SIGTERM event is when the server is about to do its routine (every 24hrs) shut down.
//to keep the application healthy
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });