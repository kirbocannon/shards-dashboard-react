const constants = require('../../../config/constants')

const router = require("express").Router()

const SpotifyApi = require("../../../modules/spotify")

const spotifyApi = new SpotifyApi()

spotifyApi.setCredentials(
    constants.SPOTIFY_USERID,
    constants.SPOTIFY_USERNAME,
    constants.SPOTIFY_PASSWORD
)

router.post('/generate-access-token', async (req, res, next) => {
    await spotifyApi.generateAccessToken(req.body.authorized)
    //const a = await spotifyApi.getAuthorizedAccessToken()
    //console.log(a, 'trying in songs')
    // const totalTracks = await spotifyApi.getSongCountFromPlaylists()
    // console.log(totalTracks)
    res.sendStatus(200);
});

router.post('/tracks', async (req, res, next) => {
    const tracks = await spotifyApi.getTracks()
    res.json(tracks)
});

module.exports = router;