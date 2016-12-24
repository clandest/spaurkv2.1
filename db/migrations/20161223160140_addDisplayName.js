
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('genre', function(table){
			table.string('genreShowName');
		}),

		knex.schema.table('category', function(table){
			table.string('categoryShowName');
		}),

	])
  
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('genre', function(table){
			table.dropColumn('genreShowName');
		}),

		knex.schema.table('category', function(table){
			table.dropColumn('categoryShowName');
		}),

	])
  
};
