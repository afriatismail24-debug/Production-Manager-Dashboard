import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import workspaceRouter from "./workspace.js";
import chefsRouter from "./chefs.js";
import sessionsRouter from "./sessions.js";
import productionsRouter from "./productions.js";
import problemsRouter from "./problems.js";
import objectivesRouter from "./objectives.js";
import remindersRouter from "./reminders.js";
import callsRouter from "./calls.js";
import syncRouter from "./sync.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspaceRouter);
router.use(chefsRouter);
router.use(sessionsRouter);
router.use(productionsRouter);
router.use(problemsRouter);
router.use(objectivesRouter);
router.use(remindersRouter);
router.use(callsRouter);
router.use(syncRouter);

export default router;
