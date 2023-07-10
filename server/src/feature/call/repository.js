import CallSchema from "./models.js";
import { CALL_STATUS_TYPES } from "./types.js";

export const createCall = async ({ userId }) => {
  const call = new CallSchema({
    userId: userId,
    callStatus: CALL_STATUS_TYPES.CALL_INITIATED,
  });
  const result = await call.save(call);
  return result;
};

export const connectInspector = async ({ callId, inspectorId }) => {
  const callResult = await CallSchema.findById(callId).exec();
  console.log("callResult : ", callResult);
  const callUpdateResult = await CallSchema.findByIdAndUpdate(callId, {
    inspectorId: inspectorId,
    callStatus: CALL_STATUS_TYPES.CONNECTING,
  });
  console.log("callUpdateResult : ", callUpdateResult);

  const callResultAfterUpdate = await CallSchema.findById(callId).exec();
  return callResultAfterUpdate;
};

export const inspectorStartedSharingVideo = async ({ callId }) => {
  const callUpdateResult = await CallSchema.findByIdAndUpdate(callId, {
    callStatus: CALL_STATUS_TYPES.INSPECTOR_JOINED,
  });
  console.log("callUpdateResult : ", callUpdateResult);
  //
  const callResultAfterUpdate = await CallSchema.findById(callId).exec();
  return callResultAfterUpdate;
};

export const touristStartedSharingVideo = async ({ callId }) => {
  const callResult = await CallSchema.findById(callId).exec();
  console.log("callResult : ", callResult);
  const callUpdateResult = await CallSchema.findByIdAndUpdate(callId, {
    callStatus: CALL_STATUS_TYPES.IN_CALL,
  });
  console.log("callUpdateResult : ", callUpdateResult);
  //
  const callResultAfterUpdate = await CallSchema.findById(callId).exec();
  return callResultAfterUpdate;
};

export const updateCall = async ({ callId, callStatus }) => {
  const doc = await CallSchema.findByIdAndUpdate(callId, {
    callStatus: callStatus,
  });
  const result = await doc.save();
  return result;
};

export const endCall = async ({ callId }) => {
  const doc = CallSchema.findByIdAndUpdate(callId, {
    callStatus: CALL_STATUS_TYPES.CALL_ENDED,
    callEndedTiming: new Date.now(),
  });
  const result = doc.save();
  return result;
};
