import twilio from "twilio";

export const getTurnCredentials = async (req, res) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.error("other client:", client);

    const token = await client.tokens.create();

    res.json({
      iceServers: token.iceServers
    });

  } catch (error) {
    console.error("TURN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to get TURN credentials" });
  }
};
