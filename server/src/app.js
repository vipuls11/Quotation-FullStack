import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import userRoutes from './routes/invoice.routes.js';

const app = express();
const router = express.Router();
app.disable("x-powered-by");

app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// app.use(
//   "/api",
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     limit: 200,
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok" });
// });
// Register router
app.use("/api/invoices", userRoutes);
// Register authentication, quotation and invoice routes here.

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

export default app;