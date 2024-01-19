import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(`\n MongoDB connected !!! DB HOST: ${connectionInstance}`);
  } catch (error) {
    console.log("MongoDB Connection Error: ", error);
    process.exit(1); //node JS Process to exit
    // Process is reference of our application running
    // different code to exit process(application)
  }
};
