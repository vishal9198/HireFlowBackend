import express from "express";
import { ENV } from "./lib/env.js";
import path from "path";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import { inngest, functions } from "./lib/inngest.js";
import { serve } from "inngest/express";

const app = express();

const __dirname = path.resolve();

// middleware
app.use(express.json());

//credential true means server allows browswer to send cookies along with requests
// origin is front end url where our front end is hosted

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/health", (req, res) => {
  res.status(200).json({
    msg: "success from health route",
  });
});

app.get("/books", (req, res) => {
  res.status(200).json({
    msg: "success from books route",
  });
});

//make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log("server is running on port:", ENV.PORT);
    });
  } catch (error) {
    console.log("Error in starting the server", error);
  }
};
startServer();
