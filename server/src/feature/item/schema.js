import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema(
  {
    touristId: Schema.Types.ObjectId,
    name: String,
    invoiceId: String,
    totalAmount: Number,
    currency: String,
    netRefund: Number,
    status: String,
    callId: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const ItemSchema = mongoose.model("item", schema);

export default ItemSchema;
