require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const { loadCurrentUser } = require('./middleware/auth');
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Core middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
}));
app.use(flash());

// Make flash messages + logged-in user available in every view automatically
app.use(loadCurrentUser);
app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
  };
  res.locals.school = {
    name: 'Ajoshe Model College',
    shortName: 'AMC',
    motto: 'Education is the Best Legacy',
    location: 'Alagbado, Ilorin, Kwara State',
    address: 'Ajoshe Group of Schools, behind MM Filling Station, Ayegbami Street, Ilorin East, Alagbado, Ilorin',
    phones: ['070 6906 7827', '070 3011 4270'],
  };
  next();
});

// ---- Routes ----
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AMC site running at http://localhost:${PORT}`);
});
