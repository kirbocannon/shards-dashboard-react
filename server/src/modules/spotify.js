//"use strict";
const constants = require('../config/constants')
const qs = require('querystring')

const axios = require('axios').default;
axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

const redisModule = require("redis");
const redis = redisModule.createClient();

const { promisify } = require("util");

redis.on("error", function(error) {
  console.error(error);
});

// convert .get to promise since everything is async
const getAsync = promisify(redis.get).bind(redis);

//getAsync.then(console.log).catch(console.error);

// client.set("key", "value", redis.print);
// client.get("key", redis.print);

function SpotifyApi() {
  this._baseUri = 'https://api.spotify.com/v1'
  this._accessTokenUri = 'https://accounts.spotify.com/api/token'
  this._authTokenUri = 'https://accounts.spotify.com/authorize'
  this._accessToken = String()
  this._authorizedAccessToken = String();
  this._refreshToken = String();
  this._userId = String();
  this._username = String();
  this._userPassword = String();
  this._limit = constants.SPOTIFY_LIMIT

}

SpotifyApi.prototype._buildRequest = function (method, endpoint, data = {}, authorized = false, accessToken = null, externalURL = false) {
  // need to do some logic here based on grant type
  let url = String()
  let headers = {}

  if (!externalURL) {
    url = this._baseUri + '/' + endpoint
  } else {
    url = endpoint
  }

  if (!accessToken) {

    if (!authorized)  {
      accessToken = this.getAccessToken()
      headers.Authorization =`Bearer ${accessToken}`
    }

    if (!endpoint.includes(this._authTokenUri) && !endpoint.includes(this._accessTokenUri) && authorized) {
      accessToken = this.getAuthorizedCode()
      headers.Authorization =`Bearer ${accessToken}`
    }
  } else if (authorized) {
    headers.Authorization =`Bearer ${accessToken}`
  }

  const options = {
    method: method,
    headers: headers,
    url: url
  }

  if (options.auth === 'POST' && data) {
    options.data = qs.stringify(data)
  }

  return options

}

SpotifyApi.prototype._sendRequest = function (method, endpoint, data = {}, authorized = false, accessToken, externalURL = false) {
  const options = this._buildRequest(method, endpoint, data, authorized, accessToken, externalURL)

  return (axios(options))
}

SpotifyApi.prototype._buildGenerateAccessTokenOptions = function(url, data, stringify=false) {
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

SpotifyApi.prototype.generateAccessToken = function (authorized = false) {
  // user required to login to spotify at redirection and generate auth code
  // auth code is used to get initial access token and refresh token
  // refresh token (14-60 day) and temp access token are stored in local storage (bad)
  // access token seems to last like 10 seconds
  // refresh token used to get a new access token, right now at every API call a token is refreshed

  //let authorized = false
  let refreshTokenExists = !!this.getRefreshToken()
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
              refresh_token: this.getRefreshToken()
            },
            true
        )
      } else {
        options = _buildOptions(
            {
              grant_type: 'authorization_code',
              redirect_uri: constants.SPOTIFY_AUTH_CALLBACK_URI, // TODO.txt: work on solid location on where to keep everything
              code: this.getAuthorizedCode()
            },
            true
        )
      }
      break;
    default:
  }

  return (axios(options).then(response => {
        if (!authorized) {
          this.setAccessToken(response.data.access_token)
        }
        else if (authorized) {
          this.setAuthorizedAccessToken(response.data.access_token)

          if (!refreshTokenExists) {
            this.setRefreshToken(response.data.refresh_token)
          }
        }
      })
  )
}

SpotifyApi.prototype.getPlaylists = function (limit = _limit, offset = 0) {

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

SpotifyApi.prototype._getTracks = async function (limit = this._limit, offset = 0) {
  return this._sendRequest(
      'GET',
      `me/tracks?limit=${limit}&offset=${offset}`,
      {},
      true,
      `${this.getAuthorizedAccessToken()}`,
      false
  )
}

SpotifyApi.prototype.authorize = async function (username, scope, redirectURI) {

  return this._sendRequest(
      'GET',
      this._authTokenUri +
      '?client_id=' + username +
      '&response_type=code' +
      '&scope=' + scope +
      '&redirect_uri=' + redirectURI,
      {},
      true,
      null,
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
  return this._accessToken
};

SpotifyApi.prototype.setAccessToken = function (accessToken) {
  this._accessToken = accessToken;
};

SpotifyApi.prototype.getRefreshToken = function () {
  //return localStorage.getItem('refreshToken')
  //return this._refreshToken
};

SpotifyApi.prototype.setRefreshToken = function (refreshToken) {
  //this._refreshToken = refreshToken;
  //localStorage.setItem('refreshToken', refreshToken)
};

SpotifyApi.prototype.getAuthorizedCode = function () {
  //this._authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
  //return this._authorizedAccessToken
  //return localStorage.getItem('SpotifyAuthCode')
  return redis.get(`auth.code:${this._userId}`);
};

SpotifyApi.prototype.setAuthorizedCode = function (code) {
  //this._authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
  //return this._authorizedAccessToken
  //return localStorage.setItem('SpotifyAuthCode', code)
  redis.set(`auth.code:${this._userId}`, code);
};

SpotifyApi.prototype.getAuthorizedAccessToken = function () {
  //return localStorage.getItem('authorizedAccessToken')
  //return this._authorizedAccessToken
};

SpotifyApi.prototype.setAuthorizedAccessToken = function (authorizedAccessToken) {
  //this._authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
  //localStorage.setItem('authorizedAccessToken', authorizedAccessToken)
  //this._authorizedAccessToken = authorizedAccessToken
  //return this._authorizedAccessToken
};

module.exports = SpotifyApi

