// functions/index.js
// Polyfill the browser File constructor in Node
const { File } = require("node:buffer");
globalThis.File = File;

// functions/index.js
const functions = require("firebase-functions/v1");
const admin     = require("firebase-admin");
const fetch     = require("node-fetch");
const fs        = require("fs");
const os        = require("os");
const path      = require("path");
const OpenAI    = require("openai");

admin.initializeApp();

// Use your stored OpenAI key
const openai = new OpenAI({
  apiKey: functions.config().openai.key
});

exports.transcribeSession = functions
  .firestore
  .document("sessions/{sessionId}")
  .onCreate(async (snap, context) => {
    const { audioURL } = snap.data();
    const sessionId    = context.params.sessionId;

    try {
      // 1. Download audio
      const res = await fetch(audioURL);
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
      const buffer = await res.buffer();

      // 2. Write to temp file
      const tmpPath = path.join(os.tmpdir(), `${sessionId}.mp3`);
      fs.writeFileSync(tmpPath, buffer);

      // 3. Send to Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: "whisper-1",
        response_format: "text"
      });
      const text = typeof transcription === "string"
        ? transcription
        : transcription.text || transcription;

      // 4. Save transcript to Firestore
      await snap.ref.update({
        transcript:    text,
        transcribedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`📝 Session ${sessionId} transcribed.`);
      fs.unlinkSync(tmpPath);
    } catch (err) {
      console.error("❌ Transcription error:", err);
      await snap.ref.update({ transcriptionError: err.message });
    }
  });

  /**
 * Callable function to generate a summary and extract structured data
 * for a given session transcript.
 */
exports.generateSummary = functions.https.onCall(async (data, context) => {
  const sessionId = data.sessionId;
  if (!sessionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing sessionId"
    );
  }

  const sessionRef = admin.firestore().collection("sessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      `Session ${sessionId} not found`
    );
  }

  const { transcript } = sessionSnap.data();
  if (!transcript) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Transcript not available yet"
    );
  }

  try {
    // Call GPT-4 for summary + extraction
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a D&D campaign assistant. " +
                   "Extract a session summary and all relevant structured data " +
                   "from the transcript."
        },
        {
          role: "user",
          content:
            "Here is the transcript of a D&D session:\n\n" +
            transcript +
            "\n\n" +
            "Please return ONLY a single JSON object with these keys:\n" +
            "• summary: a short narrative of major events\n" +
            "• events: array of { title, summary }\n" +
            "• locations: array of { name, description }\n" +
            "• characters: array of { name, type }\n" +
            "• npcs: array of { name, role }\n" +
            "• factions: array of { name, goals }\n" +
            "• quests: array of { title, description, objectives[], status, participants[] }\n" +
            "• relationships: array of { source, target, type }\n"
        }
      ]
    });

    // Parse the JSON out of the response
    let payload;
    try {
      payload = JSON.parse(completion.choices[0].message.content);
    } catch {
      // Fallback: extract the first JSON-like block
      const match = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
      payload = match ? JSON.parse(match[0]) : {};
    }

    // Update the session document with summary & extracted data
    await sessionRef.update(payload);

    return { success: true };
  } catch (err) {
    console.error("generateSummary error:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
