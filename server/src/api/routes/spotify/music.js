const router = require("express").Router()

const {spotifyApi} = require('../../../server')

router.get('/tracks', async (req, res, next) => {
    const tracks = await spotifyApi.getTracks()
    res.json(tracks)
});

module.exports = router;
