import mongoose from "mongoose";
const { Schema } = mongoose;
// callStatus -> CALL-INITIATED, CONNECTING, IN-CALL, CALL-ENDED
const schema = new Schema({
  userId: String,
  inspectorId: String,
  callInitiatedTime: { type: Date, default: Date.now },
  callStatus: String,
  callEndedTiming: { type: Date },
});

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

const CallSchema = mongoose.model("call", schema);

export default CallSchema;
