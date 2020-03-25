import constants from "../flux/constants";
import qs from 'qs'
import songStore from "../flux/stores/Songs";

const axios = require('axios').default;

axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';


const SpotifyApi = (function () {
  const _baseUri = 'https://api.spotify.com/v1'
  const _accessTokenUri = 'https://accounts.spotify.com/api/token'

  let _accessToken = String()
  let _userId = String();
  let _username = String();
  let _userPassword = String();
  const _limit = constants.SPOTIFY_LIMIT


  const Constr = function () {
  }

  Constr.prototype = {
    constructor: SpotifyApi
  };

  Constr.prototype._buildRequest = function (method, endpoint, data = {}) {
    // need to do some logic here based on grant type
    data.grant_type = constants.SPOTIFY_GRANT_TYPE
    const headers = {'Authorization': `Bearer ${this.getAccessToken()}`}
    const options = {
      method: method,
      headers: headers,
      url: _baseUri + '/' + endpoint
    }

    if (options.auth === 'POST' && data) {
      options.data = qs.stringify(data)
    }

    return options

  }

  Constr.prototype._sendRequest = function (method, endpoint, data = {}) {
    const options = this._buildRequest(method, endpoint, data)

    return (axios(options))
  }

  Constr.prototype.generateAccessToken = function () {
    const data = {grant_type: constants.SPOTIFY_GRANT_TYPE};
    const options = {
      method: 'POST',
      auth: {
        username: _username, // need to get this from secure datastore
        password: _userPassword, // need to get this from secure datastore

      },
      data: qs.stringify(data),
      url: _accessTokenUri,
    };

    return (axios(options).then(response => {
        this.setAccessToken(response.data.access_token)
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
      `me/tracks?limit=${limit}&offset=${offset}`
    )
  }

  Constr.prototype.getAllTracks = async function () {

    const headers = {}
    const options = {
      method: 'GET',
      headers: headers,
      url: 'https://accounts.spotify.com/authorize' +
        '?client_id=' + _username +
        '&response_type=code' +
        '&scope=user-library-read' +
        '&redirect_uri=http://localhost:3000/callback'
    }

    return axios(options)



    //return await this._getAllNextItems('_getTracks')
  }

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

  Constr.prototype.getAccessToken = function () {
    return _accessToken
  };

  Constr.prototype.setAccessToken = function (accessToken) {
    _accessToken = accessToken;
  };

  return Constr

})()

export default SpotifyApi
