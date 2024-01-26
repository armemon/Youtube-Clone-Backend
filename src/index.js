import connectDB from "./db/index.js";
import {app} from './app.js'
// dotenv package is not imported b/c using node 20
//  and env-file imported in scripts (package.json File)

const port = process.env.PORT || 8000

connectDB()
.then(() =>{
    //  Connecting Database to app
    app.listen(port, () =>{
        console.log(` Server is running at Port: ${port}`);
    } )
    // Now app is using database
})
.catch((err) =>{
    console.log("MongoDB connection Failed", err);
})