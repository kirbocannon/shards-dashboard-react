import React from "react";

import {Redirect} from "react-router-dom";


class SpotifyOauthCodeRedirect extends React.Component { // this prob doesn't need to be a class
  constructor(props) {
    super(props)

    this.state = {

    }
  }

  componentDidMount() { // need to handle if user does not accept the request
    const authCode = this.props.location.search.split("=")[1]
    localStorage.setItem('SpotifyAuthCode', authCode) // horribly insecure, only do this in dev
    window.close()
    console.log(authCode)
  }


  render() {
    return (<Redirect to="/blog-overview" />);
  }
}

export default SpotifyOauthCodeRedirect;
