import { Router } from "express";
import path from "path";
import { HTML_FILES_PATH } from "../config";
import { texts } from "../data";

const router = Router();

router.get("/", (req, res) => {
  const page = path.join(HTML_FILES_PATH, "game.html");
  res.sendFile(page);
});

router.get("/texts/:id", (req, res) => {
  const { id } = req.params;
  const text = texts[id];
  if (!text) {
    res.status(404).json({ error: "text not found" });
  } else {
    res.status(200).json({ text: texts[id] });
  }
});

export default router;
