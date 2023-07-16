import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    dob: { type: Date },
    email: { type: String, unique: true },
    phoneNumber: String,
    designation: Schema.Types.ObjectId,
    iamUser: Schema.Types.ObjectId,
    reportingManager: Schema.Types.ObjectId,
    externalId: String,
    employeeId: String,
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const InspectorSchema = mongoose.model("inspector", schema);

export default InspectorSchema;
