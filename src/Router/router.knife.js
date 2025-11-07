import { Router } from "express";
import { RevenueVsCountry,SummaryMonthly,Summary, SummaryWeekly,DetailedSummary } from "../Controller/controller.Knife.js";
export const router = Router();

router.post("/knife-RevenueVsCountry",RevenueVsCountry);
router.post("/knife-Summary-monthly",SummaryMonthly);
router.post("/knife-Summary-weekly",SummaryWeekly);


router.post("/knife-summary-options",Summary);
router.post("/knife_detailed_summary",DetailedSummary);
