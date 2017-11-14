import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import Controllers from './Controllers';
import Seat from './Seat';
import * as socket from '../services/socket';

export default class Table extends Component {
    static propTypes = {
        match: PropTypes.shape({
            params: PropTypes.shape({
                id: PropTypes.string.isRequired,
            }).isRequired,
        }).isRequired,
        history: PropTypes.shape({
            push: PropTypes.func.isRequired,
            replace: PropTypes.func.isRequired,
        }).isRequired,
    };

    static tableStyles = {
        width: '70%',
        minWidth: '500px',
        height: '75%',
        minHeight: '250px',
        backgroundColor: 'red',
        position: 'absolute',
        left: '15%',
        top: '12%',
        borderRadius: '30%/50%',
        border: '20px double black',
        boxShadow: 'inset 0 0 35px 6px rgba(0,0,0,0,0.75)',
        zIndex: '-2',
    };

    static exitMessage = 'Are you sure you want to leave?';

    static seatsPositions = [
        ['5', '', '-5', ''],
        ['41', '', '-12', ''],
        ['', '5', '-5', ''],
        ['', '-12', '41', ''],
        ['5', '', '', '-5'],
        ['41', '', '', '-12'],
        ['', '5', '', '-5'],
        ['-12', '', '41', ''],
    ];

    constructor(props) {
        super(props);

        this.state = {
            table: null,
            isPlaying: false,
        };
    }

    componentDidMount() {
        socket.subscribeForEvent('getRoom', this.getTable);
        socket.subscribeForEvent('newPlayer', this.addNewPlayerToState);

        socket.emitEvent('getRoom', this.props.match.params.id);
    }

    componentWillUnmount() {
        socket.unsubscribeForEvent('getRoom', this.getTable);
        socket.unsubscribeForEvent('newPlayer', this.addNewPlayerToState);

        if (this.state.isPlaying) {
            window.removeEventListener('beforeunload', this.warnOnExit);
            window.removeEventListener('unload', this.leaveRoom);
            this.leaveRoom();
        }
    }

    getTable = (table) => {
        if (table) {
            this.setState({ table });
        } else {
            this.props.history.replace('/404');
        }
    };

    addNewPlayerToState = (response) => {
        const table = this.state.table;
        table.currentDraw.seats[response.seatNumber] = response.player;

        this.setState({ table });
    };

    joinNewPlayer = (seatNumber) => {
        const playerName = window.prompt('Enter your nickname!');

        if (playerName) {
            const player = {
                playerName,
                seatNumber,
            };

            socket.emitEvent('newPlayer', player);
            this.setState({ isPlaying: true });
            window.addEventListener('beforeunload', this.warnOnExit);
            window.addEventListener('unload', this.leaveRoom);
        }
    };

    warnOnExit = (ev) => {
        ev.returnValue = Table.exitMessage;
        return Table.exitMessage;
    };

    leaveRoom = () => {
        socket.emitEvent('leaveRoom');
    };


    handleControllerPressed = (action, betAmount) => {

    };

    render() {
        const { table } = this.state;

        if (!table) {
            return null;
        }

        const seats = [];

        for (let i = 0; i < 8; i += 1) {
            const seatProps = {
                left: `${Table.seatsPositions[i][0]}%`,
                right: `${Table.seatsPositions[i][1]}%`,
                top: `${Table.seatsPositions[i][2]}%`,
                bottom: `${Table.seatsPositions[i][3]}%`,
                player: table.currentDraw.seats[i],
                joinPlayer: this.joinNewPlayer,
                seatNumber: i,
                key: i,
            };

            if (seatProps.player || !this.state.isPlaying) {
                seats.push(<Seat {...seatProps} />);
            }
        }

        // TODO: show controllers only when player isInTurn
        return (
            <div>
                <Prompt message={Table.exitMessage} when={this.state.isPlaying} />
                <div style={Table.tableStyles}>
                    {seats}
                </div>
                <Controllers maxBet={400} amountToCall={100} canCall={true} canRaise={true} handleAction={this.handleControllerPressed} />
            </div>
        );
    }
}
