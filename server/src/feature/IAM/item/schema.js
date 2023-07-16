import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    value: String,
    description: String,
  },
  { timestamps: true }
);

const IamItemSchema = mongoose.model("iamItem", schema);

export default IamItemSchema;
