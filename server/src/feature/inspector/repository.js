import InspectorSchema from "./schema.js";

export async function createRootInspector(value) {
  const { name, dob, email, phoneNumber } = value;
  const inspector = new InspectorSchema({
    name: name,
    dob: dob,
    email: email,
    phoneNumber: phoneNumber,
  });
  const data = await inspector.save(inspector);
  return data;
}

export async function createInspector({
  name,
  dob,
  email,
  phoneNumber,
  reportingManager,
  externalId,
  employeeId,
}) {
  const inspector = new InspectorSchema({
    name: name,
    dob: dob,
    email: email,
    phoneNumber: phoneNumber,
    reportingManager: reportingManager,
    externalId: externalId,
    employeeId: employeeId,
  });
  const data = await inspector.save(inspector);
  return data;
}

export async function findInspectorByEmail({ email }) {
  const result = await InspectorSchema.findOne({ email: email }).exec();
  return result;
}

export async function findInspectorProfilesByUserId({ userIds }) {
  const result = await InspectorSchema.find({
    _id: {
      $in: userIds,
    },
  });
  return result;
}

export async function getAllInspectorsProfileByPagination({
  size,
  updatedOnBefore,
}) {
  let isPageOne = false;
  console.log("updatedOnBefore : ", updatedOnBefore);
  // "lastRecordUpdatedDate" : "2023-07-15T13:58:50.427Z"
  if (typeof updatedOnBefore !== "string") {
    isPageOne = true;
    const firstInspectorProfileDocument = await InspectorSchema.find()
      .limit(1)
      .sort({ updatedAt: -1 });
    updatedOnBefore = firstInspectorProfileDocument[0].updatedAt;
    console.log(
      "firstInspectorProfileDocument : ",
      firstInspectorProfileDocument
    );
  }
  console.log("isPageOne : ", isPageOne);

  const QUERY = isPageOne
    ? { $lte: updatedOnBefore }
    : { $gt: updatedOnBefore };
  console.log("QUERY : ", QUERY);
  const result = await InspectorSchema.find({
    updatedAt: { ...QUERY },
  })
    .limit(size)
    .sort({ updatedAt: -1 });

  return result;
}
