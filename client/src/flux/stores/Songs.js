import { EventEmitter } from "events";

import Dispatcher from "../dispatcher";

import constants from "../constants"
import SpotifyApi from "../../api/spotify"


class SongStore extends EventEmitter {
  constructor() {
    super()
    this.spotifyApi = new SpotifyApi()
    this.spotifyApi.setCredentials(
      constants.SPOTIFY_USERID,
      constants.SPOTIFY_USERNAME,
      constants.SPOTIFY_PASSWORD
    )
  }

  async getAll() {
    const tokenResp = await this.spotifyApi.generateAccessToken('nonauthorized')
    const totalTracks = await this.spotifyApi.getSongCountFromPlaylists()
    console.log(totalTracks)

    const authToken = await this.spotifyApi.generateAccessToken('authorized')
    console.log(this.spotifyApi.getAuthorizedAccessToken(), 'trying to in songs')
    // //
    // // //const tracks = await spotifyApi.getAllTracks()
    const tracks = await this.spotifyApi._getTracks()
    console.log(tracks)

    // const response = await fetch('/api/hello');
    // const body = await response.json();
    // console.log(body)


    // const refreshToken = await this.spotifyApi.generateAccessToken('refresh')
    // console.log('refresh token', refreshToken)

    //const tracks = await spotifyApi.getSongsFromAllPlaylists()
    //console.log(tracks.tracks, tracks.totalTrackCount)



      return [
        {
          label: "Total Tracks From Playlists",
          //value: totalTracks,
          value: 100,
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
          //value: tracks.totalTrackCount,
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
