import IamUserSchema from "./schema.js";
import mongoose from "mongoose";

export async function createRootAdminIamUser({ userId, claims, code }) {
  const iamUser = new IamUserSchema({
    userId: mongoose.Types.ObjectId(userId),
    claims: claims,
    password: {
      status: "UN_VERIFIED", // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
      code: code,
      lastUpdated: new Date(),
    },
  });
  const data = await iamUser.save(iamUser);
  return data;
}

export async function createInspectorIamUser({ userId, code }) {
  const iamUser = new IamUserSchema({
    userId: mongoose.Types.ObjectId(userId),
    password: {
      status: "UN_VERIFIED", // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
      code: code,
      lastUpdated: new Date(),
    },
  });
  const data = await iamUser.save(iamUser);
  return data;
}

export async function findIamUserByUserId({ userId }) {
  const result = await IamUserSchema.findOne({ userId: userId }).exec();
  return result;
}

export async function checkIamRootUserHasPasswordUnVerified({ userId }) {
  const result = await IamUserSchema.findOne({
    userId: userId,
    password: { status: "UN_VERIFIED" },
  }).exec();
  return result;
}

export async function setIamUserNewPassword({ iamUserId, password }) {
  const result = await IamUserSchema.findByIdAndUpdate(iamUserId, {
    password: {
      value: password,
      status: "VERIFIED", // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
      code: null,
      lastUpdated: new Date(),
    },
  });

  return result;
}

export async function changeIamUserPasswordStatus({ iamUserId, status, code }) {
  const result = await IamUserSchema.findByIdAndUpdate(iamUserId, {
    password: {
      value: null,
      status: status, // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
      code: code,
      lastUpdated: new Date(),
    },
  });

  return result;
}

export async function getSuperAdminIamUser(value) {
  const { userId, dob, email, phoneNumber } = value;

  IamUserSchema.countDocuments({ claims: "jungle" }, function (err, count) {
    console.log("there are %d jungle adventures", count);
  });
  const _userId = mongoose.Types.ObjectId(userId);
  const iamUser = new IamUserSchema({
    userId: _userId,
    password: {
      status: "UN_VERIFIED", // UN_VERIFIED, VERIFIED, RESET, FORGOT_PASSWORD
    },
  });
  const { data } = await iamUser.save(iamUser);
  return data;
}

export async function updateIamUserClaims({ iamUserId, claims }) {
  const result = await IamUserSchema.findByIdAndUpdate(iamUserId, {
    claims: [...claims],
  });
  return result;
}

export async function getAllIamInspectorsProfileByIds({ ids }) {
  const result = await IamUserSchema.find({
    userId: {
      $in: ids,
    },
  });
  return result;
}

export async function getAllIamUsersByPagination({ size, updatedOnBefore }) {
  if (typeof updatedOnBefore !== "String") {
    const firstDocument = await IamUserSchema.find()
      .limit(1)
      .sort({ updatedAt: -1 });
    updatedOnBefore = firstDocument.updatedAt;
  }
  const result = await IamUserSchema.find({
    updatedAt: { $lte: updatedOnBefore },
  })
    .limit(size)
    .sort({ updatedAt: -1 });

  return result;
}
