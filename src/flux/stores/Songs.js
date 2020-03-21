import { EventEmitter } from "events";

import Dispatcher from "../dispatcher";

import qs from 'qs'

import constants from "../constants"
import SpotifyApi from "../../api/spotify"

const spotifyApi = new SpotifyApi()


spotifyApi.setCredentials(
  constants.SPOTIFY_USERID,
  constants.SPOTIFY_USERNAME,
  constants.SPOTIFY_PASSWORD
)


class SongStore extends EventEmitter {
  constructor() {
    super()
  }

  async getAll() {
    const tokenResp = await spotifyApi.generateAccessToken()
    const totalTracks = await spotifyApi.getSongCountFromPlaylists()

    const tracks = await spotifyApi.getSongsFromAllPlaylists()
    console.log(tracks)

      return [
        {
          label: "Total Tracks From All Playlists",
          value: totalTracks,
          //value: 12,
          //percentage: "4.7%",
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
        },
        {
          label: "Total Unique Tracks", // don't count duplicates
          value: 0,
          //percentage: "4.7%",
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

    } catch (error) {
        console.error(error);
  }
}

const songStore = new SongStore();
//songStore.on("change", someHandler)
export default songStore
