const router = require("express").Router()


router.get('/', (req, res, next) => {
    res.status(200).json({
        message: "handling get request to /spotify"
    })
})



module.exports = router