async function renderLoginPage(req, res) {
    const error = req.query.error;
    return res.render('login', { title: 'Login', error });
}

async function renderRegisterPage(req, res) {
    const error = req.query.error;
    return res.render('register', { title: 'Register', error });
}

async function renderDashboardPage(req, res) {
    if (!req.user) {
        return res.redirect('/login');
    }

    return res.render('dashboard', {
        title: 'Dashboard',
        user: req.user,
    });
}

function logoutView(req, res) {
    req.logout(function(err) {
        if (err) {
            console.error('Session logout error:', err);
            return res.status(500).render('error', { message: 'Unable to log out', error: err });
        }

        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.redirect('/login');
        });
    });
}

module.exports = {
    renderLoginPage,
    renderRegisterPage,
    renderDashboardPage,
    logoutView,
};