import '../assets/stylesheets/base.scss';
import React, {Component} from 'react';
import axios from 'axios';

const TRELLO_KEY = '606e8e43f53447a2819dd630338306aa'
class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            trelloConnected: false,
            boards: [],
            projects: [],
            connected: false,
            webhooked: false,
            gitlabToken: "",
            value: ""
        }
        this.authenticationSuccess = this.authenticationSuccess.bind(this)
    }
    authenticationSuccess() {
        this.setState({connected: true})
        let sBoards = this.state.boards
        let that = this
        Trello.get("/members/me/boards", {
            fields: "id"
        }, function(boards, err) {
            for (var i = 0; i < boards.length; i++) {
                Trello.get("/boards/" + boards[i].id, function(board, err) {
                    let oBoard = {
                        id: board.id,
                        name: board.name
                    }
                    sBoards.push(oBoard)
                    that.setState({boards: sBoards})
                })
            }
        })
    }
    authenticationFailure() {
        alert("failed")
    }
    handleTrello(e) {
        e.preventDefault()
        Trello.authorize({
            type: 'popup',
            name: 'GitLab to Trello Application',
            scope: {
                read: 'true',
                write: 'true'
            },
            expiration: 'never',
            success: this.authenticationSuccess,
            error: this.authenticationFailure
        });
    }
    handleWebhook(e) {
        e.preventDefault()
        e.target.disabled = "disabled"
        let board_id = e.target.id
        let that = this
        let trelloToken = localStorage.getItem("trello_token")
        let projectId = e.target.project.value
        axios.post(`https://api.trello.com/1/tokens/${trelloToken}/webhooks/?key=${TRELLO_KEY}`, {
            description: "Trello first webhook",
            callbackURL: "http://52.70.84.224/trelloCallback",
            idModel: board_id
        }).then((value) => {
          console.log(value)
            axios.post('/setwebhook', {
                trelloToken: trelloToken,
                boardId: board_id,
                gitlabToken: this.state.gitlabToken,
                gitlabProjectId: projectId
            }).then((response) => {
                that.setState({value: response.data})
            })
        })
    }
    handleGitlab(e) {
        let acces_token = e.target.value
        if (acces_token.length === 20) {
            e.target.disabled = "disabled"
            let gitlab = axios.create({
                baseURL: 'http://gitlab.unimedia.mn/api/v3',
                headers: {
                    'PRIVATE-TOKEN': acces_token
                }
            })
            gitlab.get('/projects').then((value) => {
                this.setState({projects: value.data, gitlabToken: acces_token})
            })
        }
    }
    render() {
        return (
            <div>🌎
                <button onClick={this.handleTrello.bind(this)} disabled={this.state.connected
                    ? "disabled"
                    : ""}>Connect Trello</button>🌎
                <input placeholder="Gitlab Acces Token" onChange={this.handleGitlab.bind(this)}/>
                <ul>
                    {this.state.boards.map((board) => <form onSubmit={this.handleWebhook.bind(this)} id={board.id}>
                        <li key={board.id}>
                            <select name="project">
                                {this.state.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                            </select>
                            From : To
                            <input type="submit" value={board.name}/>
                        </li>
                    </form>)}
                </ul>
            </div>
        )
    }
};

export default App;
