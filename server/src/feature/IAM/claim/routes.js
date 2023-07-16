import { Router } from "express";
import {
  addClaim_controller,
  getAllClaims_controller,
  updateClaim_controller,
} from "./controller.js";

export async function iamClaimRoutes(app) {
  const router = Router();
  router.get("/", getAllClaims_controller);
  router.post("/add", addClaim_controller);
  router.patch("/:claimId", updateClaim_controller);
  app.use("/api/v1/iam-claim", router);
}
