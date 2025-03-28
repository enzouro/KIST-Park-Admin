import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  catergory: {
    type: String,
    required: true,
  }
});

const Catergory = mongoose.model("Catergory", CategorySchema);

export default Catergory;