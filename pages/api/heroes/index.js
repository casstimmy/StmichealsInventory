import { mongooseConnect } from "@/lib/mongodb";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    if (req.method === "GET") {
      const heroes = await Hero.find().sort({ order: 1, createdAt: -1 });
      return res.json(heroes);
    }

    if (req.method === "POST") {
      const { title, subtitle, image, bgImage, ctaText, ctaLink, order, status } = req.body;

      if (!title || !Array.isArray(image) || image.length === 0 || !image[0]?.full || !image[0]?.thumb) {
        return res.status(400).json({ error: "Title and at least one Hero Image (full + thumb) are required" });
      }

      if (Array.isArray(bgImage) && bgImage.length > 0 && (!bgImage[0]?.full || !bgImage[0]?.thumb)) {
        return res.status(400).json({ error: "Background image must include full + thumb" });
      }

      const hero = await Hero.create({ title, subtitle, image, bgImage, ctaText, ctaLink, order, status });
      return res.status(201).json(hero);
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("Hero API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

