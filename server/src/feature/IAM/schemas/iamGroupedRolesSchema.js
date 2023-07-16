import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    description: String,
    roles: [[Schema.Types.ObjectId]],
  },
  { timestamps: true }
);

const IamGroupedRolesSchema = mongoose.model("iamGroupedRoles", schema);

export default IamGroupedRolesSchema;
