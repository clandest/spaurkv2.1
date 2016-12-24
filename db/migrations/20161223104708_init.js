
exports.up = function(knex, Promise) {

	return Promise.all([
		knex.schema.createTable('users', function(table){
			table.increments('uid').primary();
			table.string('user');
			table.string('username');
			table.string('password');
			table.string('email');
			table.string('profileImage').defaultTo('defaultProfile.png');
			table.timestamps();
		}),

		knex.schema.alterTable('users', function(table){
			table.unique('user');
		}),

		knex.schema.createTable('profiles', function(table){
			table.increments('id').primary();
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.text('about');
			table.string('flashBanner');
			table.timestamps();
		}),

		knex.schema.createTable('posts', function(table){
			table.increments('id').primary();
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.string('title');
			table.string('artist');
			table.string('start');
			table.string('stop');
			table.string('genre');
			table.string('tags');
			table.integer('genre_id')
				.references('id')
				.inTable('genre');
			table.integer('category_id')
				.references('id')
				.inTable('category');
			table.string('audioFile');
			table.string('imageFile');
			table.timestamps();
		}),

		knex.schema.createTable('comments', function(table){
			table.increments('id').primary();
			table.string('body');
			table.integer('user_id')
				.references('uid')
				.inTable('users')
			table.integer('profile_id')
				.references('id')
				.inTable('profiles');
			table.integer('replies')
				.references('id')
				.inTable('comments');
			table.timestamps();
		}),

		knex.schema.createTable('watchlist', function(table){
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.integer('post_id')
				.references('id')
				.inTable('posts');
		}),

		knex.schema.createTable('follows', function(table){
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.integer('follow_id')
				.references('uid')
				.inTable('users');
		}),

		knex.schema.createTable('genre', function(table){
			table.increments('id').primary();
			table.string('name');
		}),

		knex.schema.alterTable('genre', function(table){
			table.unique('name');
		}),

		knex.schema.createTable('subscriptons', function(table){
			table.integer('genre_id')
				.references('id')
				.inTable('genre');
			table.integer('user_id')
				.references('uid')
				.inTable('users');
		}),
		knex.schema.createTable('category', function(table){
			table.increments('id').primary();
			table.string('name');
		}),

		knex.schema.alterTable('category', function(table){
			table.unique('name');
		}),

	])
  
};

exports.down = function(knex, Promise) {
	
	return Promise.all([
		knex.schema.dropTable('users'),
		knex.schema.dropTable('profiles'),
		knex.schema.dropTable('posts'),
		knex.schema.dropTable('comments'),
		knex.schema.dropTable('watchlist'),
		knex.schema.dropTable('genre'),
		knex.schema.dropTable('category'),
		knex.schema.dropTable('subscriptions')
	])	
};
