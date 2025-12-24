import { StreamChat } from "stream-chat";
import { ENV } from "./env.js";
import { StreamClient } from "@stream-io/node-sdk";
const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Stream API key and secret is missing");
}

export const streamClient = new StreamClient(apiKey, apiSecret); //this for video calling

export const chatClient = StreamChat.getInstance(apiKey, apiSecret); //this is for chat
//now chat client is going to interact with Stream application

//upsert means create and update data below is function for interact with stream

export const upsertStreamUser = async (userData) => {
  try {
    await chatClient.upsertUser(userData);
    console.log("Stream User upserted successfully:", userData);
  } catch (error) {
    console.error("Error upserting Stream User:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await chatClient.deleteUser(userId);
    console.log("Stream User deleted successfully:", userId);
  } catch (error) {
    console.error("Error deleting Stream User:", error);
  }
};
