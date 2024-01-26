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

app.use(express.urlencoded({extented: true, limit:"16kb"}))
// extended true allow nested objects in url

app.use(express.static("public"))

app.use(cookieParser())
//  to get and set cookieParser in user browser

// app.use(middleware)
// use is used when we are using middleware or doing any configuartion

export { app }