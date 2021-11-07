module.exports = function(app, passport, db, multer, ObjectId) {

// Image Upload Code ====================
  var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }
  });
  var upload = multer({storage: storage}); 

// GET Routes ====================

  // index.ejs (home)
  app.get('/', function(req, res) {
    db.collection('posts').find().toArray((err, posts) => {
      if (err) return console.log(err)
        res.render('index.ejs', {
          posts: posts,
          user: req.user
        })
    })
  })

  // profile.ejs
  app.get('/profile', function(req, res) {
    db.collection('posts').find({postedBy: req.user.local.username}).toArray((err, posts) => {
      if (err) return console.log(err)
        res.render('profile.ejs', {
          posts: posts,
          user: req.user
        })
    })
  })

  // feed.ejs
  app.get('/feed', function(req, res) {
    db.collection('posts').find().toArray((err, posts) => {
      if (err) return console.log(err)
        res.render('feed.ejs', {
          posts: posts,
          user: req.user
        })
    })
  })

  //page.ejs
  app.get('/page/:zebra', isLoggedIn, function(req, res) {
    let page = req.params.zebra
    db.collection('posts').find({postedBy: page}).toArray((err, posts) => {
      if (err) return console.log(err)
      res.render('page.ejs', { 
        user: req.user,
        posts: posts,
      })
    })
  })

  // post.ejs
  app.get('/post/:zebra', isLoggedIn, function(req, res) {
    let post = ObjectId(req.params.zebra)
    db.collection('posts').find({_id: post}).toArray((err, posts) => {
      if (err) return console.log(err)
      db.collection('comments').find({postId: post}).toArray((err, comments) => {
        if (err) return console.log(err)
        res.render('post.ejs', { 
          user: req.user,
          posts: posts,
          comments: comments
        })
      })
    })
  })

// POST routes ====================
  app.post('/makePost', upload.single('file-to-upload'), (req, res) => {
    let user = req.user.local.username
    db.collection('posts').save({
    caption: req.body.caption, 
    img: 'images/uploads/' + req.file.filename, 
    postedBy: user, 
    likes: 0
    }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })

  app.post('/makeComment', (req, res) => {
      let user = req.user.local.username
      let posted = ObjectId(req.body.postId)
      db.collection('comments').save({
      comment: req.body.comment, 
      postedBy: user, 
      postId: posted
      }, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/feed')
      })
    })

// PUT Routes ====================
  app.put('/likes', (req, res) => {
    let post = ObjectId(req.body.id)
    db.collection('posts')
    .findOneAndUpdate({
    _id: post
    }, {
      $set: {
        likes: req.body.likes + 1
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })

// LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/feed', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}