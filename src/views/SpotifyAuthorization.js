import React from "react";
import Modal from 'react-bootstrap/Modal' // look at importing shards-react vs react-bootstrap
import {Button} from "shards-react";


class SpotifyAuthorization extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      show: false,
    }
  }

  handleClose = () => {
    this.setState({show: false})
  }

  handleShow = () => {
    this.setState({show: true})

  }

  componentDidMount() {

  }

  render() {
    return (
      <>
        <Button variant="primary" onClick={this.handleShow}>
          Launch demo modal
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.handleClose}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  // render() {
  //   return (<>
  //   <Modal.Dialog>
  //     <Modal.Header closeButton>
  //       <Modal.Title>Modal title</Modal.Title>
  //     </Modal.Header>
  //
  //     <Modal.Body>
  //       <p>Modal body text goes here.</p>
  //     </Modal.Body>
  //
  //     <Modal.Footer>
  //       <Button variant="secondary">Close</Button>
  //       <Button variant="primary">Save changes</Button>
  //     </Modal.Footer>
  //   </Modal.Dialog>
  //     </>)
  // }
}

export default SpotifyAuthorization;
