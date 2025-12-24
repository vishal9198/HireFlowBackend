import express from "express";
import { ENV } from "./lib/env.js";
import path from "path";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import { inngest, functions } from "./lib/inngest.js";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
const app = express();

const __dirname = path.resolve();

// middleware
app.use(express.json());

//credential true means server allows browswer to send cookies along with requests
// origin is front end url where our front end is hosted

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

app.use(clerkMiddleware()); //this adds auth field to req object//you can call req.auth to get auth info about user

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/chat", chatRoutes);

app.use("/api/sessions", sessionRoutes);

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

//make our app ready for deployment if fromtend and backend are deployed on same deployment platform

if (ENV.NODE_ENV === "production") {
  //create a single server for both frontend and backend used when both deployaing on same server(sevalla) if front end and backend are deployed on different servers(frontend on vercel and backend on railway,render) then this is not required (so keep node_env as development in that case)
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
