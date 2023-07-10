import { logError } from "../../services/error";
import {
  getPassportDetailsThroughScan,
  saveTouristPassportDetails,
  verifyEnteredPassportDetails,
} from "./repository";

export async function getItemsFromPlanet_controller(request, response) {
  try {
    const result = await getPassportDetailsThroughScan();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
