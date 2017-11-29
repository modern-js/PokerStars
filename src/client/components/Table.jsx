import React, { Component } from 'react';
import { Prompt } from 'react-router-dom';
import PropTypes from 'prop-types';
import Controllers from './Controllers';
import Seat from './Seat';
import Winners from './Winners';
import * as socket from '../services/socket';

export default class Table extends Component {
    static propTypes = {
        match: PropTypes.shape({
            params: PropTypes.shape({
                id: PropTypes.string.isRequired,
            }).isRequired,
        }).isRequired,
        history: PropTypes.shape({
            replace: PropTypes.func.isRequired,
        }).isRequired,
    };

    static tableStyles = {
        width: '70%',
        height: '75%',
        backgroundColor: 'red',
        position: 'absolute',
        left: '13.5%',
        top: '12%',
        borderRadius: '30%/50%',
        border: '1.4vw double black',
        boxShadow: 'inset 0 0 35px 6px rgba(0,0,0,0,0.75)',
        zIndex: '-2',
    };

    static totalBetsStyles = {
        width: '11%',
        height: '12%',
        backgroundColor: 'orange',
        position: 'absolute',
        top: '58%',
        left: '44.5%',
        borderRadius: '50%',
        boxShadow: '0 0 10px 2px rgba(0,0,0,0,0.75)',
        textAlign: 'center',
        fontSize: '10vh',
    };

    static cardsDivStyles = {
        position: 'absolute',
        left: '33.5%',
        top: '26%',
        width: '66.5%',
        height: '74%',
    };

    static cardsStyles = {
        width: '8%',
        borderRadius: '5px',
        margin: '1%',
        boxShadow: '0 0 10px 2px',
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

        const AudioContext = window.AudioContext || window.webkitAudioContext || false;
        const audioContext = AudioContext ? new AudioContext() : null;
        const oscillator = audioContext ? audioContext.createOscillator() : null;

        this.state = {
            table: null,
            seatNumber: null,
            winners: null,
            winnersTimeout: null,
            audioContext,
            oscillator,
        };
    }

    componentDidMount() {
        socket.subscribeForEvent('getRoom', this.getRoom);
        socket.subscribeForEvent('updatePlayer', this.updatePlayer);
        socket.subscribeForEvent('updateTableState', this.updateTableState);
        socket.subscribeForEvent('updatePlayerInTurn', this.updatePlayerInTurn);
        socket.subscribeForEvent('drawFinished', this.finishDraw);
        socket.subscribeForEvent('joinSuccessful', this.joinSuccessful);

        socket.emitEvent('getRoom', {
            id: this.props.match.params.id,
            password: '',
        });
    }

    componentWillUnmount() {
        socket.unsubscribeForEvent('getRoom', this.getRoom);
        socket.unsubscribeForEvent('updatePlayer', this.updatePlayer);
        socket.unsubscribeForEvent('updateTableState', this.updateTableState);
        socket.unsubscribeForEvent('updatePlayerInTurn', this.updatePlayerInTurn);
        socket.unsubscribeForEvent('drawFinished', this.finishDraw);
        socket.unsubscribeForEvent('joinSuccessful', this.joinSuccessful);
        clearTimeout(this.state.winnersTimeout);

        if (this.state.seatNumber !== null) {
            window.removeEventListener('beforeunload', this.warnOnExit);
            window.removeEventListener('unload', this.leaveRoom);
            this.leaveRoom();
        }
    }

    getRoom = (response) => {
        if (response.statusCode === 200) {
            this.setState({ table: response.table });
        } else if (response.statusCode === 401) {
            const tablePassword = window.prompt('Enter table password');

            if (tablePassword) {
                socket.emitEvent('getRoom', {
                    id: this.props.match.params.id,
                    password: tablePassword,
                });
            } else {
                this.props.history.replace('/');
            }
        } else {
            this.props.history.replace('/');
        }
    };

    updatePlayer = (response) => {
        const table = this.state.table;
        table.currentDraw.seats[response.seatNumber] = response.player;

        this.setState({ table });
    };

    updateTableState = (response) => {
        const table = this.state.table;
        table.currentDraw.cards = response.cards;
        table.currentDraw.totalBets = response.totalBets;

        if (response.updatePlayersBets) {
            table.currentDraw.seats.forEach((seat) => {
                if (seat) {
                    seat.bet = 0;
                }
            });
        }

        this.setState({ table });
    };

    updatePlayerInTurn = (playerInTurn) => {
        const table = this.state.table;
        table.currentDraw.playerInTurn = playerInTurn;

        this.setState({ table });
    };

    finishDraw = (winners) => {
        const winnersTimeout = setTimeout(() => {
            this.setState({ winners: null });
        }, 5000);

        winners.forEach((winner) => {
            winner.name = this.state.table.currentDraw.seats[winner.seatNumber].playerName;
        });

        this.setState({ winners, winnersTimeout });
    };

    joinNewPlayer = (seatNumber) => {
        const playerName = window.prompt('Enter your nickname!');

        if (playerName) {
            const player = {
                playerName,
                seatNumber,
            };

            socket.emitEvent('newPlayer', player);
        }
    };

    joinSuccessful = (seatNumber) => {
        this.setState({ seatNumber });
        this.state.oscillator.start();

        window.addEventListener('beforeunload', this.warnOnExit);
        window.addEventListener('unload', this.leaveRoom);
    };

    beep = () => {
        if (this.state.oscillator) {
            this.state.oscillator.connect(this.state.audioContext.destination);

            setTimeout(() => {
                this.state.oscillator.disconnect(this.state.audioContext.destination);
            }, 300);
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
        socket.emitEvent('actionTaken', {
            action,
            betAmount,
        });
    };

    render() {
        const { table } = this.state;

        if (!table) {
            return null;
        }

        const currentPlayer = table.currentDraw.seats[this.state.seatNumber];
        const isCurrentPlayerInTurn = table.currentDraw.playerInTurn === this.state.seatNumber;

        if (isCurrentPlayerInTurn) {
            this.beep();
        }

        const seats = [];
        for (let i = 0; i < 8; i += 1) {
            if (table.currentDraw.seats[i] || this.state.seatNumber === null) {
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

                seats.push(<Seat {...seatProps} />);
            }
        }

        const cards = table.currentDraw.cards.map(card => (
            <img
                key={card}
                src={`../img/cards/${card}.svg`}
                alt={card}
                style={Table.cardsStyles}
            />));

        return (
            <div>
                <Prompt message={Table.exitMessage} when={this.state.seatNumber !== null} />

                <div style={Table.tableStyles}>
                    {seats}
                </div>

                {table.currentDraw.isActive &&
                <div style={Table.totalBetsStyles}>
                    {table.currentDraw.totalBets}
                </div>}

                {table.currentDraw.cards.length > 0 &&
                <div style={Table.cardsDivStyles}>
                    {cards}
                </div>}

                {isCurrentPlayerInTurn &&
                <Controllers
                    chips={currentPlayer.chips}
                    amountToCall={currentPlayer.toCall}
                    previousBet={currentPlayer.bet}
                    handleAction={this.handleControllerPressed}
                />}

                {this.state.winners &&
                <Winners winners={this.state.winners} />}
            </div>
        );
    }
}
