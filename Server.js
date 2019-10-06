/* NOTE: everytime you save the file, the server restarts and run the js file again! */
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: '951753leon',
		database: 'smart-brain'
	}
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
});

app.post('/signin', (req, res) => {
	db.select('email', 'hash').from('login').where('email', '=', req.body.email)
		.then(data => {
			const isUserValid = bcrypt.compareSync(req.body.password, data[0].hash);
			if(isUserValid){
				return db.select('*').from('users').where('email','=', req.body.email)
				.then(user => {
					res.json(user[0])
				})
				.catch(err => res.status(400).json('Unable to get user!'))

			} else {
				res.status(400).json('Wrong credentials!');
			}
		})
		.catch(err => res.status(400).json('Wrong credentials!'))
});

app.post('/register', (req, res) => {
	const { email, name, password} = req.body;
	const hash = bcrypt.hashSync(password, 10);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: loginEmail[0],
				name: name,
				joined: new Date()
			}).then(user => {
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
		.catch(err => res.status(400).json('Unable to register!'));
});

// :id - this syntax allows to enter anything after profile/ 
// in order to get the string after profile/ we write req.params
//for example: profile/4563
// req.params = 4563
app.get('/profile/:id', (req, res) => {
	const {id} = req.params;
	db.select('*').from('users').where({
		id: id
	})
	.then(user => {
		if(user.length > 0){
			res.json(user[0]);
		} else {
			res.status(400).json('User not found!')
		}	
	})
	.catch(err => res.status(400).json('Error getting user!'))
});

app.put('/image', (req, res) => {
	const {id} = req.body;
	db('users').where('id', '=', id).increment('entries', 1).returning('entries')
	.then(entries => {
		res.json(entries[0])
	})
	.catch(err => res.status(400).json('Unable to get entries'))
});

app.listen(3000, () => {
	console.log('App is running on port 3000');
});
