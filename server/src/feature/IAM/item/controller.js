import { logError } from "../../../services/error.js";
import {
  createIamItem,
  getAllIamItems,
  updateIamItemById,
} from "./repository.js";

export async function getAllIamItems_controller(request, response) {
  try {
    const result = await getAllIamItems();
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function addIamItem_controller(request, response) {
  try {
    const { name, value, description } = request.body;
    const result = await createIamItem({ name, value, description });
    response.json(result);
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}

export async function updateIamItem_controller(request, response) {
  try {
    const iamItemId = request.params.itemId;
    const { name, value, description } = request.body;
    const result = await updateIamItemById({
      iamItemId,
      name,
      value,
      description,
    });
    response.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logError(error);
    response.status(500).send({ error: error });
  }
}
