import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import {
  isMealWindowOpen,
  getMealWindowInfo,
} from "../utils/mealTimeWindow.js";

const RP_NAME = "MessHub IIITG";
const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

// In-memory challenge store (userId → challenge)
const challengeStore = new Map();

export const getWebAuthnStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("webauthn_credential")
      .lean();
    res.json({
      registered: !!user?.webauthn_credential?.id,
      registered_at: user?.webauthn_credential?.registered_at || null,
    });
  } catch (err) {
    next(err);
  }
};

export const getRegistrationOptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("name email webauthn_credential")
      .lean();
    if (!user) return res.status(404).json({ msg: "User not found" });

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
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "discouraged",
      },
      excludeCredentials,
    });

    challengeStore.set(userId, options.challenge);
    res.json(options);
  } catch (err) {
    next(err);
  }
};

export const verifyRegistration = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge)
      return res
        .status(400)
        .json({ msg: "Challenge expired — please try again." });

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: req.body,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (e) {
      return res
        .status(400)
        .json({ msg: "Fingerprint registration failed. Try again." });
    }

    if (!verification.verified || !verification.registrationInfo)
      return res.status(400).json({ msg: "Fingerprint verification failed." });

    const { credential } = verification.registrationInfo;
    await User.findByIdAndUpdate(userId, {
      webauthn_credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        transports: req.body.response?.transports || [],
        registered_at: new Date(),
      },
    });

    challengeStore.delete(userId);
    res.json({ msg: "Fingerprint registered successfully!" });
  } catch (err) {
    next(err);
  }
};

export const getAuthOptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("webauthn_credential")
      .lean();
    if (!user?.webauthn_credential?.id)
      return res.status(400).json({ msg: "No fingerprint registered." });

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

export const verifyAuthAndMark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { meal_type, authResponse } = req.body;

    if (!meal_type) return res.status(400).json({ msg: "meal_type required" });
    if (!["breakfast", "lunch", "dinner"].includes(meal_type))
      return res.status(400).json({ msg: "Invalid meal type" });

    // ✅ Time window check — fingerprint verify হওয়ার আগেই
    if (!isMealWindowOpen(meal_type)) {
      const info = getMealWindowInfo(meal_type);
      const label = meal_type.charAt(0).toUpperCase() + meal_type.slice(1);
      return res.status(400).json({
        msg: `${label} attendance window is closed. Open: ${info.openAt} – ${info.closeAt}.`,
        window: info,
      });
    }

    const expectedChallenge = challengeStore.get(userId);
    if (!expectedChallenge)
      return res
        .status(400)
        .json({ msg: "Challenge expired — please try scanning again." });

    const user = await User.findById(userId)
      .select("webauthn_credential")
      .lean();
    if (!user?.webauthn_credential?.id)
      return res.status(400).json({ msg: "No fingerprint registered." });

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
    } catch {
      return res
        .status(401)
        .json({ msg: "Fingerprint not recognized. Try again." });
    }

    if (!verification.verified)
      return res.status(401).json({ msg: "Fingerprint verification failed." });

    await User.findByIdAndUpdate(userId, {
      "webauthn_credential.counter": verification.authenticationInfo.newCounter,
    });
    challengeStore.delete(userId);

    const today = new Date().toISOString().split("T")[0];
    const existing = await Attendance.findOne({
      student_id: userId,
      date: today,
      meal_type,
    });
    if (existing)
      return res
        .status(400)
        .json({ msg: "Attendance already marked for this meal today." });

    const attendance = await Attendance.create({
      student_id: userId,
      date: today,
      meal_type,
      fingerprint_verified: true,
      source: "fingerprint",
      scan_time: new Date(),
    });

    const label = meal_type.charAt(0).toUpperCase() + meal_type.slice(1);
    res.status(201).json({ msg: `${label} attendance marked!`, attendance });
  } catch (err) {
    next(err);
  }
};
