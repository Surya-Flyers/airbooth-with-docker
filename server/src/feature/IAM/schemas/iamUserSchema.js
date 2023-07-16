import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    userId: Schema.Types.ObjectId,
    roles: [[Schema.Types.ObjectId]],
    groupedRoles: Schema.Types.ObjectId,
    password: {
      value: String,
    },
  },
  { timestamps: true }
);

const IamUserSchema = mongoose.model("iamUser", schema);

export default IamUserSchema;
