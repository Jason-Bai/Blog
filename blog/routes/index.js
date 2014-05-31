var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports = function (app) {
    app.get('/', function (req, res) {
        /*
        Post.getAll(null, function(err, posts) {
        
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
        */
        var page = req.query.p ? parseInt(req.query.p, 10) : 1;
        Post.getTen(null, page, function (err, posts, total) {
            if(err) {
                posts = [];
            }
            res.render('index', {
                title : 'Home',
                posts: posts,
                page: page,
                isFirstPage : (page - 1) == 0,
                isLastPage : (page - 1) * 10 + posts.length == total,
                user: req.session.user,
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

            newUser.save(function (err, user) {
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
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);

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
   
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: 'File upload',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', function(req, res) {
        for (var i in req.files) {
            if(req.files[i].size == 0) {
                // 使用同步方式删除一个文件
                fs.unlinkSync(req.files[i].path);
                console.log('Successfully removed an empty file!');
            } else {
                var target_path = './public/images/' + req.files[i].name;
                // 使用同步方式重命名一个文件i
                fs.rename(req.files[i].path, target_path);
                console.log('Successfully renamed a file!');
            }
        }
        req.flash('success', 'file has uploaded successfully!');
        res.redirect('/upload');
    });
   
    app.get('/u/:name', function (req, res) {
        var page = req.query.p ? parseInt(req.query.p, 10) : 1;
        User.get(req.params.name, function (err, user) {
            if(!user) {
                req.flash('error', req.params.name + ' has not existed!');
                return res.redirect('/');
            }
            /*
            Post.getAll(user.name, function (err, posts) {
                if(err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
            */
            Post.getTen(req.params.name, page, function (err, posts, total) {
                if(err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title : user.name,
                    posts: posts,
                    page: page,
                    isFirstPage : (page - 1) == 0,
                    isLastPage : (page - 1) * 10 + posts.length == total,
                    user : req.session.user,
                    success : req.flash('success').toString(),
                    error : req.flash('error').toString()
                });
            });
        });
    });

    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post) {
            if(err) {
                req.flash('err', err);
                return res.redirect('/');
            }

            res.render('article', {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('edit', {
                title: 'Edit',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });    

    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'edited successfully!');
            res.redirect('/');
        });
    });

    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'removed successfully!');
            res.redirect('/');
        });
    });

    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() 
            + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());

        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=28";

        var comment = {
            name : req.body.name,
            head : head,
            email : req.body.email,
            website : req.body.website,
            time : time,
            content : req.body.content
        }; 

        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', 'commented successfully!');
            res.redirect('back');
        });
    });

    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('archive', {
                title : 'Archive',
                posts : posts,
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });
   
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, tags) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            res.render('tags', {
                title: 'Tags',
                tags: tags,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });  

    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title : 'TAG : ' + req.params.tag,
                posts : posts,
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });

    app.get('/search', function (req, res) {
        Post.search(req.body.keyword, function (err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title : 'SEARCH:' + req.body.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/links', function(req, res) {
        res.render('links', {
            title: 'Links',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
 
    app.use(function (req, res) {
        res.render('404');
    });

    app.get('/reprint/:name/:day/:title', checkLogin);
    app.get('/reprint/:name/:day/:title', function (req, res) {
        Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            var currentUser = req.session.user,
                reprint_from = {name: post.name, day: post.time.day, title: post.title},
                reprint_to = {name: currentUser.name, head: currentUser.head};

            Post.reprint(reprint_from, reprint_to, function (err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }

                req.flash('success', 'reprint successfully!');
                var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
                res.redirect(url);
            });
        });
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
