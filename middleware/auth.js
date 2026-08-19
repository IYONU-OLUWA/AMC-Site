// Route guards. Attach req.session.userId at login time (see routes/auth.js).

const prisma = require('../lib/prisma');

// Makes the logged-in user (if any) available to every view as `currentUser`.
async function loadCurrentUser(req, res, next) {
  if (req.session.userId) {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    res.locals.currentUser = user || null;
  } else {
    res.locals.currentUser = null;
  }
  next();
}

// Blocks the route unless someone is logged in.
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
}

// Blocks the route unless the logged-in user is an approved admin.
async function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user || user.role !== 'ADMIN') {
    req.flash('error', 'You do not have access to that page.');
    return res.redirect('/');
  }
  next();
}

module.exports = { loadCurrentUser, requireLogin, requireAdmin };
