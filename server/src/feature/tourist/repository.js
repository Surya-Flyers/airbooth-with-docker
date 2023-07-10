import { randomUUID } from "crypto";
import TouristSchema from "./schema";

export const getPassportDetailsThroughScan = async (showExisting = false) => {
  // HIT : PLANETs API to get details
  return {
    passportNumber: showExisting
      ? "89rct5ac2-8493-49b0-95d8-de843d90e6ca"
      : randomUUID(),
    dob: "12-04-1999",
    name: "Tourist 007",
    created_at: "2023-07-07T05:59:53.658+00:00",
    updated_at: "2023-07-07T05:59:53.658+00:00",
  };
};

export const verifyEnteredPassportDetails = async (data) => {
  // HIT : PLANETs API to verify details
  return {
    status: true,
    message: "",
  };
};

export const saveTouristPassportDetails = async ({
  passportNumber,
  dob,
  phoneNumber,
  name,
}) => {
  const tourist = new TouristSchema({
    passportNumber: passportNumber,
    dob: dob,
    phoneNumber: phoneNumber,
    name: name,
  });
  const result = await tourist.save(tourist);
  return result;
};
