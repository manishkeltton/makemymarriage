import mongoose from "mongoose";
const uri = process.env.MONGODB_URI;
console.log("URI:", uri);
mongoose.connect(uri).then(() => {
  console.log("Connected");
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
