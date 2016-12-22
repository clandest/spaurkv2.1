
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('users', function(table){
			table.string('user');
		}),
		knex.schema.alterTable('users', function(table){
			table.unique('user');
		})

	])
  
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('users', function(table){
			table.dropColumn('user');
		})
	])
  
};
