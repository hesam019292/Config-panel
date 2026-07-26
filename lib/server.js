require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const { requireLogin } = require('./middleware/auth');
const store = require('./lib/store');
const { getHost, replaceHost } = require('./lib/configTools');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-please',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 12 },
  })
);

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    return res.redirect('/dashboard');
  }
  res.render('login', { error: 'نام کاربری یا رمز عبور اشتباه است' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/dashboard', requireLogin, (req, res) => {
  const users = store.listUsers().map((u) => ({ ...u, host: getHost(u.config) }));
  res.render('dashboard', { users, message: req.query.message || null });
});

app.post('/users', requireLogin, (req, res) => {
  const { name, note, config } = req.body;
  if (!name || !config) {
    return res.redirect('/dashboard?message=' + encodeURIComponent('نام و کانفیگ الزامی است'));
  }
  store.addUser({ name, note, config: config.trim() });
  res.redirect('/dashboard?message=' + encodeURIComponent('کاربر اضافه شد'));
});

app.get('/users/:id/edit', requireLogin, (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) return res.redirect('/dashboard');
  res.render('edit', { user, error: null });
});

app.post('/users/:id/edit', requireLogin, (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) return res.redirect('/dashboard');

  const { name, note, config, newHost } = req.body;
  let finalConfig = config ? config.trim() : user.config;

  if (newHost && newHost.trim()) {
    const replaced = replaceHost(finalConfig, newHost.trim());
    if (!replaced) {
      return res.render('edit', {
        user: { ...user, name, note, config: finalConfig },
        error: 'قالب این کانفیگ برای تغییر خودکار IP/دامنه شناسایی نشد. کانفیگ را دستی ویرایش کنید.',
      });
    }
    finalConfig = replaced;
  }

  store.updateUser(user.id, { name, note, config: finalConfig });
  res.redirect('/dashboard?message=' + encodeURIComponent('تغییرات ذخیره شد'));
});

app.post('/users/:id/delete', requireLogin, (req, res) => {
  store.deleteUser(req.params.id);
  res.redirect('/dashboard?message=' + encodeURIComponent('کاربر حذف شد'));
});

app.listen(PORT, () => {
  console.log(`Config panel running on port ${PORT}`);
});
