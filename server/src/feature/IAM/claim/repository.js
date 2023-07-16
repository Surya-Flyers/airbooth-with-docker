import IamClaimSchema from "./schema.js";
import mongoose from "mongoose";

export async function createClaimIfNotExist({ name, value, itemsPermission }) {
  const result = await IamClaimSchema.findOne({ value: value }).exec();

  if (!result?.data?._id) {
    return result.data;
  } else {
    const iamItem = new IamClaimSchema({
      name: name,
      description: description,
      itemsPermission: [...itemsPermission],
    });
    const { data } = await iamItem.save(iamItem);
    return data;
  }
}

export async function createClaim({ name, itemsPermission, description }) {
  const iamClaim = new IamClaimSchema({
    name: name,
    description: description,
    itemsPermission: [...itemsPermission],
  });
  const data = await iamClaim.save(iamClaim);
  return data;
}

export async function getClaimByValue({ value }) {
  const result = await IamClaimSchema.findOne({ value: value }).exec();
  return result;
}

export async function getAllClaimByIds({ claimIds }) {
  const result = await IamClaimSchema.find({
    _id: {
      $in: claimIds,
    },
  });
  return result;
}

export async function getAllClaims() {
  const result = await IamClaimSchema.find({});
  return result;
}

export async function updateClaimByClaimId({
  claimId,
  name,
  itemsPermission,
  description,
}) {
  const result = await IamClaimSchema.findByIdAndUpdate(claimId, {
    name: name,
    description: description,
    itemsPermission: [...itemsPermission],
  });
  return result;
}
