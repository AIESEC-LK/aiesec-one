import mongoose, { Schema } from "mongoose";

const resourceSchema = new Schema({
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
  functions: {
    type: Array<String>
  },
  keywords: {
    type: Array<String>
  },
  officeId: {
    type: String,
    required: true
  }
});

export default mongoose.models.Resource ||
  mongoose.model("Resource", resourceSchema);
