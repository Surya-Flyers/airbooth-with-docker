import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    description: String,
    itemsPermission: [
      {
        itemId: Schema.Types.ObjectId,
        create: Boolean,
        read: Boolean,
        update: Boolean,
        delete: Boolean,
      },
    ],
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const IamClaimSchema = mongoose.model("iamClaim", schema);

export default IamClaimSchema;
