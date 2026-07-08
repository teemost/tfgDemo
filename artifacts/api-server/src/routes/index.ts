import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import plansRouter from "./plans";
import dashboardRouter from "./dashboard";
import investmentsRouter from "./investments";
import walletsRouter from "./wallets";
import depositsRouter from "./deposits";
import withdrawalsRouter from "./withdrawals";
import transactionsRouter from "./transactions";
import kycRouter from "./kyc";
import referralsRouter from "./referrals";
import notificationsRouter from "./notifications";
import marketRouter from "./market";
import supportRouter from "./support";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(plansRouter);
router.use(dashboardRouter);
router.use(investmentsRouter);
router.use(walletsRouter);
router.use(depositsRouter);
router.use(withdrawalsRouter);
router.use(transactionsRouter);
router.use(kycRouter);
router.use(referralsRouter);
router.use(notificationsRouter);
router.use(marketRouter);
router.use(supportRouter);
router.use(adminRouter);

export default router;
