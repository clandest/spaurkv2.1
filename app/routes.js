
var fs = require('fs');
var bcrypt   = require('bcrypt-nodejs');
var salt = bcrypt.genSaltSync(8);
var path = require('path');
var appDir = path.dirname(require.main.filename);
var exec = require('child-process-promise').exec;

module.exports = function(app, db, upload){

	app.get('/', function(req, res, next){
		var user = req.session.user;
		var userId;
		var genreList;
		var subList;

		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}

		db('genre')
		.orderBy('name', 'asc')
		.then(function(genres){
			genreList = genres;
		})
		.then(function(){
		return db('posts')
		.join('users', 'users.uid', 'posts.user_id')
		.join('category', 'category.id', 'posts.category_id')
		.join('genre', 'genre.id', 'posts.genre_id')
		.select('posts.id',
						'posts.title',
						'posts.artist',
						'posts.start',
						'posts.stop',
						'posts.tags',
						'posts.audioFile',
						'posts.imageFile',
						'posts.created_at',
						'genre.genreShowName',
						'category.categoryShowName',
						'users.profileImage',
						'users.username')
		.orderBy('created_at', 'desc')
		})
		.then(function(posts){
			res.render('index.html',{
				title: 'Spaurk.net - Discover or be Discovered',
				messages: req.flash('alert'),
				posts: posts,
				selectedGenre: "All",
				genreList: genreList,
				subList: subList,
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
			});
		})
		.catch(function(err){
			console.log(err);
		});
	});

	app.get('/spaurk/:postId', function(req, res, next){
		res.status('204').end();
	});

	app.get('/comments/:postId', function(req, res, next){
		var user = req.session.user;
		var loginUser = req.session.user;
		var postId = req.params.postId;
		var genreShowName;
		var genreList;
		var subList;
		var subbed;
		var post;

		db('genre')
		.orderBy('name', 'asc')
		.then(function(genres){
			genreList = genres;
		})


		db('posts')
		.where('posts.id', postId )
		.join('users', 'users.uid', 'posts.user_id')
		.join('category', 'category.id', 'posts.category_id')
		.join('genre', 'genre.id', 'posts.genre_id')
		.select('posts.id',
						'posts.title',
						'posts.artist',
						'posts.start',
						'posts.stop',
						'posts.tags',
						'posts.audioFile',
						'posts.imageFile',
						'posts.created_at',
						'genre.genreShowName',
						'category.categoryShowName',
						'users.profileImage',
						'users.username')
		.orderBy('created_at', 'desc')
		.then(function(posts){
			post = posts[0];
			if(user){
				db('users')
				.where({ username: user })
				.then(function(user){
					userId = user[0].uid;
					return db('subscriptons')
						.where({ user_id: userId })
						.join('genre', 'genre.id', 'subscriptons.genre_id')
				})
				.then(function(subscriptons){
					subList = subscriptons;
					return db('genre')
						.where({ genreShowName: post.genreShowName })
				})
				.then(function(genre){
					genreShowName = genre[0].genreShowName;
					return db('subscriptons')
						.where({ user_id: userId, genre_id: genre[0].id })
				})
				.then(function(result){
					if(result != ''){
						subbed = "unsub";
					}
				})
				.then(function(){
					return db('postComments')
							.where('post_id', postId)
							.join('users', 'postComments.user_id', 'users.uid')
							.select('postComments.id',
											'postComments.body',
											'postComments.created_at',
											'postComments.replies',
											'users.username',
											'users.profileImage')
						.orderBy('created_at', 'desc')
					})
					.then(function(comments){
					res.render('postComment.html', {
						title: 'Spaurk.net - Discover or be Discovered',
						messages: req.flash('alert'),
						post: post,
						isLogged: req.session.isLogged,
						user: req.session.user,
						accountImage: req.session.accountImage,
						selectedGenre: genreShowName,
						genreList: genreList,
						subList: subList,
						subbed: subbed,
						comments: comments
					});
				})
				.catch(function(err){
					console.log('There was an error getting subscriptons ' + err);
				});
			}else{
					db('postComments')
						.where('post_id', postId)
						.join('users', 'postComments.user_id', 'users.uid')
						.select('postComments.id',
										'postComments.body',
										'postComments.created_at',
										'postComments.replies',
										'users.username',
										'users.profileImage')
					.orderBy('created_at', 'desc')
				.then(function(comments){
				res.render('postComment.html', {
					title: 'Spaurk.net - Discover or be Discovered',
					messages: req.flash('alert'),
					post: post,
					selectedGenre: post.genreShowName,
					isLogged: req.session.isLogged,
					user: req.session.user,
					accountImage: req.session.accountImage,
					genreList: genreList,
					subList: subList,
					comments: comments
				});
				})
				.catch(function(err){
					console.log(err);
				});
			}
		})
		.catch(function(error){
			req.flash('alert', 'Please log in to post a comment');
			console.log(error);
		});

	});

	app.post('/comments/:postId/comment', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var postId = req.params.postId;
		var comment = req.body.newComment;
		var userId;

		if(loginUser){
			db('users').where({ username: loginUser })
			.then(function(user){
				userId = user[0].uid;
			})
			.then(function(){
				return db('postComments').insert({ 
					body: comment, 
					user_id: userId, 
					post_id: postId,
					created_at: new Date() });
			})
			.then(function(comment){
				req.flash('alert', 'post successfull');
				res.status('204').end();
			})
			.catch(function(error){
				req.flash('alert', 'Please log in to post a comment');
				res.redirect('/login');
			});
		}

	});

	app.post('/comments/:postId/comment/reply', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var postId = req.params.postId;
		var reply = req.body.newReply;
		var commentId = req.body.commentId;
		var userId;

		if(loginUser){
			db('users').where({ username: loginUser })
			.then(function(user){
				userId = user[0].uid;
			})
			.then(function(){
				return db('postComments').insert({ 
					body: reply, 
					user_id: userId, 
					post_id: postId, 
					replies: commentId, 
					created_at: new Date() });
			})
			.then(function(reply){
				res.status('204').end();
			})
			.catch(function(error){
				req.flash('alert', 'Please log in to post a comment');
				res.redirect('/login');
			});
		}
	});


	app.get('/c/:category', function(req, res, next){
		var user = req.session.user;
		var category = req.params.category.toLowerCase();
		var genreList;
		var genreShowName;
		var categoryId;
		var genreId;
		var subList;

		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
		}


		db('genre')
		.orderBy('name', 'asc')
		.then(function(genres){
			genreList = genres;
		 return db('category')
			.where({ name: category })
		})
		.then(function(category){
			categoryId = category[0].id;
			return db('posts')
				.where({ 'posts.category_id': categoryId })
				.join('users', 'users.uid', 'posts.user_id')
				.join('category', 'category.id', 'posts.category_id')
				.join('genre', 'genre.id', 'posts.genre_id')
				.select('posts.id',
								'posts.title',
								'posts.artist',
								'posts.start',
								'posts.stop',
								'posts.tags',
								'posts.audioFile',
								'posts.imageFile',
								'posts.created_at',
								'genre.genreShowName',
								'category.categoryShowName',
								'users.profileImage',
								'users.username')
				.orderBy('created_at', 'desc')
		})
		.then(function(posts){
			res.render('index.html',{
				title: 'Spaurk.net - ' + req.params.category,
				messages: req.flash('alert'),
				posts: posts,
				selectedGenre: req.params.genre,
				genreList: genreList,
				selectedGenre: genreShowName,
				subList: subList,
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
			});

		})
		.catch(function(err){
			console.log(err);
		});

	});

	app.get('/c/:category/:genre', function(req, res,next){
		var user = req.session.user;
		var category = req.params.category.toLowerCase();
		var genre = req.params.genre.toLowerCase();
		var genreShowName = req.params.genre;
		var genreList;
		var categoryId;
		var genreId;
		var subList;
		var subbed;
		var posts;

		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
				return db('genre')
					.where({ name: genre })
			})
			.then(function(genre){
				return db('subscriptons')
					.where({ user_id: userId, genre_id: genre[0].id })
			})
			.then(function(result){
				if(result != ''){
					subbed = "unsub";
				}
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}


		db('genre')
		.orderBy('name', 'asc')
		.then(function(genres){
			genreList = genres;
		 return db('category')
			.where({ name: category })
		})
		.then(function(category){
			categoryId = category[0].id;
			return db('genre')
				.where({ name: genre})
		})
		.then(function(genre){
			genreId = genre[0].id;
			return db('posts')
				.where({ 'posts.category_id': categoryId, 'posts.genre_id': genreId })
				.join('users', 'users.uid', 'posts.user_id')
				.join('category', 'category.id', 'posts.category_id')
				.join('genre', 'genre.id', 'posts.genre_id')
				.select('posts.id',
								'posts.title',
								'posts.artist',
								'posts.start',
								'posts.stop',
								'posts.tags',
								'posts.audioFile',
								'posts.imageFile',
								'posts.created_at',
								'genre.genreShowName',
								'category.categoryShowName',
								'users.profileImage',
								'users.username')
				.orderBy('created_at', 'desc')
		})
		.then(function(posts){
			posts = posts;
			if(user){
				db('users')
				.where({ username: user })
				.then(function(user){
					userId = user[0].uid;
					return db('subscriptons')
						.where({ user_id: userId })
						.join('genre', 'genre.id', 'subscriptons.genre_id')
				})
				.then(function(subscriptons){
					subList = subscriptons;
					return db('genre')
						.where({ name: genre })
				})
				.then(function(genre){
					return db('subscriptons')
						.where({ user_id: userId, genre_id: genre[0].id })
				})
				.then(function(result){
					if(result != ''){
						subbed = "unsub";
					}
				})
				.then(function(){
					res.render('index.html',{
						title: 'Spaurk.net - ' + genreShowName,
						messages: req.flash('alert'),
						posts: posts,
						selectedGenre: genreShowName,
						genreList: genreList,
						subList: subList,
						isLogged: req.session.isLogged,
						user: req.session.user,
						subbed: subbed,
						accountImage: req.session.accountImage,
					});
				})
				.catch(function(err){
					console.log('There was an error getting subscriptons ' + err);
				});
			}else{
				res.render('index.html',{
					title: 'Spaurk.net - ' + genreShowName,
					messages: req.flash('alert'),
					posts: posts,
					selectedGenre: genreShowName,
					genreList: genreList,
					subList: subList,
					isLogged: req.session.isLogged,
					user: req.session.user,
					subbed: subbed,
					accountImage: req.session.accountImage,
				});
			}
		})
		.catch(function(err){
			console.log(err);
		});
	});

	app.get('/g/:genre', function(req, res, next){
		var user = req.session.user;
		var genre = req.params.genre.toLowerCase();
		var genreList;
		var genreShowName;
		var subList;
		var subbed;
		var posts;

		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
				return db('genre')
					.where({ name: genre })
			})
			.then(function(genre){
				return db('subscriptons')
					.where({ user_id: userId, genre_id: genre[0].id })
			})
			.then(function(result){
				if(result != ''){
					subbed = "unsub";
				}
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}

		db('genre')
		.orderBy('name', 'asc')
		.then(function(genres){
			genreList = genres;
		})
		.then(function(){
			return db('genre')
			.where({ name: genre })
		})
		.then(function(genre){
			genreShowName = genre[0].genreShowName;
			return db('posts')
				.where('posts.genre_id', genre[0].id)
				.join('users', 'users.uid', 'posts.user_id')
				.join('category', 'category.id', 'posts.category_id')
				.join('genre', 'genre.id', 'posts.genre_id')
				.select('posts.id',
								'posts.title',
								'posts.artist',
								'posts.start',
								'posts.stop',
								'genre.genreShowName',
								'posts.tags',
								'posts.created_at',
								'category.categoryShowName',
								'posts.audioFile',
								'posts.imageFile',
								'users.profileImage',
								'users.username')
				.orderBy('created_at', 'desc')
		})
		.then(function(posts){
			posts = posts;
			if(user){
				db('users')
				.where({ username: user })
				.then(function(user){
					userId = user[0].uid;
					return db('subscriptons')
						.where({ user_id: userId })
						.join('genre', 'genre.id', 'subscriptons.genre_id')
				})
				.then(function(subscriptons){
					subList = subscriptons;
					return db('genre')
						.where({ name: genre })
				})
				.then(function(genre){
					return db('subscriptons')
						.where({ user_id: userId, genre_id: genre[0].id })
				})
				.then(function(result){
					if(result != ''){
						subbed = "unsub";
					}
				})
				.then(function(){
					res.render('index.html',{
						title: 'Spaurk.net - ' + genreShowName,
						messages: req.flash('alert'),
						posts: posts,
						selectedGenre: genreShowName,
						genreList: genreList,
						subList: subList,
						isLogged: req.session.isLogged,
						user: req.session.user,
						subbed: subbed,
						accountImage: req.session.accountImage,
					});
				})
				.catch(function(err){
					console.log('There was an error getting subscriptons ' + err);
				});
			}else{
				res.render('index.html',{
					title: 'Spaurk.net - ' + genreShowName,
					messages: req.flash('alert'),
					posts: posts,
					selectedGenre: genreShowName,
					genreList: genreList,
					subList: subList,
					isLogged: req.session.isLogged,
					user: req.session.user,
					subbed: subbed,
					accountImage: req.session.accountImage,
				});
			}
		})
		.catch(function(error){
			console.log(error);
			req.flash('alert', 'genre not found');
			res.redirect('/');
		});
	});


	app.get('/g/:genre/subscribe', function(req, res, next){
		var user = req.session.user;
		var genre = req.params.genre;
		var userId;
		var genreId;

		db('genre')
		.where({ genreShowName: genre })
		.then(function(genre){
			genreId = genre[0].id;
		})
		.catch(function(err){
			console.log(err);
		});


		if(user){
			db('users')
			.where({ username: user })
			.select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: user[0].uid, genre_id: genreId })
			})
			.then(function(subscripton){
				if(subscripton != ''){
					return db('subscriptons')
						.where({ 'subscriptons.user_id': subscripton[0].user_id, 
									 'subscriptons.genre_id': subscripton[0].genre_id })
						.del()
				}else{
					return db('subscriptons')
						.insert({ user_id: userId, genre_id: genreId })
				}
			})
			.then(function(success){
				res.status('204').end();
			})
			.catch(function(error){
				console.log('error with genre subscribe: ' + error);
			});
		}else{
			res.status('204').end();
		}

	});


	app.get('/register', function(req, res, next){
			if(req.session.user)
				res.redirect('/p/' + req.session.user);	
		else{
				res.render('register.html',{
				messages: req.flash('alert'),
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
				});
		}
	});

	app.post('/register', upload.single('image'), function(req, res, next){
		var username = req.body.username;
		var user = req.body.user;
		var password = req.body.password; 
		var email = req.body.email;
		var date = new Date();
		var profileImage;
		
		password = generateHash(password);

		if(req.file)
			profileImage = req.file.filename;
		else
			profileImage = 'defaultProfile.png';
		
		db('users').insert({
		username: username,
		user: user,
		password: password,
		email: email,
		created_at: date,
		profileImage: profileImage
		})
		.then(function(user){
			return db('users')
				.where({ username: username });
		})
		.then(function(user){
			username = user[0].username;
			profileImage = user[0].profileImage;
			return db('profiles')
				.insert({ user_id: user[0].uid });
		})
		.then(function(profile){
			req.session.regenerate(function(){
				req.flash('alert', 'user registered');
				req.session.user = username;
				req.session.accountImage = profileImage;
				req.session.isLogged = true;
				res.redirect('/p/' + username);
			});
		})
		.catch(function(error){
			req.flash('alert', 'Username taken');
			res.redirect('/register');
		});
	});

	app.get('/login', function(req, res, next){
		if(req.session.user){
			res.redirect('/p/' + req.session.user);
		}else{
			res.render('login.html', {
				title: 'Login',
				messages: req.flash('alert'),
			});
		}
	});

	app.post('/login/', function(req, res, next){
		var username = req.body.username;
		var password = req.body.password;

		username = username.trim();
		username = username.toLowerCase();

		db('users')
		.where({ user: username })
		.then(function(user){
			if(user && validateHash(password, user[0].password) == true){
				req.session.regenerate(function(){
					req.session.user = user[0].username;
					req.session.accountImage = user[0].profileImage;
					req.session.isLogged = true;
					req.flash('alert', 'successfull login');
					var backURL = req.header('Referer') || '/';
					res.redirect(backURL);
				});
			}else{
				req.flash('alert', 'Invalid username or password');
				res.redirect('/register');
			}
		})
		.catch(function(err){
			req.flash('alert', 'Invalid username or password');
			res.redirect('/register');
		});
	});

	app.get('/logout', function(req, res, next){
		req.session.destroy(function(){
				var backURL = req.header('Referer') || '/';
				res.redirect(backURL);
		});
	});

	app.get('/upload', function(req, res, next){
		var user = req.session.user;
		var subList;

		if(req.query.q){
			var query = req.query.q;
			query = query.toLowerCase();
			db('genre')
				.where('name', 'like', '%' + query + '%')
			.then(function(search){
				if(search == ''){
					res.end('Genre does not exist, but will be created if posted. User created genres do not show up in the default subscription list.');
				}else{
					var genres = '';
					for(var i = 0; i < search.length; i++){
						genres +=  search[i].genreShowName + ' ';
					}
					res.send(genres);
				}
			})
			.catch(function(err){
				console.log(err);
			});
		}else{
			if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.then(function(){
				return db('category')
				.then(function(categories){
					res.render('upload.html', {
						title: 'New Upload',
						messages: req.flash('alert'),
						user: req.session.user,
						subList: subList,
						accountImage: req.session.accountImage,
						isLogged: req.session.isLogged,
						subList: subList,
						categories: categories
					});
		})
		.catch(function(err){
			console.log(err);
		});
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
		}else{
				db('category')
				.then(function(categories){
					res.render('upload.html', {
						title: 'New Upload',
						messages: req.flash('alert'),
						user: req.session.user,
						subList: subList,
						accountImage: req.session.accountImage,
						isLogged: req.session.isLogged,
						subList: subList,
						categories: categories
					});
				})
				.catch(function(err){
					console.log(err);
				});
			}
		}
	});

	var manageUpload = upload.fields([{ name: 'fileElem', maxCount: 1 }, { name: 'imageElem', maxCount: 1 } ]);
	app.post('/upload', manageUpload, function(req, res){
		var user = req.session.user;
		var userId;
		var title = req.body.title;
		var artist = req.body.artist;
		var start = req.body.start;
		var stop = req.body.stop - start;
		var tags = req.body.tags;
		var created_at = new Date();
		var genreDisplayName = req.body.genre;
		var categoryDisplayName = req.body.category;
		var categoryName = categoryDisplayName.toLowerCase();
		var categoryId;
		var genreName = genreDisplayName.toLowerCase();
		var genreId;

		var audioFile = req.files['fileElem'][0].filename;
		if(typeof req.files['imageElem'] !== "undefined")
			var imageFile = req.files['imageElem'][0].filename;

		var audioLocation = appDir + '/views/static/uploads/' + audioFile;
		var destinationAudio = 'clip' + audioFile;
		var audioDestination = appDir + '/views/static/uploads/' + destinationAudio;

		var audioExtension = audioFile.split(".");
		var audioConvertedLocation = appDir + '/views/static/uploads/' + audioExtension[0] + '.mp3';
		var audioConvertedDestination = appDir + '/views/static/uploads/clip' + audioExtension[0] + '.mp3';
		var audioFileName = 'clip' + audioExtension[0] + '.mp3';


		if(audioExtension[1] != 'mp3'){
				var cmd = 'ffmpeg -i '+ audioLocation + ' -ss ' + start + ' -t ' + stop + ' -acodec copy ' + audioDestination;
				exec(cmd)
					.then(function(trim){
						console.log("successfull trim");
						if(fs.existsSync(audioLocation)){
							fs.unlinkSync(audioLocation);
							console.log('deleted audio after successful trim ' + audioLocation);
						}
					})
				.then(function(trim){
				var cmd = 'ffmpeg -i ' + audioDestination + ' -vn -ar 44100 -ac 2 -ab 192k -f mp3 ' + audioConvertedDestination;
				exec(cmd)
					.then(function(convert){
						if(fs.existsSync(audioDestination)){
							fs.unlinkSync(audioDestination);
							console.log('deleted audio old clip format ' + audioDestination);
						}
						audioLocation = audioConvertedLocation;
						audioDestination = audioConvertedDestination;
						console.log("successfull convert");
					})
					.catch(function(err){
						console.log("error trimming: " + err);
					});
				})
				.then(function(){
					db('users')
						.where({ username: user })
						.select('uid')
						.then(function(user){
							userId = user[0].uid;	
							return db('genre')
								.where({ name: genreName })
							})
							.then(function(genre){
								if(genre == ''){
									return db('genre')
										.insert({ name: genreName, genreShowName: genreDisplayName })
								}
							})
							.then(function(genre){
								return db('genre')
									.where({ name: genreName })
							})
							.then(function(genre){
								genreId = genre[0].id;	
								return db('category')
									.where({ name : categoryName })
							})
							.then(function(category){
								if(category == ''){
									return db('category')
										.insert({ name: categoryName, categoryShowName: categoryDisplayName })
								}
							})
							.then(function(category){
								return db('category')
									.where({ name : categoryName })
							})
							.then(function(category){
								categoryId = category[0].id;
							})
							.then(function(){
							return db('posts')
								.insert({ user_id: userId,
													title: title,	
													artist: artist,
													start: start,
													stop: stop,
													genre_id: genreId,
													created_at: created_at,
													tags: tags,
													category_id: categoryId,
													audioFile: audioFileName,
													imageFile: imageFile })
						})
						.then(function(post){
							req.flash('alert', 'succesfull upload');	
							res.status('204').end();
						})
						.catch(function(err){
							if(fs.existsSync(audioLocation)){
									fs.unlinkSync(audioLocation);
									console.log('deleted audio ' + audioFile);
							}
							if(fs.existsSync(audioDestination)){
									fs.unlinkSync(audioDestination);
									console.log('deleted audio ' + audioDestination);
							}
							if(fs.existsSync('views/static/uploads/' + imageFile)){
								fs.unlinkSync('views/static/uploads/' + imageFile);
									console.log('deleted  image ' + imageFile);
							}
							console.log('there was a post error: ' + err);	
							req.flash('alert', 'please log in');
							return res.redirect('/login');
						});
				})
				.catch(function(err){
					console.log('ERROR: ', err);
					if(fs.existsSync(audioLocation)){
							fs.unlinkSync(audioLocation);
							console.log('deleted audio ' + audioFile);
					}
					if(fs.existsSync('views/static/uploads/' + imageFile)){
						fs.unlinkSync('views/static/uploads/' + imageFile);
							console.log('deleted  image ' + imageFile);
					}
					res.status('504');
					req.flash('alert', 'File format not supported');
					res.redirect('/upload');
				});
		}else{
			var cmd = 'ffmpeg -i '+ audioLocation + ' -ss ' + start + ' -t ' + stop + ' -acodec copy ' + audioDestination;
			exec(cmd)
				.then(function(trim){
					console.log("successfull trim");
					if(fs.existsSync(audioLocation)){
						fs.unlinkSync(audioLocation);
						console.log('deleted audio new format ' + audioLocation);
					}
				})
				.then(function(){
					db('users')
						.where({ username: user })
						.select('uid')
						.then(function(user){
							userId = user[0].uid;	
							return db('genre')
								.where({ name: genreName })
							})
							.then(function(genre){
								if(genre == ''){
									return db('genre')
										.insert({ name: genreName, genreShowName: genreDisplayName })
								}
							})
							.then(function(genre){
								return db('genre')
									.where({ name: genreName })
							})
							.then(function(genre){
								genreId = genre[0].id;	
								return db('category')
									.where({ name : categoryName })
							})
							.then(function(category){
								if(category == ''){
									return db('category')
										.insert({ name: categoryName, categoryShowName: categoryDisplayName })
								}
							})
							.then(function(category){
								return db('category')
									.where({ name : categoryName })
							})
							.then(function(category){
								categoryId = category[0].id;
							})
							.then(function(){
							return db('posts')
								.insert({ user_id: userId,
													title: title,	
													artist: artist,
													start: start,
													stop: stop,
													genre_id: genreId,
													created_at: created_at,
													tags: tags,
													category_id: categoryId,
													audioFile: audioFileName,
													imageFile: imageFile })
						})
						.then(function(post){
							req.flash('alert', 'succesfull upload');	
							res.status('204').end();
						})
						.catch(function(err){
							if(fs.existsSync(audioLocation)){
									fs.unlinkSync(audioLocation);
									console.log('deleted audio ' + audioFile);
							}
							if(fs.existsSync(audioDestination)){
									fs.unlinkSync(audioDestination);
									console.log('deleted audio ' + audioDestination);
							}
							if(fs.existsSync('views/static/uploads/' + imageFile)){
								fs.unlinkSync('views/static/uploads/' + imageFile);
									console.log('deleted  image ' + imageFile);
							}
							console.log('there was a post error: ' + err);	
							req.flash('alert', 'please log in');
							return res.redirect('/login');
						});
				})
				.catch(function(err){
					console.log('ERROR: ', err);
					if(fs.existsSync(audioLocation)){
							fs.unlinkSync(audioLocation);
							console.log('deleted audio ' + audioFile);
					}
					if(fs.existsSync('views/static/uploads/' + imageFile)){
						fs.unlinkSync('views/static/uploads/' + imageFile);
							console.log('deleted  image ' + imageFile);
					}
					res.status('504');
					req.flash('alert', 'File format not supported');
					res.redirect('/upload');
				});

		}

	});

	app.get('/p/:user', function(req, res){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var ProfileUsername;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;
		var subList;

		profileUser = profileUser.toLowerCase();

		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}


		db('users')
		.where({ user: profileUser })

		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			profileUsername = profileUser[0].username;
			return db('profiles')
				.where({ user_id: profileUser[0].uid })
		})

		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('posts')
				.where({ user_id: profileUserId })
				.join('category', 'category.id', 'posts.category_id')
				.join('genre', 'genre.id', 'posts.genre_id')
				.join('users', 'users.uid', 'posts.user_id')
				.select('posts.id',
								'posts.title',
								'posts.artist',
								'posts.start',
								'posts.stop',
								'genre.genreShowName',
								'posts.tags',
								'posts.created_at',
								'category.categoryShowName',
								'posts.audioFile',
								'posts.imageFile',
								'users.profileImage',
								'users.username')
				.orderBy('created_at', 'desc')
		})
		.then(function(posts){
			res.render('profile.html', {
				title: req.params.user + ' Profile',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: profileUsername,
				subList: subList,
				profileUserId,
				posts: posts
			});
		})
		.catch(function(error){
			req.flash('alert', 'User not found');
			res.redirect('/');
		});
	});

	app.post('/p/:user/update/about', upload.single('image'), function(req, res, next){
		var user = req.session.user;
		var profileUser = req.params.user;
		var about = req.body.about;
		var flashBanner = req.body.flashBanner;
		var userId;
		var oldProfileImage;

		if(req.file && user == profileUser){
			db('users')
			.where({ username: user })
			.select('profileImage')
			.then(function(profileImage){
				oldProfileImage = profileImage[0].profileImage;	
				return db('users')
				.where({ username: user }).select('uid')
				.update({ profileImage: req.file.filename })
			})
			.then(function(update){
				return db('users')
					.where({ username: user })
					.select('profileImage')
			})
			.then(function(profileImage){
				req.session.accountImage = profileImage[0].profileImage;
				res.status('204').end();
				if(oldProfileImage != 'defaultProfile.png'){
					if(fs.existsSync('views/static/uploads/' + oldProfileImage)){
							fs.unlinkSync('views/static/uploads/' + oldProfileImage);
						}
				}
			})
			.catch(function(error){
				console.log(error);
			});
		}

		if(flashBanner && user == profileUser){
			db('users')
			.where({ username: user }).select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('users')
					.where({ username: profileUser })
					.select('uid');
			})
			.then(function(profileUser){
				return db('profiles')
					.where({ user_id: profileUser[0].uid })	
					.update({
						flashBanner: req.body.flashBanner
					})
			})
			.then(function(profile){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}

		if(about && user == profileUser){
			db('users')
			.where({ username: user }).select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('users')
					.where({ username: profileUser })
					.select('uid');
			})
			.then(function(profileUser){
				return db('profiles')
					.where({ user_id: profileUser[0].uid })	
					.update({
						about: req.body.about,
					})
			})
			.then(function(profile){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}

	});

	app.get('/watchlist/:id', function(req, res){
		var user = req.session.user;
		var postId = req.params.id;
		var userId;


		if(user){
			db('users')
			.where({ username: user })
			.select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('watchlist')
					.where({ user_id: user[0].uid, post_id: postId })
			})
			.then(function(watchlist){
				if(watchlist != ''){
					return db('watchlist')
						.where({ 'watchlist.user_id': watchlist[0].user_id, 
									 'watchlist.post_id': watchlist[0].post_id })
						.del()
				}else{
					return db('watchlist')
						.insert({ user_id: userId, post_id: postId })
				}
			})
			.then(function(success){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}else{
			res.status('204').end();
		}
	});

	app.get('/p/:user/watchlist', function(req, res){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;
		var subList;
		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}


		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('watchlist')
				.where('watchlist.user_id', profileUserId)
				.join('posts', 'watchlist.post_id', 'posts.id')
				.join('users', 'users.uid', 'posts.user_id')
				.join('category', 'category.id', 'posts.category_id')
				.join('genre', 'genre.id', 'posts.genre_id')
				.select('posts.id',
								'posts.title',
								'posts.artist',
								'posts.start',
								'posts.stop',
								'genre.genreShowName',
								'posts.tags',
								'category.categoryShowName',
								'posts.audioFile',
								'posts.imageFile',
								'posts.created_at',
								'users.profileImage',
								'users.username')
		})
		.then(function(watchlists){
			res.render('watchlist.html', {
				title: req.params.user + ' Watchlist',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: profileUser,
				subList: subList,
				profileUserId: profileUserId,
				posts: watchlists
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.get('/p/:user/comments', function(req, res, next){
		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;
		var subList;
		
		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}


		db('users')
		.where('username', profileUser)
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where('user_id', profileUser[0].uid)
		})
		.then(function(profile){
			profileAbout = profile[0].about;
			profileFlashBanner = profile[0].flashBanner;
			return db('comments')
				.where('profile_id', profile[0].id)
				.join('users', 'comments.user_id', 'users.uid')
				.select('comments.id',
								'comments.body',
								'comments.created_at',
								'comments.replies',
								'users.username',
								'users.profileImage')
			.orderBy('created_at', 'desc')
		})
		.then(function(comments){
			res.render('comments.html', {
				messages: req.flash('alert'),
				isLogged: req.session.isLogged,
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				userProfile: req.params.user,
				about: profileAbout,
				profileUserId: profileUserId,
				subList: subList,
				flashBanner: profileFlashBanner,
				comments: comments
			});
		})
		.catch(function(error){
			req.flash('alert', 'Please log in to post a comment');
			res.redirect('/login');
		});

	});

	app.post('/p/:user/comment', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var comment = req.body.newComment;
		var userId;

		if(loginUser){
			db('users').where({ username: loginUser })
			.then(function(user){
				userId = user[0].uid;
				return user[0].uid;
			})
			.then(function(userId){
				return db('users').where({ username: profileUser });
			})
			.then(function(profileUser){
				return profileUser[0].uid;
			})
			.then(function(profileId){
				return db('profiles').where({ user_id: profileId });
			})
			.then(function(profile){
				return profile[0].id;
			})
			.then(function(profileId){
				return db('comments').insert({ 
					body: comment, 
					user_id: userId, 
					profile_id: profileId,
					created_at: new Date() });
			})
			.then(function(comment){
				req.flash('alert', 'post successfull');
				res.status('204').end();
			})
			.catch(function(error){
				req.flash('alert', 'Please log in to post a comment');
				res.redirect('/login');
			});
		}

	});

	app.post('/p/:user/comment/reply', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var reply = req.body.newReply;
		var commentId = req.body.commentId;
		var userId;

		if(loginUser){
			db('users').where({ username: loginUser })
			.then(function(user){
				userId = user[0].uid;
				return user[0].uid;
			})
			.then(function(userId){
				return db('users').where({ username: profileUser }).select('uid');
			})
			.then(function(profileUser){
				return profileUser[0].uid;
			})
			.then(function(profileId){
				return db('profiles').where({ user_id: profileId }).select('id');
			})
			.then(function(profile){
				return profile[0].id;
			})
			.then(function(profileId){
				return db('comments').insert({ 
					body: reply, 
					user_id: userId, 
					profile_id: profileId, 
					replies: commentId, 
					created_at: new Date() });
			})
			.then(function(reply){
				res.status('204').end();
			})
			.catch(function(error){
				req.flash('alert', 'Please log in to post a comment');
				res.redirect('/login');
			});
		}
	});

	app.get('/follows/:id', function(req, res, next){

		var user = req.session.user;
		var profileId = req.params.id;
		var userId;
		if(user){
			db('users')
			.where({ username: user })
			.select('uid')
			.then(function(user){
				userId = user[0].uid;
				return db('follows')
					.where({ user_id: user[0].uid, follow_id: profileId })
			})
			.then(function(follow){
				if(follow != ''){
					return db('follows')
						.where({ 'follows.user_id': follow[0].user_id, 
									 'follows.follow_id': follow[0].follow_id })
						.del()
				}else{
					return db('follows')
						.insert({ user_id: userId, follow_id: profileId })
				}
			})
			.then(function(success){
				res.status('204').end();
			})
			.catch(function(error){
				console.log(error);
			});
		}else{
			res.status('204').end();
		}
	
	});

	app.get('/p/:user/following', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var flag = true;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;
		var subList;
		
		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}

		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			profileAbout = profile[0].about;
			return db('follows')
				.where('follows.user_id', profileUserId)
				.join('users', 'follows.follow_id', 'users.uid')
		})
		.then(function(follows){
			res.render('following.html', {
				title: req.params.user + ' Following',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId: profileUserId,
				subList: subList,
				flag: flag,
				followers: follows
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});

	app.get('/p/:user/followers', function(req, res, next){

		var user = req.session.user;
		var loginUser = req.session.user;
		var profileUser = req.params.user;
		var flag = true;
		var profileUserId;
		var profileImage;
		var profileAbout;
		var profileFlashBanner;
		var subList;
		
		if(user){
			db('users')
			.where({ username: user })
			.then(function(user){
				userId = user[0].uid;
				return db('subscriptons')
					.where({ user_id: userId })
					.join('genre', 'genre.id', 'subscriptons.genre_id')
			})
			.then(function(subscriptons){
				subList = subscriptons;
			})
			.catch(function(err){
				console.log('There was an error getting subscriptons ' + err);
			});
				
		}


		db('users')
		.where({ username: profileUser })
		.then(function(profileUser){
			profileImage = profileUser[0].profileImage;
			profileUserId = profileUser[0].uid;
			return db('profiles')
				.where({ user_id: profileUserId })
		})
		.then(function(profile){
			profileFlashBanner = profile[0].flashBanner;
			return db('follows')
				.where('follows.follow_id', profileUserId)
				.join('users', 'follows.user_id', 'users.uid')
		})
		.then(function(follows){
			res.render('followers.html', {
				title: req.params.user + ' Following',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileImage,
				flashBanner: profileFlashBanner,
				about: profileAbout,
				isLogged: req.session.isLogged,
				userProfile: req.params.user,
				profileUserId: profileUserId,
				subList: subList,
				flag: flag,
				followers: follows
			});
		})
		.catch(function(error){
			console.log(error);
		});

	});


}

function generateHash(password){
	return bcrypt.hashSync(password, salt, null);
}

function validateHash(password, userPass, callback){
	return bcrypt.compareSync(password, userPass, callback);
}

