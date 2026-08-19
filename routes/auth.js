const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = express.Router();

// ---- Sign up (alumni self-registration) ----
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Join the Alumni Directory' });
});

router.post('/signup', async (req, res) => {
  const { fullName, email, password, confirmPassword, gradYear, occupation, location } = req.body;

  if (!fullName || !email || !password) {
    req.flash('error', 'Full name, email, and password are required.');
    return res.redirect('/signup');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }
  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters.');
    return res.redirect('/signup');
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    req.flash('error', 'An account with that email already exists. Try logging in instead.');
    return res.redirect('/login');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      gradYear: gradYear ? parseInt(gradYear, 10) : null,
      occupation: occupation || null,
      location: location || null,
      // role defaults to ALUMNUS, status defaults to PENDING — see schema.prisma
    },
  });

  req.flash('success', "Thanks for signing up! Your profile will appear in the directory once an admin approves it.");
  res.redirect('/login');
});

// ---- Log in ----
router.get('/login', (req, res) => {
  res.render('login', { title: 'Log In' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
  if (!user) {
    req.flash('error', 'No account found with that email.');
    return res.redirect('/login');
  }

  const valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) {
    req.flash('error', 'Incorrect password.');
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.flash('success', `Welcome back, ${user.fullName.split(' ')[0]}!`);

  if (user.role === 'ADMIN') {
    return res.redirect('/admin');
  }
  res.redirect('/alumni');
});

// ---- Log out ----
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
