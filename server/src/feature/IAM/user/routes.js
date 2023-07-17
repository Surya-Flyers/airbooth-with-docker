import { Router } from "express";
import {
  createInspectorAccount_controller,
  createRootUser_controller,
  getAllInspectorsIamProfile_controller,
  loginIamUser_controller,
  resetInspectorAccountPassword_controller,
  updateClaimsOfInspector_controller,
  verifyInspectorAccountAndSetNewPassword_controller,
  verifyRootUserAndSetNewPassword_controller,
} from "./controller.js";
import { iamAuthMiddleware } from "../middlewares/iamAuthMiddleware.js";

export async function userRoutes(app) {
  const router = Router();
  router.post("/create-root-user", createRootUser_controller);
  router.post(
    "/verify-set-new-password-root",
    verifyRootUserAndSetNewPassword_controller
  );
  router.get("/login", iamAuthMiddleware, loginIamUser_controller);
  router.post("/create-inspector-account", createInspectorAccount_controller);
  router.patch(
    "/verify-inspector-account-set-new-password/:email",
    verifyInspectorAccountAndSetNewPassword_controller
  );
  router.patch(
    "/reset-inspector-account-password/:email",
    resetInspectorAccountPassword_controller
  );
  router.patch(
    "/update-claims-of-inspector/:email",
    updateClaimsOfInspector_controller
  );
  router.get("/", getAllInspectorsIamProfile_controller);
  app.use("/api/v1/iam-user", router);
}
