const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const args = process.argv.slice(2);
const pool = new Pool({
	user: 'vagrant',
	password: '123',
	host: 'localhost',
	database: 'lightbnb',
});
pool
	.connect()
	.then(() => {
		console.log('Connected to the Database :>');
	})
	.catch((e) => {
		console.log('>>>>>>>>>Error<<<<<<<');
		console.log(e.message);
	});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
	return pool
		.query(
			`SELECT * 
	FROM users
	WHERE users.email = $1;`,
			[email]
		)
		.then((result) => result.rows[0])
		.catch((e) => {
			console.log('######Error######');
			console.log(e.message);
		});
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
	return pool
		.query(
			`SELECT * 
FROM users
WHERE users.id = $1;`,
			[id]
		)
		.then((result) => (result.rows[0]))
		.catch((e) => {
			console.log('######Error######');
			console.log(e.message);
		});
	//	return Promise.resolve(users[id]);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
	return pool.query(
	`INSERT INTO users (name, email, password)
	VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password]
	)
	.then((result) => result.rows[0])
	.catch((e) => {
		console.log('######Error######');
		console.log(e.message);
	});
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
	
	return pool
		.query(	`
 		SELECT reservations.*, properties.title, properties.thumbnail_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces, properties.cost_per_night, avg(property_reviews.rating) as average_rating
    FROM reservations
		JOIN property_reviews ON reservations.id = property_reviews.reservation_id
		JOIN properties ON reservations.property_id = properties.id
		WHERE reservations.guest_id = $1
		GROUP BY reservations.id, properties.title, properties.thumbnail_photo_url, properties.number_of_bedrooms, properties.number_of_bathrooms, properties.parking_spaces, properties.cost_per_night
    LIMIT $2;`, [guest_id, limit])
		.then((result) => {
			console.log('The Results: ', result.rows)
			return result.rows})
		.catch((err) => {
			console.log('######Error######');
			console.log(err.message);
		});
	
	
	//return getAllProperties(null, 2);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
	
		const queryParams = [];
		let queryString = `
			SELECT properties.*, avg(property_reviews.rating) as average_rating
			FROM properties
			JOIN property_reviews ON properties.id = property_id
		`;

		if (options.city) {
			queryParams.push(`%${options.city}%`);
			queryString += `WHERE city LIKE $${queryParams.length} `;
		}
		if (options.minimum_price_per_night) {
			if (queryParams.length > 0) {
				queryString += 'AND ';
			} else { 
				queryString += 'WHERE ';
			}
			queryParams.push(options.minimum_price_per_night * 100);
			queryString += `cost_per_night >= $${queryParams.length} `;
		}
		if (options.maximum_price_per_night) {
	
			if (queryParams.length > 0) {
				queryString += 'AND ';
			} else { 
				queryString += 'WHERE ';
			}
			queryParams.push(options.maximum_price_per_night * 100);
			queryString += `cost_per_night <= $${queryParams.length} `;
		}
		queryString += `
			GROUP BY properties.id
		`;
		if (options.minimum_rating) {
			queryParams.push(`${options.minimum_rating}`);
			queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
		}
		queryParams.push(limit);
		queryString += `
			ORDER BY cost_per_night
			LIMIT $${queryParams.length};
			`;

		console.log(queryString, queryParams);
	
		return pool
			.query(queryString, queryParams)
			.then((result) => result.rows)
			.catch((err) => {
				console.log(err.message);
			});
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
	
};
exports.addProperty = addProperty;
