//const constants = require('../../../config/constants')

const router = require("express").Router()

//const { spotifyApi } = require('../../../server');

// const SpotifyApi = require("../../../modules/spotify")
//
// const spotifyApi = new SpotifyApi()
//
// spotifyApi.setCredentials(
//     constants.SPOTIFY_USERID,
//     constants.SPOTIFY_USERNAME,
//     constants.SPOTIFY_PASSWORD
// )

const {spotifyApi} = require('../../../server')

router.post('/generate-access-token', async (req, res, next) => {
    await spotifyApi.generateAccessToken(req.body.authorized)
    //const a = await spotifyApi.getAuthorizedAccessToken()
    //console.log(a, 'trying in songs')
    // const totalTracks = await spotifyApi.getSongCountFromPlaylists()
    // console.log(totalTracks)
    res.sendStatus(200);
});

router.post('/generate-auth-code', async (req, res, next) => {
    const authCode = await spotifyApi.authorize(
        req.body.username,
        req.body.scope,
        req.body.callbackUri
        )
    res.json({responseUrl: authCode.request.res.responseUrl});
});

router.get('/set-auth-code', function (req, res, next) {
    spotifyApi.setAuthorizedCode(req.query.authCode)
    res.sendStatus(200);
});


module.exports = router;