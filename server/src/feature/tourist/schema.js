import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    passportNumber: String,
    dob: { type: Date },
    phoneNumber: Number,
    name: String,
  },
  { timestamps: true }
);

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const TouristSchema = mongoose.model("tourist", schema);

export default TouristSchema;
