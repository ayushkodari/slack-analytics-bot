import { Router } from "express";
import { RevenueVsCountry,SummaryMonthly } from "../Controller/controller.Knife.js";
export const router = Router();

router.post("/knife-RevenueVsCountry",RevenueVsCountry);
router.post("/knife-Summary-monthly",SummaryMonthly);