import { Router } from "express";
import {
  addIamItem_controller,
  getAllIamItems_controller,
  updateIamItem_controller,
} from "./controller.js";

export async function iamItemRoutes(app) {
  const router = Router();
  router.get("/", getAllIamItems_controller);
  router.post("/add", addIamItem_controller);
  router.patch("/:itemId", updateIamItem_controller);
  app.use("/api/v1/iam-item", router);
}
