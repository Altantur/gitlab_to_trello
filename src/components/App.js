import '../assets/stylesheets/base.scss';
import React, { Component } from 'react';
import axios from 'axios';
import CopyToClipboard from 'react-copy-to-clipboard';

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      trelloConnected: false,
      boards: [],
      connected: false,
      webhooked: false,
      copied: false,
      value: ""
    }
    this.authenticationSuccess = this.authenticationSuccess.bind(this)
  }
  authenticationSuccess(){
    this.setState({connected: true})
    let sBoards = this.state.boards
    let that = this
    Trello.get("/members/me/boards", { fields: "id" }, function (boards, err) {
      for (var i = 0; i < boards.length; i++) {
        Trello.get("/boards/" + boards[i].id, function(board, err){
          let oBoard = {
            id: board.id,
            name: board.name
          }
          sBoards.push(oBoard)
          that.setState({ boards: sBoards })
        })
      }
    })
  }
  authenticationFailure(){
    alert("failed")
  }
  handleTrello(e){
    e.preventDefault()
    Trello.authorize({
      type: 'popup',
      name: 'GitLab to Trello Application',
      scope: {
        read: 'true',
        write: 'true' },
      expiration: 'never',
      success: this.authenticationSuccess,
      error: this.authenticationFailure
    });
  }
  handleWebhook(e){
    let board_id = e.target.id
    e.target.disabled = "disabled"
    let that = this
    axios.post('/setwebhook', {
      trelloToken: localStorage.getItem("trello_token"),
      boardId: board_id
    }).then((response) => {
      that.setState({value: response.data})
    })
  }
  render() {
    return(
      <div>🌎
      <button onClick={this.handleTrello.bind(this)} disabled={this.state.connected ? "disabled" : ""}>Connect Trello</button>🌎
      <input value={this.state.value} disabled="disabled"/>
      <CopyToClipboard text={this.state.value}
          onCopy={() => this.setState({copied: true})}>
      <button>Copy to clipboard</button>
      </CopyToClipboard>
      <ul>
        {this.state.boards.map((board) =>
          <li key={board.id}>
            <button id={board.id} onClick={this.handleWebhook.bind(this)}>
              {board.name}
            </button>
          </li>
        )}
      </ul>
      </div>
    )
  }
};

export default App;
