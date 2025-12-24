import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({
        message: "Problems and difficulty must be required",
      });
    }
    //generate a unique call id for streaming
    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    //create a session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });
    //create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    //chat setups
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });
    await channel.create();
    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in creating Session controllor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getActivesession controllor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getMyRecentSessions(req, res) {
  try {
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controllor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getSessionById(req, res) {
  //we are finding out a session of a particular user and host
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId");
    res.status(200).json({ session });
  } catch (error) {
    console.log("Error in getSessionById controllor:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function joinSession(req, res) {
  //since host is created session participant is joining the session
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    //check status of session
    if (session.status !== "active") {
      return res
        .status(400)
        .json({ message: "cannot join a completed session" });
    }

    //host can not join their own session as participant
    if (session.host.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Host cannot join their own session as participant" });
    }

    //check if session is already fulled
    if (session.participant) {
      return res.status(409).json({ message: "Session is already full" });
    }
    session.participant = userId;
    await session.save();
    //add participant to stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);
    res.status(200).json({ session });

    //add participant to stream video call
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    //only host can end the session
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only host can end the session" });
    }
    //check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    //end stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    //end chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
