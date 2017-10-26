import React, { Component } from 'react';
import CreateTable from './CreateTable';

export default class Tables extends Component {
    constructor(props) {
        super(props);

        this.state = {
            tables: [],
        };
    }

    componentDidMount() {
        this.setState({ tables: [
            { id: 1, players: ['Hristo', 'Niki', 'Gosho', 'Ivan'], name: 'first', isLocked: true },
            { id: 2, players: ['Hristo', 'Niki', 'Gosho', 'Ivan', 'Pesho'], name: 'second', isLocked: false },
            { id: 3, players: ['Hristo', 'Niki', 'Gosho'], name: 'third', isLocked: true },
            { id: 4, players: ['Hristo', 'Niki', 'Gosho', 'Ivan', 'Plamen'], name: 'fourth', isLocked: false },
            { id: 5, players: ['Hristo', 'Niki', 'Dobri'], name: 'fifth', isLocked: false }] });
    }

    handleJoin(tableId) {
        console.log(tableId);
    }

    createTable(username, password) {
        console.log(username, password);
    }

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
                <CreateTable createTable={this.createTable} />
            </div>
        );
    }
}