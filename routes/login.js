const router = require('express').Router();

router.post('/', (req, res) => {
    const { username, password } = req.body;

    console.log('login', username, password);

    if ( username && password === '123' ) {
        req.session.user = {
            username: username
        };
    }

    res.redirect('/');
});

module.exports = router;