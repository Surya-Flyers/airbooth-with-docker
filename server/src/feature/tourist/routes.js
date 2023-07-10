import { Router } from "express";
import {
  passportDetailsThroughScan_controller,
  saveTouristPassportDetails_controller,
  verifyEnteredPassportDetails_controller,
} from "./controller";

const touristRoutes = Router();

touristRoutes.get(
  "/scan-passport-details",
  passportDetailsThroughScan_controller
);
touristRoutes.get("/verify", verifyEnteredPassportDetails_controller);
touristRoutes.post("/save", saveTouristPassportDetails_controller);

export default touristRoutes;
