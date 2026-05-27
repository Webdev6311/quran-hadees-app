import express from "express";
import {
  getBukhariChapters,
  getBukhariHadithsByChapter,
  getBukhariHadithById,
  getMuslimChapters,
  getMuslimHadithsByChapter,
  getMuslimHadithById,
  getTirmidhiChapters,
  getTirmidhiHadithsByChapter,
  getTirmidhiHadithById,
  getAbuDawudChapters,
  getAbuDawudHadithsByChapter,
  getAbuDawudHadithById,
  getNasaiChapters,
  getNasaiHadithsByChapter,
  getNasaiHadithById,
  getIbnMajahChapters,
  getIbnMajahHadithsByChapter,
  getIbnMajahHadithById,
  searchHadithAcrossBooks,
} from "../controllers/hadithController.js";

const router = express.Router();

router.get("/search", searchHadithAcrossBooks);
router.get("/bukhari/chapters", getBukhariChapters);
router.get("/bukhari/hadiths", getBukhariHadithsByChapter);
router.get("/bukhari/hadiths/:id", getBukhariHadithById);
router.get("/muslim/chapters", getMuslimChapters);
router.get("/muslim/hadiths", getMuslimHadithsByChapter);
router.get("/muslim/hadiths/:id", getMuslimHadithById);
router.get("/tirmidhi/chapters", getTirmidhiChapters);
router.get("/tirmidhi/hadiths", getTirmidhiHadithsByChapter);
router.get("/tirmidhi/hadiths/:id", getTirmidhiHadithById);
router.get("/abudawud/chapters", getAbuDawudChapters);
router.get("/abudawud/hadiths", getAbuDawudHadithsByChapter);
router.get("/abudawud/hadiths/:id", getAbuDawudHadithById);
router.get("/nasai/chapters", getNasaiChapters);
router.get("/nasai/hadiths", getNasaiHadithsByChapter);
router.get("/nasai/hadiths/:id", getNasaiHadithById);
router.get("/ibnmajah/chapters", getIbnMajahChapters);
router.get("/ibnmajah/hadiths", getIbnMajahHadithsByChapter);
router.get("/ibnmajah/hadiths/:id", getIbnMajahHadithById);

export default router;

