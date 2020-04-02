const constants = require('../../../config/constants')

const router = require("express").Router()

const SpotifyApi = require("../../../modules/spotify")

const spotifyApi = new SpotifyApi()

spotifyApi.setCredentials(
    constants.SPOTIFY_USERID,
    constants.SPOTIFY_USERNAME,
    constants.SPOTIFY_PASSWORD
)

router.get('/', (req, res, next) => {
    res.status(200).json({
        message: "handling get request to /spotify"
    })
})

router.get('/generateAccessToken', (req, res, next) => {
    res.status(200).json(spotifyApi.getCredentials())
})

// router.post('/post-test', (req, res, next) => {
//     console.log('Got body:', req.body);
//     res.sendStatus(200);
// });

router.post('/generateAccessToken-test', async (req, res, next) => {
    const tokenResp = await spotifyApi.generateAccessToken(req.body.authorized)
    const totalTracks = await spotifyApi.getSongCountFromPlaylists()
    console.log(totalTracks)
    res.sendStatus(200);
});

module.exports = router;