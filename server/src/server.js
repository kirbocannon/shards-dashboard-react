const constants = require('./config/constants')

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

const SpotifyApi = require("./modules/spotify")

const spotifyApi = new SpotifyApi()

spotifyApi.setCredentials(
    constants.SPOTIFY_USERID,
    constants.SPOTIFY_USERNAME,
    constants.SPOTIFY_PASSWORD
)

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.get('/api/hello', (req, res) => {
//     res.send({ express: 'Hello From Express' });
// });
//
// app.post('/api/world', (req, res) => {
//     console.log(req.body);
//     res.send(
//         `I received your POST request. This is what you sent me: ${req.body.post}`,
//     );
// });

const spotifyAuthRoutes = require('./api/routes/spotify/auth')

app.use('/api/spotify/auth', spotifyAuthRoutes)

app.listen(port, () => console.log(`Listening on port ${port}`));

