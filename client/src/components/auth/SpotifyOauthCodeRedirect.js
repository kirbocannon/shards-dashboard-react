import React from "react";

import {Redirect} from "react-router-dom";

import constants from "../../flux/constants";

const axios = require('axios').default

class SpotifyOauthCodeRedirect extends React.Component { // this prob doesn't need to be a class
  constructor(props) {
    super(props)

    this.state = {}
  }

  componentDidMount() { // need to handle if user does not accept the request
    const authCode = this.props.location.search.split("=")[1]
    console.log(authCode)
    axios.get(`spotify/auth/set-auth-code?authCode=${authCode}`)
    // once auth code is received, store it in redis

    //localStorage.setItem('SpotifyAuthCode', authCode) // horribly insecure, only do this in dev
    //spotifyApi.setAuthorizedCode(authCode)
    window.close()
  }

  render() {
    return (<Redirect to="/blog-overview" />); // prob don't need this
  }
}

export default SpotifyOauthCodeRedirect;
