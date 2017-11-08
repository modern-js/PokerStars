import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import CreateTable from './CreateTable';
import { subscribeForEvent, unsubscribeForEvent } from '../services/tablesServices';

export default class Lobby extends Component {
    static propTypes = {
        history: PropTypes.shape({
            push: PropTypes.func.isRequired,
        }).isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            tables: [],
        };
    }

    componentDidMount() {
        axios.get('http://localhost:6701/api/tables')
            .then(res => res.data)
            .then(tables => this.setState({ tables }));

        subscribeForEvent('newTable', this.pushTableToState);
    }

    componentWillUnmount() {
        unsubscribeForEvent('newTable', this.pushTableToState);
        clearTimeout(this.state.messageTimeoutId);
    }

    pushTableToState = (table) => {
        this.setState(prevState => ({
            tables: [...prevState.tables, table],
        }));
    };

    handleJoin = (tableId) => {
        this.props.history.push(`table/${tableId}`);
    };

    createTable = (name, password) => {
        axios.post('http://localhost:6701/api/tables', { name, password })
            .then(res => res.data)
            .then(data => this.setState({ message: data.message }));

        const messageTimeoutId = setTimeout(() => {
            this.setState({ message: '' });
        }, 2000);

        this.setState({ messageTimeoutId });
    };

    render() {
        const tables = this.state.tables.map(table => (
            <div key={table.id} style={{ border: '1px solid black', width: '20%', margin: '2% 1%', padding: '1%', display: 'inline-block', position: 'relative' }}>
                {table.isLocked && <span style={{ position: 'absolute', top: '5%', right: '5%' }}>Locked</span>}
                <div>{table.name}</div>
                <ul>
                    {table.players.map(player => (
                        <li key={player}>{player}</li>
                    ))}
                </ul>
                <button onClick={() => { this.handleJoin(table.id); }}>Join</button>
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
