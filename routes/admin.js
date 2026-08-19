const express = require('express');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin); // every route below requires an admin session

// ---- Dashboard ----
router.get('/', async (req, res) => {
  const pendingCount = await prisma.user.count({ where: { status: 'PENDING' } });
  const alumniCount = await prisma.user.count({ where: { status: 'APPROVED' } });
  const newsCount = await prisma.newsPost.count();
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    pendingCount,
    alumniCount,
    newsCount,
    layout: false,
  });
});

// ---- Alumni approvals ----
router.get('/alumni-requests', async (req, res) => {
  const pending = await prisma.user.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' } });
  res.render('admin/alumni-requests', { title: 'Pending Alumni Requests', pending });
});

router.post('/alumni-requests/:id/approve', async (req, res) => {
  await prisma.user.update({ where: { id: parseInt(req.params.id, 10) }, data: { status: 'APPROVED' } });
  req.flash('success', 'Alumni request approved.');
  res.redirect('/admin/alumni-requests');
});

router.post('/alumni-requests/:id/reject', async (req, res) => {
  await prisma.user.update({ where: { id: parseInt(req.params.id, 10) }, data: { status: 'REJECTED' } });
  req.flash('success', 'Alumni request rejected.');
  res.redirect('/admin/alumni-requests');
});

// ---- Promote another alumnus to admin ----
router.get('/manage-admins', async (req, res) => {
  const alumni = await prisma.user.findMany({ where: { status: 'APPROVED' }, orderBy: { fullName: 'asc' } });
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: { fullName: 'asc' } });
  res.render('admin/manage-admins', { title: 'Manage Admins', alumni, admins });
});

router.post('/manage-admins/:id/promote', async (req, res) => {
  await prisma.user.update({ where: { id: parseInt(req.params.id, 10) }, data: { role: 'ADMIN' } });
  req.flash('success', 'User promoted to admin.');
  res.redirect('/admin/manage-admins');
});

router.post('/manage-admins/:id/demote', async (req, res) => {
  if (parseInt(req.params.id, 10) === req.session.userId) {
    req.flash('error', "You can't demote yourself.");
    return res.redirect('/admin/manage-admins');
  }
  await prisma.user.update({ where: { id: parseInt(req.params.id, 10) }, data: { role: 'ALUMNUS' } });
  req.flash('success', 'Admin access removed.');
  res.redirect('/admin/manage-admins');
});

// ---- News management ----
router.get('/news', async (req, res) => {
  const news = await prisma.newsPost.findMany({ orderBy: { createdAt: 'desc' } });
  res.render('admin/news-list', { title: 'Manage News', news });
});

router.get('/news/new', (req, res) => {
  res.render('admin/news-form', { title: 'New Post', post: null });
});

router.post('/news', async (req, res) => {
  const { title, body, published } = req.body;
  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  await prisma.newsPost.create({
    data: {
      title,
      slug,
      body,
      published: published === 'on',
      authorId: req.session.userId,
    },
  });
  req.flash('success', 'News post published.');
  res.redirect('/admin/news');
});

router.get('/news/:id/edit', async (req, res) => {
  const post = await prisma.newsPost.findUnique({ where: { id: parseInt(req.params.id, 10) } });
  if (!post) {
    req.flash('error', 'Post not found.');
    return res.redirect('/admin/news');
  }
  res.render('admin/news-form', { title: 'Edit Post', post });
});

router.post('/news/:id/edit', async (req, res) => {
  const { title, body, published } = req.body;
  await prisma.newsPost.update({
    where: { id: parseInt(req.params.id, 10) },
    data: { title, body, published: published === 'on' },
  });
  req.flash('success', 'News post updated.');
  res.redirect('/admin/news');
});

router.post('/news/:id/delete', async (req, res) => {
  await prisma.newsPost.delete({ where: { id: parseInt(req.params.id, 10) } });
  req.flash('success', 'News post deleted.');
  res.redirect('/admin/news');
});

// ---- Events ----
router.get('/events', async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  res.render('admin/events-list', { title: 'Manage Events', events });
});

router.post('/events', async (req, res) => {
  const { title, description, location, startsAt } = req.body;
  await prisma.event.create({
    data: { title, description, location, startsAt: new Date(startsAt) },
  });
  req.flash('success', 'Event added.');
  res.redirect('/admin/events');
});

router.post('/events/:id/delete', async (req, res) => {
  await prisma.event.delete({ where: { id: parseInt(req.params.id, 10) } });
  req.flash('success', 'Event removed.');
  res.redirect('/admin/events');
});

// ---- Editable site content (About, Founder, Admissions, Exams, Achievements) ----
router.get('/content', async (req, res) => {
  const keys = ['about_history', 'about_mission', 'founder_bio', 'admissions_info', 'exams_info', 'achievements_info'];
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  const content = {};
  keys.forEach((k) => {
    const row = rows.find((r) => r.key === k);
    content[k] = row ? row.value : '';
  });
  res.render('admin/content-editor', { title: 'Edit Site Content', content });
});

router.post('/content', async (req, res) => {
  const keys = ['about_history', 'about_mission', 'founder_bio', 'admissions_info', 'exams_info', 'achievements_info'];
  for (const key of keys) {
    if (req.body[key] !== undefined) {
      await prisma.siteContent.upsert({
        where: { key },
        update: { value: req.body[key] },
        create: { key, value: req.body[key] },
      });
    }
  }
  req.flash('success', 'Site content updated.');
  res.redirect('/admin/content');
});

module.exports = router;
