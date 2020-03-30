import React from "react";

import {Redirect} from "react-router-dom";

import SpotifyApi from "../../api/spotify"

const spotifyApi = new SpotifyApi()

class SpotifyOauthCodeRedirect extends React.Component { // this prob doesn't need to be a class
  constructor(props) {
    super(props)

    this.state = {}
  }

  componentDidMount() { // need to handle if user does not accept the request
    const authCode = this.props.location.search.split("=")[1]
    //localStorage.setItem('SpotifyAuthCode', authCode) // horribly insecure, only do this in dev
    spotifyApi.setAuthorizedCode(authCode)
    window.close()
  }

  render() {
    return (<Redirect to="/blog-overview" />); // prob don't need this
  }
}

export default SpotifyOauthCodeRedirect;
