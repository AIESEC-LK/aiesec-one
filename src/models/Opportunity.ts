import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "@/app/lib/constants";

const opportunitySchema = new Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    unique: true
  },
  description: String,
  link: {
    type: String,
    required: true,
    unique: true
  },
  functions: {
    type: Array<String>,
    required: true
  },
  keywords: {
    type: Array<String>,
    required: true
  }
});

export default mongoose.models.Opportunity ||
  mongoose.model("Opportunity", opportunitySchema);