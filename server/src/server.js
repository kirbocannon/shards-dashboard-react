const cors = require('cors')
const feathers = require('@feathersjs/feathers')
const feathersExpress= require('@feathersjs/express')
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()) // TODO: this is wide open right now, look at narrowing it down

app.get('/api/hello', (req, res) => {
    res.send({ express: 'Hello From Express' });
});
//
// app.post('/api/world', (req, res) => {
//     console.log(req.body);
//     res.send(
//         `I received your POST request. This is what you sent me: ${req.body.post}`,
//     );
// });

// enable feathers rest services
// app.configure(feathersExpress.rest())



const constants = require('./config/constants')

const SpotifyApi = require('./modules/spotify')

const spotifyApi = new SpotifyApi()

spotifyApi.setCredentials(
    constants.SPOTIFY_USERID,
    constants.SPOTIFY_USERNAME,
    constants.SPOTIFY_PASSWORD
)

module.exports.spotifyApi = spotifyApi

const spotifyAuthRoutes = require('./api/routes/spotify/auth')

const spotifyMusicRoutes = require('./api/routes/spotify/music')

app.use((req, res, next) => { // set all requests to json content type
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.use('/api/spotify/auth', spotifyAuthRoutes)

app.use('/api/spotify/music', spotifyMusicRoutes)

app.use((req, res, next) => { // if you don't match a route at this point, catch endpoints that are not found
    const error = new Error(`Endpoint '${req.url}' does not exist`)
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => { // catch-all for functions that return errors. Error return has to be
    res.status(error.status || 500)      // implemented in route function
    res.json({
        error: {
            message: error.message
        }
    })
})

app.listen(port, () => console.log(`Listening on port ${port}`));

