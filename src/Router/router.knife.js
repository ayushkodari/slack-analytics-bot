import { Router } from "express";
import { RevenueVsCountry } from "../Controller/controller.Knife.js";
export const router = Router();

router.post("/knife-RevenueVsCountry",RevenueVsCountry);
