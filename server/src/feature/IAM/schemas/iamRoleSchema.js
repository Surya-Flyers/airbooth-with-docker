import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    name: String,
    description: String,
    itemsPermission: [
      [
        {
          itemId: Schema.Types.ObjectId,
          create: Boolean,
          read: Boolean,
          update: Boolean,
          delete: Boolean,
        },
      ],
    ],
  },
  { timestamps: true }
);

const IamRoleSchema = mongoose.model("iamRole", schema);

export default IamRoleSchema;
