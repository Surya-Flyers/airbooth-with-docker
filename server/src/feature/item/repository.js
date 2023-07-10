import { randomUUID } from "crypto";
import ItemSchema from "./schema.js";
import { ITEM_STATUS_TYPE } from "./types.js";
const ITEMS_DUMMY = [
  {
    name: "item 1",
    invoiceId: "11234567890",
    totalAmount: 50,
    currency: "AED",
    netRefund: 10,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
  {
    name: "item 2",
    invoiceId: "21234567890",
    totalAmount: 60,
    currency: "AED",
    netRefund: 20,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
  {
    name: "item 3",
    invoiceId: "31234567890",
    totalAmount: 70,
    currency: "AED",
    netRefund: 30,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
  {
    name: "item 4",
    invoiceId: "41234567890",
    totalAmount: 80,
    currency: "AED",
    netRefund: 40,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
  {
    name: "item 5",
    invoiceId: "51234567890",
    totalAmount: 90,
    currency: "AED",
    netRefund: 50,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
  {
    name: "item 6",
    invoiceId: "61234567890",
    totalAmount: 100,
    currency: "AED",
    netRefund: 10,
    status: ITEM_STATUS_TYPE.UNCHANGED,
  },
];
export const getItemsFromPlanet = async (showExisting = false) => {
  // HIT : PLANETs API to get details
  return [...ITEMS_DUMMY];
};

export const postUpdatedItemsToPlanet = async (data) => {
  // HIT : PLANETs API to verify details
  return {
    status: true,
    message: "",
  };
};

export const addItemsToDB = async (items) => {
  const _items = [...items];
  const result = await ItemSchema.insertMany(_items, function (error, docs) {});
  return result;
};

export const addCallIdToItems = async ({ touristId, callId }) => {
  const result = await ItemSchema.updateMany(
    { touristId: touristId },
    { callId: callId }
  );
  return result;
};

export const updateItem = async ({
  name,
  invoiceId,
  totalAmount,
  currency,
  netRefund,
  isApproved,
}) => {
  const item = new ItemSchema({
    name: name,
    invoiceId: invoiceId,
    totalAmount: totalAmount,
    currency: currency,
    netRefund: netRefund,
    status: isApproved ? "APPROVED" : "REJECTED",
  });
  const result = await item.save(item);
  return result;
};
