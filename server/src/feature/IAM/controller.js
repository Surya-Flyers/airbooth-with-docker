import { logError } from "../../services/error";

const getPassportDetailsThroughScan = (async = () => {});
const saveTouristPassportDetails = (async = () => {});
const verifyEnteredPassportDetails = (async = () => {});

export async function createIamItem_controller(request, response) {
  try {
    const result = await getPassportDetailsThroughScan();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function createRole_controller(request, response) {
  try {
    const result = await getPassportDetailsThroughScan();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function editRole_controller(request, response) {
  try {
    const result = await getPassportDetailsThroughScan();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function createGroupedRoles_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function editGroupedRoles_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function createIamUser_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function updateIamUser_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function editGroupedRoles_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function resetPassword_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function forgotPassword_controller(request, response) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
