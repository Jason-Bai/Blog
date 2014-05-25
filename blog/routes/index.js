var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');

module.exports = function (app) {
    app.get('/', function (req, res) {
        Post.get(null, function(err, posts) {
        
            if(err) {
                posts = [];
            }

            res.render('index', {
                title: "Express",
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: 'Register',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            re_password = req.body['password-repeat'];

        if(re_password != password) {
            req.flash('error', 'password not equal repeat-password!');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5'),
            password = md5.update(password).digest('hex');

        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });

        User.get(name, function (err, user){
            if(user) {
                req.flash('error', 'the name of ' + name + 'has already existed!');
                return res.redirect('/reg');
            }

            newUser.save(function (err) {
               if(err) {
                   req.flash('error', err);
                   return res.redirect('/reg');
               }

               req.session.user = user;
               req.flash('success', 'register successfully!');
               res.redirect('/');
            });
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res){
        res.render('login', {
            title: 'Login',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');

        User.get(req.body.name, function (err, user) {
            console.log(user);
            if(!user) {
                req.flash('error', 'the name of ' + req.body.name + ' does not exist!');
                return res.redirect('/login');
            }

            if(user.password != password) {
                req.flash('error', 'password is not correct!');
                return res.redirect('/login');
            }

            req.session.user = user;
            req.flash('success', 'Login Successfully!');
            res.redirect('/');
        });
    });

    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: 'Post',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);

        post.save(function (err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            req.flash('success', 'Post Successfully!');
            res.redirect('/');
            
        });
    });

    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', 'Logout successfully');
        res.redirect('/');
    });

    function checkLogin(req, res, next) {
        if(!req.session.user) {
            req.flash('error', 'not logined!')
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if(req.session.user) {
            req.flash('error', 'logined!');
            res.redirect('back');
        }
        next();
    }
};
