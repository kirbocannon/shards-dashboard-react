import constants from "../flux/constants";
import qs from 'qs'
import songStore from "../flux/stores/Songs";

const axios = require('axios').default;

axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';


const SpotifyApi = (function() {
  const _baseUri = 'https://api.spotify.com/v1'
  const _accessTokenUri = 'https://accounts.spotify.com/api/token'

  let _accessToken = String()
  var _userId = String()
  var _username = String()
  var _userPassword = String()


  const Constr = function() {}

  Constr.prototype = {
    constructor: SpotifyApi
  };

  Constr.prototype.generateAccessToken = function() {
    const data = { grant_type: constants.SPOTIFY_GRANT_TYPE };
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
        _accessToken = response.data.access_token
      })
    )
  }

  Constr.prototype.getPlaylists = function(limit, offset) {
    return (axios.get(
        `https://api.spotify.com/v1/users/${_userId}/playlists?limit=${limit}&offset=${offset}`, // make api call builder
        {headers: {'Authorization': `Bearer ${_accessToken}` }
        })
    )
  }

  Constr.prototype.getSongCountFromPlaylists = async function() {
    try {
      //const tokenResp = await this.getToken()
      const playlistsResp = await this.getPlaylists(constants.SPOTIFY_LIMIT, 0)
      const playlists = []
      let currentOffset = 0
      let next = playlistsResp.data.next
      let totalTracks = 0

      playlists.push(...playlistsResp.data.items)

      while (next) {
        currentOffset += constants.SPOTIFY_LIMIT
        let playlistsResp = await this.getPlaylists(constants.SPOTIFY_LIMIT, currentOffset)
        playlists.push(...playlistsResp.data.items)
        next = playlistsResp.data.next
      }

      playlists.forEach(playlist => {
        totalTracks += playlist.tracks.total
      })

      return totalTracks

    } catch (error) {
    console.error(error);
  }

  }

  Constr.prototype.setCredentials = function(uid, un, up) {
    _userId = uid
    _username = un
    _userPassword = up
  };

  Constr.prototype.getAccessToken = function() {
    return _accessToken
  };

  Constr.prototype.setAccessToken = function(accessToken) {
    _accessToken = accessToken;
  };

  return Constr

})()

// if (typeof module === 'object' && typeof module.exports === 'object') {
//   module.exports = SpotifyApi;
// }

export default SpotifyApi




