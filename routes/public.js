const express = require('express');
const multer = require('multer');
const prisma = require('../lib/prisma');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
    }
  },
});

// Helper: fetch editable content blocks by key, falling back to placeholder text
// so the site never shows a blank section before real content is added.
async function getContent(key, fallback) {
  const row = await prisma.siteContent.findUnique({ where: { key } });
  return row ? row.value : fallback;
}

router.get('/', async (req, res) => {
  const news = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { author: true },
  });
  const upcomingEvents = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: 'asc' },
    take: 3,
  });
  res.render('home', {
    title: 'Ajoshe Model College',
    news,
    upcomingEvents,
  });
});

router.get('/about', async (req, res) => {
  const history = await getContent('about_history', 'PLACEHOLDER: The story of Ajoshe Model College — when it was founded, how it grew, and what it stands for. Send this over and it goes right here.');
  const mission = await getContent('about_mission', 'PLACEHOLDER: The school\'s mission and values.');
  res.render('about', { title: 'About AMC', history, mission });
});

router.get('/founder', async (req, res) => {
  const bio = await getContent('founder_bio', 'PLACEHOLDER: The founder\'s story — name, background, and vision for the school.');
  res.render('founder', { title: 'Our Founder', bio });
});

router.get('/admissions', async (req, res) => {
  const info = await getContent('admissions_info', 'PLACEHOLDER: Admission requirements, process, and intake periods.');
  const exams = await getContent('exams_info', 'PLACEHOLDER: External exams the school prepares students for (WAEC, NECO, JAMB, etc.) and notable results.');