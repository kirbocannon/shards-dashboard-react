import { EventEmitter } from "events";

import Dispatcher from "../dispatcher";

import qs from 'qs'

import constants from "../constants"

const axios = require('axios').default;

axios.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

class SongStore extends EventEmitter {
  constructor() {
    super()

    this.userId = constants.SPOTIFY_USERID
    this.username = constants.SPOTIFY_USERNAME
    this.userPassword = constants.SPOTIFY_PASSWORD
    this._accessToken = '' // needs to move
    this.smallStats = [
      {
        label: "Songs",
        value: "5,391",
        percentage: "4.7%",
        increase: true,
        chartLabels: [null, null, null, null, null, null, null],
        attrs: { md: "6", sm: "6" },
        datasets: [
          {
            label: "Today",
            fill: "start",
            borderWidth: 1.5,
            backgroundColor: "rgba(0, 184, 216, 0.1)",
            borderColor: "rgb(0, 184, 216)",
            data: [1, 2, 1, 3, 5, 4, 7]
          }
        ]
      }
    ]
  }

  getToken() { // needs to move
    const data = { grant_type: constants.SPOTIFY_GRANT_TYPE };
    const options = {
      method: 'POST',
      auth: {
        username: this.username, // need to get this from secure datastore
        password: this.userPassword, // need to get this from secure datastore

      },
      data: qs.stringify(data),
      url: constants.SPOTIFY_TOKEN_URL,
    };

    return (axios(options).then(response => {
      this._accessToken = response.data.access_token
    })
    )
  }

  getPlaylists() {
    return (axios.get(
      `https://api.spotify.com/v1/users/${this.userId}/playlists`,
      {headers: {'Authorization': `Bearer ${this._accessToken}` }
      })
    )
  }

  async getAll() {
    try {
      const tokenResp = await this.getToken()
      const playlistsResp = await this.getPlaylists()
      return 'balls1'
    } catch (error) {
      console.error(error);
    }

  }
}

const songStore = new SongStore();
//songStore.on("change", someHandler)
export default songStore
