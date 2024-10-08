import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "@/lib/constants";

const UserSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true },
    image: String,
    role: String,
    entity: String
  },
  {
    collection: COLLECTIONS.USERS
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
