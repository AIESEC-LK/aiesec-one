import mongoose, { Schema } from "mongoose";

const opportunitySchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  originalUrl: {
    type: String,
    unique: true
  },
  shortLink: {
    type: String,
    required: true,
    unique: true
  },
  coverImageUrl: {
    type: String
  },
  deadline: {
    type: String,
    required: true
  },
  officeId: {
    type: String,
    required: true
  }
});

export default mongoose.models.Opportunity ||
  mongoose.model("Opportunity", opportunitySchema);
