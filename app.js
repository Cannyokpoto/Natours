
const express = require('express');
const morgan = require('morgan');
const app = express();
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')


//middlewares
app.use(express.json());
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'))
}

app.use(express.static(`${__dirname}/public`))

app.use((req, res, next)=>{
    req.requestTime = new Date().toISOString();
    next()
})


//Mounting routers
app.use('/api/tours', tourRouter);
app.use('/api/users', userRouter);

//custom response for all undefined routes
app.all('*', (req, res, next) =>{
    next(new AppError(`Could not find ${req.originalUrl} on this server!`, 404))
})

//Error controller
app.use(globalErrorHandler)

module.exports = app;




//Wrong
// mongodb+srv://canny:ZV45FABSeE2Pnep2@cluster0.1phkpxo.mongodb.net/

//correct
// mongodb+srv://canny:iamcanny@cluster0.b6shgon.mongodb.net/TodoList/natours



