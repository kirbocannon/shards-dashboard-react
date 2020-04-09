const cors = require('cors')
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())

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

app.use((req, res, next) => { // set all requests to json content type
    res.setHeader('Content-Type', 'application/json');
    next();
});

app.use('/api/spotify/auth', spotifyAuthRoutes)

app.use((req, res, next) => { // catch endpoints that are not found
    const error = new Error(`Endpoint '${req.url}' does not exist`)
    error.status = 404
    next(error)
})

app.use((error, req, res, next) => { // catch-all for functions that return errors
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
})

app.listen(port, () => console.log(`Listening on port ${port}`));

