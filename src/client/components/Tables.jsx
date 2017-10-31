import React, { Component } from 'react';
import axios from 'axios';
import CreateTable from './CreateTable';

export default class Tables extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tables: [],
        };
    }

    componentDidMount() {
        axios.get('http://localhost:6701/api/tables')
            .then(res => res.data)
            .then(data => this.setState({ tables: data }));
    }

    handleJoin(tableId) {
        console.log(tableId);
    }

    createTable = (name, password) => {
        axios.post('http://localhost:6701/api/tables', { name, password })
            .then(res => res.data)
            .then(data => this.setState(data));

        setTimeout(() => {
            this.setState({ message: '' });
        }, 2000);
    };

    render() {
        const tables = this.state.tables.map(t => (
            <div key={t.id} style={{ border: '1px solid black', width: '20%', margin: '2% 1%', padding: '1%', display: 'inline-block', position: 'relative' }}>
                {t.isLocked && <span style={{ position: 'absolute', top: '5%', right: '5%' }}>Locked</span>}
                <div>{t.name}</div>
                <ul>
                    {t.players.map(player => (
                        <li>{player}</li>
                    ))}
                </ul>
                <button onClick={() => { this.handleJoin(t.id); }}>Join</button>
            </div>
        ));

        return (
            <div>
                <div>
                    {tables}
                </div>
                {this.state.message && <span>{this.state.message}</span>}
                <CreateTable createTable={this.createTable} />
            </div>
        );
    }
}