
module.exports = function(app){

	app.get('/', function(req, res, next){
		res.render('index.html');
	});

	app.get('/register', function(req, res, next){
		res.render('register.html');
	});

	app.get('/upload', function(req, res, next){
		res.render('upload.html');
	});

	app.get('/p/:user', function(req, res, next){
		res.render('profile.html');
	});

	app.get('/watchlist', function(req, res, next){
		res.render('watchlist.html');
	});

	app.get('/following', function(req, res, next){
		res.render('following.html');
	});

	app.get('/comments', function(req, res, next){
		res.render('comments.html');
	});


}
