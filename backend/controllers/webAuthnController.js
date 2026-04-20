import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";

/* ── Config ────────────────────────────────────────────────────────────────
   RP_ID  → browser এর domain (localhost dev এ, college domain production এ)
   ORIGIN → frontend এর URL
   .env এ set করা না থাকলে localhost default
────────────────────────────────────────────────────────────────────────── */
const RP_NAME = "MessHub IIITG";
const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

/* ── In-memory challenge store ─────────────────────────────────────────────
   userId → challenge string
   Challenge একবার use হলেই delete হয় (replay attack prevent করে)
   Demo/dev এর জন্য Map ঠিক আছে।
   Production এ Redis বা DB use করতে হবে।
────────────────────────────────────────────────────────────────────────── */
const challengeStore = new Map();

/* ─────────────────────────────────────────────────────────
   GET /attendance/webauthn/status
   Frontend check করবে fingerprint register করা আছে কিনা
───────────────────────────────────────────────────────── */
export const getWebAuthnStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("webauthn_credential")
      .lean();

    const registered = !!user?.webauthn_credential?.id;

    res.json({
      registered,
      registered_at: user?.webauthn_credential?.registered_at || null,
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/webauthn/register-options
   Step 1 of registration — browser কে options দাও
───────────────────────────────────────────────────────── */
export const getRegistrationOptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("name email webauthn_credential")
      .lean();

    if (!user) return res.status(404).json({ msg: "User not found" });

    // যদি আগে register করা থাকে — same device কে exclude করা হয়
    // (নতুন device দিয়ে re-register করা যাবে)
    const excludeCredentials = user.webauthn_credential?.id
      ? [
          {
            id: user.webauthn_credential.id,
            type: "public-key",
            transports: user.webauthn_credential.transports || [],
          },
        ]
      : [];

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(userId),
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // phone/laptop এর built-in sensor
        userVerification: "required", // fingerprint/PIN required
        residentKey: "discouraged",
      },
      excludeCredentials,
    });

    // Challenge save করো — verify step এ দরকার হবে
    challengeStore.set(userId, options.challenge);

    res.json(options);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   POST /attendance/webauthn/register-verify
   Step 2 of registration — browser এর response verify করো
───────────────────────────────────────────────────────── */
export const verifyRegistration = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expectedChallenge = challengeStore.get(userId);

    if (!expectedChallenge) {
      return res.status(400).json({
        msg: "Challenge expired — please try again.",
      });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (e) {
      console.error("WebAuthn registration verify error:", e.message);
      return res
        .status(400)
        .json({ msg: "Fingerprint registration failed. Try again." });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ msg: "Fingerprint verification failed." });
    }

    const { credential } = verification.registrationInfo;

    // Save credential to user document
    await User.findByIdAndUpdate(userId, {
      webauthn_credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        transports: req.body.response?.transports || [],
        registered_at: new Date(),
      },
    });

    // Challenge টা delete করো — replay attack prevent
    challengeStore.delete(userId);

    res.json({
      msg: "Fingerprint registered successfully! You can now use it for attendance.",
    });
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   GET /attendance/webauthn/auth-options
   Step 1 of attendance — browser কে challenge দাও
───────────────────────────────────────────────────────── */
export const getAuthOptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("webauthn_credential")
      .lean();

    if (!user?.webauthn_credential?.id) {
      return res.status(400).json({
        msg: "No fingerprint registered. Please register your fingerprint first.",
      });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [
        {
          id: user.webauthn_credential.id,
          type: "public-key",
          transports: user.webauthn_credential.transports || [],
        },
      ],
      userVerification: "required",
    });

    challengeStore.set(userId, options.challenge);

    res.json(options);
  } catch (err) {
    next(err);
  }
};

/* ─────────────────────────────────────────────────────────
   POST /attendance/webauthn/auth-verify
   Step 2 — fingerprint verify করো + attendance mark করো
   Body: { authResponse: <WebAuthn response>, meal_type: string }
───────────────────────────────────────────────────────── */
export const verifyAuthAndMark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { meal_type, authResponse } = req.body;

    if (!meal_type) {
      return res.status(400).json({ msg: "meal_type required" });
    }

    const allowedMeals = ["breakfast", "lunch", "dinner"];
    if (!allowedMeals.includes(meal_type)) {
      return res.status(400).json({ msg: "Invalid meal type" });
    }

    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge) {
      return res.status(400).json({
        msg: "Challenge expired — please try scanning again.",
      });
    }

    const user = await User.findById(userId)
      .select("webauthn_credential")
      .lean();

    if (!user?.webauthn_credential?.id) {
      return res.status(400).json({ msg: "No fingerprint registered." });
    }

    const cred = user.webauthn_credential;

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: cred.id,
          publicKey: Buffer.from(cred.publicKey, "base64"),
          counter: cred.counter,
          transports: cred.transports || [],
        },
      });
    } catch (e) {
      console.error("WebAuthn auth verify error:", e.message);
      return res
        .status(401)
        .json({ msg: "Fingerprint not recognized. Try again." });
    }

    if (!verification.verified) {
      return res.status(401).json({ msg: "Fingerprint verification failed." });
    }

    // Counter update করো — replay attack prevent করে
    await User.findByIdAndUpdate(userId, {
      "webauthn_credential.counter": verification.authenticationInfo.newCounter,
    });

    challengeStore.delete(userId);

    // Attendance mark করো
    const today = new Date().toISOString().split("T")[0];

    const existing = await Attendance.findOne({
      student_id: userId,
      date: today,
      meal_type,
    });

    if (existing) {
      return res.status(400).json({
        msg: "Attendance already marked for this meal today.",
      });
    }

    const attendance = await Attendance.create({
      student_id: userId,
      date: today,
      meal_type,
      fingerprint_verified: true,
      source: "fingerprint",
      scan_time: new Date(),
    });

    res.status(201).json({
      msg: `${meal_type.charAt(0).toUpperCase() + meal_type.slice(1)} attendance marked!`,
      attendance,
    });
  } catch (err) {
    next(err);
  }
};
