import mongoose, { Schema, models } from "mongoose";



const HeroSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image:  [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],
    bgImage: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],
    ctaText: { type: String },
    ctaLink: { type: String },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Hero = models.Hero || mongoose.model("Hero", HeroSchema);

export default Hero;
