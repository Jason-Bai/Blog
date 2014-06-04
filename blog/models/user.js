var mongodb = require('./db.js'),
    crypto = require('crypto'),
    async = require('async');

function User(user){
    this.name = user.name
    this.password = user.password;
    this.email = user.email;
}

module.exports = User;

User.prototype.save = function (callback) {

    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

    var user = {
        name : this.name,
        password: this.password,
        email : this.email,
        head: head
    };    
  
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        };

        db.collection('users', function (err, collection) {
            
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.insert(user, {
               safe: true
            }, function (err, user) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null, user[0]);
            });
        });
    });
    */
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            }); 
        },
        function (db, cb) {
            db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.insert(user, {
                safe : true
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        callback(err, user[0]);
    });

};

User.get = function (name, callback) {
    /*   
    mongodb.open(function (err, db) {
    
        if(err) {
            return callback(err);
        }

        db.collection('users', function (err, collection) {

            if(err) {
                mongodb.close();
                return callbac(err);
            }            

            collection.findOne({
                "name" : name
            }, function (err, user) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null, user);
            });

        });    
    }); 
    */
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                "name" : name
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        callback(err, user);
    });
};
