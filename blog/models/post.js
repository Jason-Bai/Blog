var mongodb = require('./db'), 
    markdown = require('markdown').markdown,
    ObjectID = require('mongodb').ObjectID,
    async = require('async');
    /*poolModule = require('generic-pool'),
    pool = poolModule.Pool({
        name : 'mongoPool',
        create : function (callback) {
            var mongodb = Db();
            callback(null, mongodb);
        },
        destroy: function (mongodb) {
            mongodb.close();
        },
        max : 100,
        min : 5,
        idleTimeoutMillis : 30000,
        log : true
    });
    */
function Post(name, head, title, tags, post) {
    this.name = name;
    this.head = head;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function (callback) {

    var date = new Date();

    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    };

    var post = {
        name: this.name,
        head: this.head,
        time: time,
        title: this.title,
        tags: this.tags,
        post: this.post,
        comments: [],
        reprint_info: {},
        pv: 0
    };
   /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            
            if(err) {
                mognodb.close();
                return callback(err);
            }

            collection.insert(post, {
                safe: true
            }, function (err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null);
            });
        })
    });
    */
    
    async.waterfall([
        function (cb) {
            /*
            mongodb.open(function (err, db) {
                cb(err, db);
            });
            */
            pool.acquire(function(err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection, db);
            });
        },
        function (collection, db, cb) {
            collection.insert(post, {
                safe : true
            },
            function (err, post) {
                cb(err, post, db);
            });
        }
    ], function (err, post, db) {
        pool.release(db);
        callback(err, post[0]);
    });
};

Post.getAll = function (name, callback) {
    /*
    mongodb.open(function (err, db) {

        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            
            if(err) {
                mongodb.close();
                return callback(err);
            }
 
            var query = {};
            if(name) {
                query.name = name;
            }            

            collection.find(query).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                if(docs) {
                    docs.forEach(function (doc, index) {
                        if(doc.post) {
                            doc.post = markdown.toHTML(doc.post);
                        }
                    });
                }

                callback(null, docs);
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
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var query = {};
            if(name && name != "") {
                query.name = name;
            }
            collection.find(query, function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, docs) {
        if(docs) {
            docs.forEach(function (doc, index) {
               if(doc.post) {
                  doc.post = markdown.toHTML(doc.post);
               }
            });
        }
        callback(err, docs);
    });
};

Post.getOne = function (_id, callback) {
    /* 
    mongodb.open(function (err, db) {
        if(err) return callback(err);
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err)
                }
                collection.update({
                    "_id" : new ObjectID(doc._id)
                }, {
                    $inc : {"pv": 1}
                }, function (err) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    if(doc.post) {
                        doc.post = markdown.toHTML(doc.post);
                    }

                    if(doc.comments) {
                        doc.comments.forEach(function (comment, index) {
                            comment.content = markdown.toHTML(comment.content);
                        });
                    }
                    callback(null, doc);
                });
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
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                 /*
                 collection.update({
                     "_id" : new ObjectID(_id)
                 }, {
                     $inc : {
                         "pv" : 1
                     }
                 }, function (err) {
                     cb(err, doc);
                 });
                 */
                 cb(err, collection, doc);
            } );
        },
        function (collection, doc, cb) {
            collection.update({
                "_id" : new ObjectID(_id)
            }, {
                $inc : {
                    "pv" : 1
                }
            }, function (err) {
                cb(err, doc);
            });
        }
    ], function (err, post) {
        mongodb.close();
        callback(err, post);
    });
};
/*
Post.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, function (err, doc) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, doc);
            });
        });
    });
};
*/
Post.edit = function (_id, callback) {
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null, doc);
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
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                cb(err, doc);
            });
        }
    ], function (err, doc) {
        mongodb.close();
        callback(err, doc);
    });
};
/*
Post.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db){
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.update({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, {
                $set: {post : post}
            }, function (err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
*/
Post.update = function (_id, post, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.update({
                "_id" : new ObjectID(_id)
            }, {
                $set : {
                    post : post
                }
            }, function (err) {
                cb(err, null);
            });
        }
    ], function (err, doc) {
        mongodb.close();
        callback(err, doc);
    });
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.update({
                "_id" : new ObjectID(_id)
            }, {
                $set : {
                    post : post
                }
            }, function (err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null);
            });
        });
    });
    */
}; 
/*
Post.remove = function (name, day, title, callback) {
     mongodb.open(function (err, db) {
         if(err) {
             return callback(err);
         }

         db.collection('posts', function (err, collection) {
             if(err) {
                 mongodb.close(); 
                 return callback(err);
             }

             collection.remove({
                 "name" : name,
                 "time.day" : day,
                 "title" : title
             }, function (err) {
                 mongodb.close();
                 if(err) {
                     return callback(err);
                 }
                 callback(null);
             });
         });
     });
};
*/
Post.getTen = function (name, page, callback) {
    async.waterfall([
        function (cb) {
            
            mongodb.open(function (err, db) {
                cb(err, db);
            });
            
            /*
            pool.acquire(function (err, db) {
                mongodb = db;
                cb(err, db);
            });
            */
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var query = {};
            if(name && name != "") {
                query.name = name;
            }
            collection.count(query, function (err, total) {
                /*
                collection.find(query, {
                    skip : (page - 1) * 10,
                    limit : 10
                }).sort({
                    time : -1
                }).toArray(function (err, docs) {
                    if(docs) {
                        docs.forEach(function (doc, index) {
                            if(doc.post) {
                                doc.post = markdown.toHTML(doc.post);
                            }
                        });
                    }
                    cb(err, docs, total);
                });
                */
                cb(err, collection, query, total); 
                    
            });
        },
        function (collection, query, total, cb) {
            collection.find(query, {
                skip : (page - 1) * 10,
                limit: 10
            }).sort({
                time : -1
            }).toArray(function (err, docs) {
                if(docs) {
                    docs.forEach(function (doc, index) {
                        if(doc.post) {
                            doc.post = markdown.toHTML(doc.post);
                        }
                    });
                }
                cb(err, docs, total);
            });
        }
    ], function (err, docs, total) {
       mongodb.close();
       callback(err, docs, total);
    });
    /*
    mongodb.open(function (err, db) {
         if(err) {
             return callback(err);
         }

         db.collection('posts', function (err, collection) {
             if(err) {
                 mongodb.close();
                 return callback(err);
             }

             var query = {};
             if(name) {
                 query.name = name;
             }
             collection.count(query, function (err, total) {
                 collection.find(query, {
                     skip: (page - 1) * 10,
                     limit : 10
                 }).sort({
                     time: -1
                 }).toArray(function (err, docs) {
                     mongodb.close();
                     if(err) {
                         return callback(err);
                     }
                     if(docs) {
                         docs.forEach(function (doc, index) {
                             if(doc) {
                                 doc.post = markdown.toHTML(doc.post);
                             }
                         });
                     }
                     callback(null, docs, total);
                 });
             });
         });
    });
    */
};
Post.getArchive = function (callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.find({}, {
                "name" : 1,
                "title" : 1,
                "time" : 1
            }).sort({
                time : -1
            }).toArray(function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, docs) {
        mongodb.close();
        callback(err, docs);
    });
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({},{
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time: -1
            }).toArray(function (err, docs){
                 mongodb.close();
                 if(err) {
                     return callback(err);
                 }
                 callback(null, docs);
            });
        });
    });
    */
};
Post.getTags = function (callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.distinct('tags', function (err, tags) {
                cb(err, tags);
            });
        }
    ], function (err, tags) {
        mongodb.close();
        callback(err, tags);
    });
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.distinct('tags', function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
    */
};
Post.getTag = function (tag, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.find({
                "tags" : tag
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
               time : -1
            }).toArray(function (err, posts) {
                cb(err, posts);
            });
        }
    ], function (err, posts) {
        mongodb.close();
        callback(err, posts);
    });
    /*
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.find({
                "tags" : tag
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time : -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }

                callback(null, docs);
            });
        });
    });
    */
};
Post.search = function (keyword, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            var pattern = new RegExp('^.*' + keyword + '.*$', 'i');
            collection.find({
                "title" : pattern
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
               time : -1
            }).toArray(function (err, docs) {
                cb(err, docs);
            });
        }
    ], function (err, docs) {
        mongodb.close();
        callback(err, docs);
    });   
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({
                "title" : pattern
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time : -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
    */
};
Post.reprint = function (reprint_from, reprint_to, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                "_id" : new ObjectID(reprint_from._id)
            }, function (err, doc) {

                
                var date = new Date();
                var time = {
                    date : date,
                    year : date.getFullYear(),
                    month : date.getFullYear() + '-' + (date.getMonth() + 1),
                    day : date.getFullYear() + '-' + (date.getMonth() + 1) + date.getDate(),
                    minute : date.getFullYear() + '-' + (date.getMonth() + 1) + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
                };
                
                
                delete doc._id;
                
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : '[转载]' + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;
                
                cb(err, collection, reprint_from._id, doc);
            });
        },
        function(collection, _id, doc, cb) {

            var date = new Date();
            var time = {
                date : date,
                year : date.getFullYear(),
                month : date.getFullYear() + '-' + (date.getMonth() + 1),
                day : date.getFullYear() + '-' + (date.getMonth() + 1) + date.getDate(),
                minute : date.getFullYear() + '-' + (date.getMonth() + 1) + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
            };
                
            collection.update({
                "_id" : new ObjectID(_id)
            },{
                $push : {
                    "reprint_info.reprint_to" : {
                         "name" : doc.name,
                         "day" : time.day,
                         "title" : doc.title
                     }
                }  
            }, function (err) {
                cb(err, collection, doc);
            });
        },
        function (collection, doc, cb) {
            collection.insert(doc, {
                safe : true
            }, function (err, doc){
                cb(err, doc);
            });
        }
    ], function (err, doc) {
         mongodb.close();
         callback(err, doc[0]);
    });
    /*
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                'name' : reprint_from.name,
                'time.day' : reprint_from.day,
                'title' : reprint_from.title
            }, function (err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }

                var date = new Date();
                var time = {
                    date: date,
                    year: date.getFullYear(),
                    month: date.getFullYear() + '-' + (date.getMonth() + 1),
                    day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
                    minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                };

                delete doc._id;

                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : '[转载]' + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from": reprint_from};
                doc.pv = 0;

                collection.update({
                    "name" : reprint_from.name,
                    "time.day": reprint_from.day,
                    "title": reprint_from.title
                }, {
                    $push: {
                        "reprint_info.reprint_to": {
                            "name": doc.name,
                            "day" : time.day,
                            "title" : doc.title
                        }
                    }
                }, function (err) {
                    if(err) {
                        mongodb.close();
                        return callback(err);
                    }
                });

                collection.insert(doc, {
                   safe : true
                }, function (err, post) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(err, post[0]);
                });
            });
        });
    });
    */
};
/*
Post.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db){
        if(err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, function (err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                var reprint_from = "";
                if(doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from != "") {
                    collection.update({
                        "name" : reprint_from.name,
                        "time.day" : reprint_from.day,
                        "title" : reprint_from.title
                    }, {
                        $pull : {
                            "reprint_info.reprint_to" : {
                                "name" : name,
                                "day" : day,
                                "title" : title
                            }
                        }
                    }, function (err) {
                        if(err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }

                collection.remove({
                    "name" : name,
                    "time.day" : day,
                    "title" : title
                }, {
                   w : 1
                }, function (err) {
                    mongodb.close();
                    if(err) {
                       return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
};
*/
Post.remove = function (_id, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
               cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('posts', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                var reprint_from = "";
                if(doc.reprint_info && doc.reprint_info.reprint_from) {
                    reprint_from = doc.reprint_info.reprint_from;
                }

                if(reprint_from != "") {
                    cb(err, collection, reprint_from, doc);
                }
            });
        },
        function (collection, reprint_from, doc, cb) {
            collection.update({
                '_id' : new ObjectID(reprint_from._id)
            }, {
                $pull : {
                    'reprint_info.reprint_to' : {
                        'name' : doc.name,
                        'day' : doc.time.day,
                        'title' : doc.title
                    }
                }
            }, function (err) {
                cb(err, collection, doc);
            });
        },
        function (collection, doc, cb) {
            collection.remove({
                "_id" : new ObjectID(doc._id)
            }, {
                w : 1
            }, function (err) {
                cb(err, doc);
            });
        }
    ], function (err, doc) {
        mongodb.close();
        callback(err, doc);
    }); 
    /*
    mongodb.open(function (err, db) {
        if(err) {
           return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({
                "_id" : new ObjectID(_id)
            }, function (err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }

                var reprint_from = "";
                if(doc.reprint_info && doc.reprint_info.reprint_from) {
                     reprint_from = doc.reprint_info.reprint_from;
                }

                if(reprint_from != "") {
                    collection.update({
                        "name" : reprint_from.name,
                        "time.day" : reprint_from.day,
                        "title" : reprint_from.title
                    }, {
                        $pull : {
                            "reprint_info.reprint_to" : {
                                "name" : doc.name,
                                "day" : doc.time.day,
                                "title" : doc.title
                            } 
                        }
                    }, function (err) {
                        if(err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }

                collection.remove({
                    "_id" : new ObjectID(_id)
                }, {
                    w : 1
                }, function (err) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
    */
};
