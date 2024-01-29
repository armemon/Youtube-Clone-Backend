import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))

app.use(express.json({limit:"16kb"}))
// body parser is default imported in new Node else we have to install and import

app.use(express.urlencoded({extended: true, limit:"16kb"}))
// extended true allow nested objects in url

app.use(express.static("public"))

app.use(cookieParser())
//  to get and set cookieParser in user browser

// app.use(middleware)
// use is used when we are using middleware or doing any configuartion



// routes import  // file segeration ( routes are imported after configuartion)
import userRouter from './routes/user.routes.js'

// routes declaration
// app.get     // will not be used as we have seperated things
// to use router you need middleware
app.use("/api/v1/users", userRouter)
// users is prefix whenver localhost8000/api/v1/users it will go in userRouter


export { app }