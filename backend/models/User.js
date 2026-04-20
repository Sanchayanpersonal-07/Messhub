import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "manager", "warden"],
      required: true,
    },

    // Student only fields
    roll_number: { type: String, unique: true, sparse: true },
    department: String,
    year: Number,
    room_number: String,
    phone: String,

    // WebAuthn fields
    webauthn_credential: {
      id: { type: String, default: null }, // base64url credential ID
      publicKey: { type: String, default: null }, // base64 encoded public key
      counter: { type: Number, default: 0 },
      transports: [{ type: String }], // ["internal", "hybrid" ...]
      registered_at: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);
