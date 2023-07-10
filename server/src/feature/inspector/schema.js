import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    dob: { type: Date },
    email: { type: String, unique: true },
    tempLoginCode: String,
    tempLoginToken: String,
    password: { type: String },
  },
  { timestamps: true }
);

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const InspectorSchema = mongoose.model("inspector", schema);

export default InspectorSchema;
