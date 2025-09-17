import { Router } from "express";
import {
  generateEventRequestPdfHandler,
  getEventRequestPdfInfo,
} from "./event-request";
import { postCalendarPdfHandler, getCalendarPdfInfo } from "./calendar";

const router = Router();

// Event Request PDF routes
router.post("/event-request", generateEventRequestPdfHandler);
router.get("/event-request", getEventRequestPdfInfo);

// Calendar PDF routes
router.get("/calendar", getCalendarPdfInfo);
router.post("/calendar", postCalendarPdfHandler);

export default router;
