import express from "express";
import {
  stkPushController,
  mpesaCallbackController,
} from "./mpesa.controller";

const router = express.Router();

router.post("/stk-push", stkPushController);
router.post("/callback", mpesaCallbackController);

export default router;