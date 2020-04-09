import constants from "../flux/constants";
import qs from 'qs'
import songStore from "../flux/stores/Songs";

const axios = require('axios').default;
axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';


const SpotifyApi = (function () {
  const _baseUri = 'https://api.spotify.com/v1'
  const _accessTokenUri = 'https://accounts.spotify.com/api/token'
  const _authTokenUri = 'https://accounts.spotify.com/authorize'
  const _limit = constants.SPOTIFY_LIMIT

  let _accessToken = String()
  let _authorizedAccessToken = String();
  let _refreshToken = String();
  let _userId = String();
  let _username = String();
  let _userPassword = String();


  const Constr = function () {
  }

  Constr.prototype = {
    constructor: SpotifyApi
  };

  Constr.prototype._buildRequest = function (method, endpoint, data = {}, authorized = false, accessToken = null, externalURL = false) {
    // need to do some logic here based on grant type
    let url = String()
    let headers = {}

    if (!externalURL) {
      url = _baseUri + '/' + endpoint
    } else {
      url = endpoint
    }

    if (!accessToken) {

      if (!authorized)  {
        accessToken = this.getAccessToken()
        headers.Authorization =`Bearer ${accessToken}`
      }

      if (!endpoint.includes(_authTokenUri) && !endpoint.includes(_accessTokenUri) && authorized) {
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

  Constr.prototype._sendRequest = function (method, endpoint, data = {}, authorized = false, accessToken, externalURL = false) {
    const options = this._buildRequest(method, endpoint, data, authorized, accessToken, externalURL)

    return (axios(options))
  }

  Constr.prototype.generateAccessToken = function (reqType = null) {
    // user required to login to spotify at redirection and generate auth code
    // auth code is used to get initial access token and refresh token
    // refresh token (14-60 day) and temp access token are stored in local storage (bad)
    // access token seems to last like 10 seconds
    // refresh token used to get a new access token, right now at every API call a token is refreshed

    let authorized = false
    let refreshTokenExists = !!this.getRefreshToken()
    reqType = reqType.toUpperCase()
    let options = {}

    function _buildOptions(data, stringify=false) {
      if (stringify) {
        data = qs.stringify(data)
      }
      return {
        method: 'POST',
        auth: {
          username: _username,
          password: _userPassword,
        },
        data: data,
        url: _accessTokenUri,
      }
    }

    switch (reqType) {
      case 'NONAUTHORIZED':
        options = _buildOptions(
          {grant_type: 'client_credentials'},
          true
        )
        break;
      case 'AUTHORIZED':
        authorized = true
        if (refreshTokenExists) {
          options = _buildOptions(
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

  Constr.prototype.getPlaylists = function (limit = _limit, offset = 0) {

    return (this._sendRequest(
      'GET',
      `users/${_userId}/playlists?limit=${limit}&offset=${offset}` // don't think we need offset here
    ))
  }

  Constr.prototype.getTracksFromPlaylist = function (
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

  Constr.prototype._getAllNextItems = async function (funcName) {
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
      firstResp = await this[funcName].apply(this, [...args, _limit, 0])
    }

    if (!requiresArgs) {
      next = firstResp.data.next

      items.push(...firstResp.data.items)

      while (next) {
        currentOffset += _limit
        let nextResp = await this[funcName](_limit, currentOffset)
        items.push(...nextResp.data.items)
        next = nextResp.data.next
      }
    } else {
      next = firstResp.data.next

      items.push(...firstResp.data.items)

      while (next) {
        currentOffset += _limit
        let nextResp = await this[funcName].apply(this, [...args, _limit, currentOffset])
        items.push(...nextResp.data.items)
        next = nextResp.data.next
      }
    }

    return items

  }

  Constr.prototype._getTracks = async function (limit = _limit, offset = 0) {
    return this._sendRequest(
      'GET',
      `me/tracks?limit=${limit}&offset=${offset}`,
      {},
      true,
      `${this.getAuthorizedAccessToken()}`,
      false
    )
  }

  Constr.prototype.authorize = async function (username, scope, redirectURI) {

    return this._sendRequest(
      'GET',
      _authTokenUri +
        '?client_id=' + username +
        '&response_type=code' +
        '&scope=' + scope +
        '&redirect_uri=' + redirectURI,
      {},
      true,
      null,
      true
    )

    // await this._sendRequest(
    //   'GET',
    //   _authTokenUri +
    //   '?client_id=' + username +
    //   '&response_type=code' +
    //   '&scope=' + scope +
    //   '&redirect_uri=' + redirectURI,
    //   {},
    //   true,
    //   true
    // )

  }

  // Constr.prototype.getAllTracks = async function () {
  //   //return axios(options)
  //
  //   //return await this._getAllNextItems('_getTracks')
  // }

  // Constr.prototype.getSongsFromAllPlaylists = async function() {
  //   // This function will get all tracks from a playlist.
  //   // It will automatically remove duplicates
  //   // this function is just too slow so commenting out for now
  //
  //   const playlists = await this._getAllNextItems('getPlaylists')
  //   const tracks = []
  //
  //   let totalTrackCount = 0
  //
  //   for (let i=0; i < playlists.length; i++) { // only doing up to 3 playlists now
  //     let playlistsTracks = new Set()
  //
  //     let playlistTracksResp = await this._getAllNextItems(
  //       'getTracksFromPlaylist',
  //       playlists[i].id
  //     )
  //
  //     playlistTracksResp.forEach(track => {
  //       playlistsTracks.add(track.track.name)
  //     })
  //
  //     console.log(playlistsTracks)
  //
  //     totalTrackCount += playlistsTracks.size // get set length
  //
  //     tracks.push(
  //       {
  //         'playlist': playlists[i].name,
  //         'tracks': Array.from(playlistsTracks) // convert set to array
  //       })
  //   }
  //
  //   return {'tracks': tracks, 'totalTrackCount': totalTrackCount}
  //
  // }

  Constr.prototype.getSongCountFromPlaylists = async function () {
    // includes duplicates
    const playlists = await this._getAllNextItems('getPlaylists')
    let totalTracks = 0

    playlists.forEach(playlist => {
      totalTracks += playlist.tracks.total
    })

    return totalTracks

  }

  Constr.prototype.setCredentials = function (uid, un, up) {
    _userId = uid
    _username = un
    _userPassword = up
  };

  Constr.prototype.getCredentials = function () {

    return {
      userId: _userId,
      username: _username,
      userPassword: _userPassword
    }
  };

  // Constr.prototype.setRedirectURL = function (redirectURL) {
  //
  // };

  Constr.prototype.getAccessToken = function () {
    return _accessToken
  };

  Constr.prototype.setAccessToken = function (accessToken) {
    _accessToken = accessToken;
  };

  Constr.prototype.getRefreshToken = function () {
    return localStorage.getItem('refreshToken')
    //return _refreshToken
  };

  Constr.prototype.setRefreshToken = function (refreshToken) {
    _refreshToken = refreshToken;
    localStorage.setItem('refreshToken', refreshToken)
  };

  Constr.prototype.getAuthorizedCode = function () {
    //_authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
    //return _authorizedAccessToken
    return localStorage.getItem('SpotifyAuthCode')
  };

  Constr.prototype.setAuthorizedCode = function (code) {
    //_authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
    //return _authorizedAccessToken
    return localStorage.setItem('SpotifyAuthCode', code)
  };

  Constr.prototype.getAuthorizedAccessToken = function () {
    return localStorage.getItem('authorizedAccessToken')
    //return _authorizedAccessToken
  };

  Constr.prototype.setAuthorizedAccessToken = function (authorizedAccessToken) {
    //_authorizedAccessToken = localStorage.getItem('SpotifyAuthCode');
    localStorage.setItem('authorizedAccessToken', authorizedAccessToken)
    _authorizedAccessToken = authorizedAccessToken
    //return _authorizedAccessToken
  };

  return Constr

})()

export default SpotifyApi
