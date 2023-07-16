import IamItemSchema from "./schema.js";
import mongoose from "mongoose";

export async function createIamItemIfNotExist({ name, value, description }) {
  const result = await IamItemSchema.findOne({ value: value }).exec();
  console.log("createIamItemIfNotExist Result : ", result);
  if (result?.data?._id) {
    return result.data;
  } else {
    const iamItem = new IamItemSchema({
      name: name,
      value: _value,
      description: description,
    });
    const data = await iamItem.save(iamItem);
    return data;
  }
}

export async function getAllIamItemsByIds({ itemIds }) {
  const result = await IamItemSchema.find({
    _id: {
      $in: itemIds,
    },
  });
  return result;
}

export async function createIamItem({ name, value, description }) {
  const iamItem = new IamItemSchema({
    name: name,
    value: value,
    description: description,
  });
  const data = await iamItem.save(iamItem);
  return data;
}

export async function getAllIamItems() {
  const result = await IamItemSchema.find({});
  return result;
}

export async function updateIamItemById({
  iamItemId,
  name,
  value,
  description,
}) {
  const result = await IamItemSchema.findByIdAndUpdate(iamItemId, {
    name: name,
    value: value,
    description: description,
  });
  return result;
}
