import { Router } from "express";
import { RevenueVsCountry,SummaryMonthly,Summary } from "../Controller/controller.Knife.js";
export const router = Router();

router.post("/knife-RevenueVsCountry",RevenueVsCountry);
router.post("/knife-Summary-monthly",SummaryMonthly);
router.post("/knife-summary-options",Summary);