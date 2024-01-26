import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    // console.log(`\n MongoDB connected !! DB: ${connectionInstance}`);
    // console.log('connectionInstance', connectionInstance);
    console.log(`\n MongoDB connected !!! DB HOST: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.log("MongoDB Connection Error: ", error);
    process.exit(1); //node JS Process to exit
    // Process is reference of our application running
    // different code to exit process(application)
  }
};

export default connectDB
