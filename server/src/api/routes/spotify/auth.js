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

// router.get('/generateAccessToken', (req, res, next) => {
//     res.status(200).json(spotifyApi.getCredentials())
// })

// router.post('/post-test', (req, res, next) => {
//     console.log('Got body:', req.body);
//     res.sendStatus(200);
// });

router.post('/generate-access-token', async (req, res, next) => {
    await spotifyApi.generateAccessToken(req.body.authorized)
    //const a = await spotifyApi.getAuthorizedAccessToken()
    //console.log(a, 'trying in songs')
    // const totalTracks = await spotifyApi.getSongCountFromPlaylists()
    // console.log(totalTracks)

    // const tracks = await spotifyApi._getTracks()
    // console.log(tracks)

    const tracks = await spotifyApi._getTracks()

    res.setHeader('Content-Type', 'application/json');

    res.json(tracks.data)

    //res.sendStatus(200);
});

router.post('/tracks', async (req, res, next) => {
    const tracks = await spotifyApi._getTracks()
    res.json(tracks)
});

module.exports = router;