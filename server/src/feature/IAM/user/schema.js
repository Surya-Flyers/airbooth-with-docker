import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    userId: Schema.Types.ObjectId,
    claims: [Schema.Types.ObjectId],
    password: {
      value: String,
      status: String, // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
      code: String,
      lastUpdated: { type: Date },
    },
  },
  { timestamps: true }
);

const IamUserSchema = mongoose.model("iamUser", schema);

export default IamUserSchema;
