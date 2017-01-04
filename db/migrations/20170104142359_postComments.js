
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.createTable('postComments', function(table){
			table.increments('id').primary();
			table.string('body');
			table.integer('user_id')
				.references('uid')
				.inTable('users')
			table.integer('post_id')
				.references('id')
				.inTable('posts');
			table.integer('replies')
				.references('id')
				.inTable('postComments');
			table.timestamps();
		}),
	])
};

exports.down = function(knex, Promise) {
  	return Promise.all([
		knex.schema.dropTable('postComments'),
	])	

};
