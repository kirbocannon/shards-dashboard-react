import React from "react";
import Modal from 'react-bootstrap/Modal' // look at importing shards-react vs react-bootstrap
import {Button, Row} from "shards-react";

import constants from "../../flux/constants"
import SongStore from "../../flux/stores/Songs";
import SpotifyApi from "../../api/spotify"
import {Redirect, Route} from "react-router-dom";


class SpotifyOauthAuthorization extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      show: false,
    }
    this.spotifyApi = new SpotifyApi()
    this.spotifyApi.setCredentials(
      constants.SPOTIFY_USERID,
      constants.SPOTIFY_USERNAME,
      constants.SPOTIFY_PASSWORD
    )
  }

  static popupWindow(url, title, win, w, h) { // prob break this out in a more general module
    const y = win.top.outerHeight / 2 + win.top.screenY - ( h / 2);
    const x = win.top.outerWidth / 2 + win.top.screenX - ( w / 2);
    return win.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+y+', left='+x);
  }

  handleClose = () => {
    this.setState({show: false})
  }

  handleShow = () => {
    this.setState({show: true})
    this.spotifyApi.authorize(
      constants.SPOTIFY_USERNAME,
      'user-library-read',
      `${constants.SPOTIFY_REDIRECT_URI}`).then(response => {
      this.setState({redirectURL: response.request.responseURL})
    })
  }

  componentDidMount() {}

  render() {
    return (
      <>
        <Button variant="primary" onClick={this.handleShow}>
          Launch demo modal
        </Button>

        {this.state.show ?

          <Route path='/blog-overview' component={() => {
            //window.location.href = this.state.redirectURL
            SpotifyOauthAuthorization.popupWindow(`${this.state.redirectURL}`, 'Spotify Login', window, 1000, 750)
            return null;
          }}/> : 'hello'

        }
      </>
    );
  }
}

export default SpotifyOauthAuthorization;
