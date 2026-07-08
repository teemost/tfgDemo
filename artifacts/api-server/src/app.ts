import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { setupAuth } from "./auth/localAuth";
import { logger } from "./lib/logger";
import router from "./routes";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await setupAuth(app);

app.use("/api", router);

export default app;
