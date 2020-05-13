//"use strict";
const constants = require('../config/constants')
const qs = require('querystring')

const axios = require('axios').default;
axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

const redisModule = require("redis");
const redis = redisModule.createClient();

const { promisify } = require("util");

// redisModule.on("error", function(error) {
//   console.error(error);
// });

// convert .get to promise since everything is async
const redisGetAsync = promisify(redis.get).bind(redis);

//getAsync.then(console.log).catch(console.error);

// client.set("key", "value", redis.print);
// client.get("key", redis.print);

function SpotifyApi() {
  this._baseUri = 'https://api.spotify.com/v1'
  this._accessTokenUri = 'https://accounts.spotify.com/api/token'
  this._authTokenUri = 'https://accounts.spotify.com/authorize'
  this._userId = String();
  this._username = String();
  this._userPassword = String();
  this._limit = constants.SPOTIFY_LIMIT

}

SpotifyApi.prototype._buildRequest = async function (method, endpoint, data = {}, authorized = false, externalURL = false) {
  // need to do some logic here based on grant type
  let url = String()
  let headers = {}

  if (!externalURL) {
    url = this._baseUri + '/' + endpoint
  } else {
    url = endpoint
  }

  if (!authorized) {
    headers.Authorization =`Bearer ${await this.getAccessToken()}`

  } else if (authorized) {
    headers.Authorization =`Bearer ${await this.getAccessToken()}`
  }

  // if (!endpoint.includes(this._authTokenUri) && !endpoint.includes(this._accessTokenUri) && authorized) { // TODO: this is confusing and needs to be rewritten
  //   headers.Authorization =`Bearer ${await this.getAuthorizedCode()}`
  // }

  const options = {
    method: method,
    headers: headers,
    url: url
  }

  if (options.auth === 'POST' && data) {
    options.data = qs.stringify(data)
  }

  //console.log(options)

  return options

}

SpotifyApi.prototype._sendRequest = async function (method, endpoint, data = {}, authorized = false, externalURL = false) {
  const options = await this._buildRequest(method, endpoint, data, authorized, externalURL)

  return (axios(options))
}

SpotifyApi.prototype._buildGenerateAccessTokenOptions = function(data, stringify=false) {
  if (stringify) {
    data = qs.stringify(data)
  }
  return {
    method: 'POST',
    auth: {
      username: this._username,
      password: this._userPassword,
    },
    data: data,
    url: this._accessTokenUri,
  }
}

SpotifyApi.prototype.generateAccessToken = async function (authorized = false) {
  // user required to login to spotify at redirection and generate auth code
  // auth code is used to get initial access token and refresh token
  // refresh token (14-60 day) and temp access token are stored in local storage (bad)
  // access token seems to last like 10 seconds
  // refresh token used to get a new access token, right now at every API call a token is refreshed

  //let authorized = false
  let refreshTokenExists = !!await this.getRefreshToken()
  let reqType = !authorized ? 'NONAUTHORIZED' : "AUTHORIZED"
  let options = {}

  switch (reqType) {
    case 'NONAUTHORIZED':
      options = this._buildGenerateAccessTokenOptions(
          {grant_type: 'client_credentials'},
          true
      )
      break;
    case 'AUTHORIZED':
      authorized = true
      if (refreshTokenExists) {
        options = this._buildGenerateAccessTokenOptions(
            {
              grant_type: 'refresh_token',
              refresh_token: await this.getRefreshToken()
            },
            true
        )
      } else {
        options = this._buildGenerateAccessTokenOptions(
            {
              grant_type: 'authorization_code',
              redirect_uri: constants.SPOTIFY_AUTH_CALLBACK_URI, // TODO.txt: work on solid location on where to keep everything
              code: await this.getAuthorizedCode()
            },
            true
        )
      }
      break;
    default:
  }

  //console.log(options, '--------------------')

  return (axios(options).then(response => {
        if (!authorized) {
          this.setAccessToken(response.data.access_token)
        }
        else if (authorized) {
          this.setAuthorizedAccessToken(response.data.access_token)

          if (!refreshTokenExists) { // TODO: Need to do some timeout for this
            this.setRefreshToken(response.data.refresh_token)
          }
        }
      })
  )
}

SpotifyApi.prototype.getPlaylists = function (limit = this._limit, offset = 0) {

  return (this._sendRequest(
      'GET',
      `users/${this._userId}/playlists?limit=${limit}&offset=${offset}` // don't think we need offset here
  ))
}

SpotifyApi.prototype.getTracksFromPlaylist = function (
    playlistId,
    limit,
    offset
    //duplicates = false
) {

  return this._sendRequest(
      'GET',
      `playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
  )
}

SpotifyApi.prototype._getAllNextItems = async function (funcName) {
  // might be a better way to do this - also handle args
  const items = []
  let currentOffset = 0
  let firstResp = null // huh?
  let next = null // huh?
  let args = Array.prototype.slice.call(arguments, 1)
  let requiresArgs = arguments.length > 1

  if (!requiresArgs) {
    firstResp = await this[funcName]()
  } else {
    // apply function with additional arguments
    firstResp = await this[funcName].apply(this, [...args, this._limit, 0])
  }

  if (!requiresArgs) {
    next = firstResp.data.next

    items.push(...firstResp.data.items)

    while (next) {
      currentOffset += this._limit
      let nextResp = await this[funcName](this._limit, currentOffset)
      items.push(...nextResp.data.items)
      next = nextResp.data.next
    }
  } else {
    next = firstResp.data.next

    items.push(...firstResp.data.items)

    while (next) {
      currentOffset += this._limit
      let nextResp = await this[funcName].apply(this, [...args, this._limit, currentOffset])
      items.push(...nextResp.data.items)
      next = nextResp.data.next
    }
  }

  return items

}

SpotifyApi.prototype.getTracks = async function (limit = this._limit, offset = 0) {
  //method, endpoint, data = {}, authorized = false, externalURL = false
  const res = await this._sendRequest(
      'GET',
      `me/tracks?limit=${limit}&offset=${offset}`,
      {},
      true,
      false
  )



  return res.data
}

SpotifyApi.prototype.authorize = async function (username, scope, callbackUri) {

  return this._sendRequest(
      'GET',
      this._authTokenUri +
      '?client_id=' + username +
      '&response_type=code' +
      '&scope=' + scope +
      '&redirect_uri=' + callbackUri,
      {},
      true,
      true
  )
}

SpotifyApi.prototype.getSongCountFromPlaylists = async function () {
  // includes duplicates
  const playlists = await this._getAllNextItems('getPlaylists')
  let totalTracks = 0

  playlists.forEach(playlist => {
    totalTracks += playlist.tracks.total
  })

  return totalTracks

}

SpotifyApi.prototype.setCredentials = function (uid, un, up) {
  this._userId = uid
  this._username = un
  this._userPassword = up
};

SpotifyApi.prototype.getCredentials = function () {

  return {
    userId: this._userId,
    username: this._username,
    userPassword: this._userPassword
  }
};

SpotifyApi.prototype.getAccessToken = function () {
  return redisGetAsync(`auth.accesstoken:${this._userId}`)
};

SpotifyApi.prototype.setAccessToken = function (accessToken) {
  return redis.set(`auth.accesstoken:${this._userId}`, accessToken)
};

SpotifyApi.prototype.getRefreshToken = function () {
  return redisGetAsync(`auth.refreshtoken:${this._userId}`)
};

SpotifyApi.prototype.setRefreshToken = function (refreshToken) {
  return redis.set(`auth.refreshtoken:${this._userId}`, refreshToken)

};

SpotifyApi.prototype.getAuthorizedCode = function () {
  return redisGetAsync(`auth.code:${this._userId}`)
};

SpotifyApi.prototype.setAuthorizedCode = function (code) {
  redis.set(`auth.code:${this._userId}`, code);
};

SpotifyApi.prototype.getAuthorizedAccessToken = function () {
  return redisGetAsync(`auth.accesstoken:${this._userId}`)
};

SpotifyApi.prototype.setAuthorizedAccessToken = function (authorizedAccessToken) {
  return redis.set(`auth.accesstoken:${this._userId}`, authorizedAccessToken)
};

module.exports = SpotifyApi

