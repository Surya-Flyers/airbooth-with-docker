import { logError } from "../../../services/error.js";
import {
  createClaim,
  getAllClaims,
  updateClaimByClaimId,
} from "./repository.js";

export async function getAllClaims_controller(request, response) {
  try {
    const result = await getAllClaims();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function addClaim_controller(request, response) {
  try {
    const { name, itemsPermission, description } = request.body;
    const result = await createClaim({ name, itemsPermission, description });
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function updateClaim_controller(request, response) {
  try {
    const claimId = request.params.claimId;
    const { name, itemsPermission, description } = request.body;
    const result = await updateClaimByClaimId({
      claimId,
      name,
      itemsPermission,
      description,
    });
    console.log("updateClaim_controller result : ", result);
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
