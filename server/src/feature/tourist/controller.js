import { logError } from "../../services/error";
import {
  getPassportDetailsThroughScan,
  saveTouristPassportDetails,
  verifyEnteredPassportDetails,
} from "./repository";

export async function passportDetailsThroughScan_controller(request, response) {
  try {
    const result = await getPassportDetailsThroughScan();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function verifyEnteredPassportDetails_controller(
  request,
  response
) {
  try {
    const result = await verifyEnteredPassportDetails();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function saveTouristPassportDetails_controller(request, response) {
  try {
    const { passportNumber, dob, phoneNumber, name } = request.body;

    const { data } = await saveTouristPassportDetails({
      passportNumber,
      dob,
      phoneNumber,
      name,
    });
    response.json(data);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
