import mongoose from "mongoose";
const { Schema } = mongoose;

const schema = new Schema({
  touristId: Schema.Types.ObjectId,
  callRoomId: Schema.Types.ObjectId,
  totalAmount: String,
  createdAt: { type: Date },
  updatedAt: { type: Date },
  payment: {
    type: String,
    status: String,
    message: String,
  },
  items: [[Schema.Types.ObjectId]],
});

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const TransactionSchema = mongoose.model("transaction", schema);

export default TransactionSchema;
