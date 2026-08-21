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
  res.render('admissions', { title: 'Admissions', info, exams });
});

router.get('/achievements', async (req, res) => {
  const achievements = await getContent('achievements_info', 'PLACEHOLDER: Awards, notable alumni, and academic or sports wins.');
  res.render('achievements', { title: 'Achievements', achievements });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

router.get('/news', async (req, res) => {
  const news = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });
  res.render('news', { title: 'News & Updates', news });
});

router.get('/news/:slug', async (req, res) => {
  const post = await prisma.newsPost.findUnique({
    where: { slug: req.params.slug },
    include: { author: true },
  });
  if (!post || !post.published) {
    req.flash('error', 'That news post could not be found.');
    return res.redirect('/news');
  }
  res.render('news-post', { title: post.title, post });
});

router.get('/events', async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  res.render('events', { title: 'Events & Reunions', events });
});

// ---- Alumni directory (visible to logged-in alumni only) ----
router.get('/alumni', requireLogin, async (req, res) => {
  const alumni = await prisma.user.findMany({
    where: { status: 'APPROVED' },
    orderBy: { gradYear: 'desc' },
  });
  const whatsappLink = await getContent('whatsapp_group_link', '');
  res.render('alumni', { title: 'Alumni Directory', alumni, whatsappLink });
});

// ---- Edit my own profile (photo, phone, occupation, etc.) ----
router.get('/profile', requireLogin, (req, res) => {
  res.render('profile', { title: 'My Profile' });
});

router.post('/profile', requireLogin, upload.single('photo'), async (req, res) => {
  const { occupation, location, phone, gradYear, bio } = req.body;

  const data = {
    occupation: occupation || null,
    location: location || null,
    phone: phone || null,
    bio: bio || null,
    gradYear: gradYear ? parseInt(gradYear, 10) : null,
  };

  if (req.file) {
    data.photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  await prisma.user.update({ where: { id: req.session.userId }, data });
  req.flash('success', 'Profile updated.');
  res.redirect('/profile');
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('images are allowed'))) {
    req.flash('error', err.message === 'File too large' ? 'That image is too large — please use one under 2MB.' : err.message);
    return res.redirect('/profile');
  }
  next(err);
});

module.exports = router;