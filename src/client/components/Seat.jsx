import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Seat extends Component {
    static propTypes = {
        left: PropTypes.string.isRequired,
        right: PropTypes.string.isRequired,
        top: PropTypes.string.isRequired,
        bottom: PropTypes.string.isRequired,
        player: PropTypes.shape({
            playerName: PropTypes.string,
            chips: PropTypes.number,
            cards: PropTypes.array,
        }),
        joinPlayer: PropTypes.func.isRequired,
        seatNumber: PropTypes.number.isRequired,
    };

    static defaultProps = {
        player: null,
    };

    static playerStyles = {
        width: '16%',
        height: '12%',
        border: '2px solid black',
        textAlign: 'center',
        position: 'absolute',
        padding: '1%',
        borderRadius: '50%',
        fontSize: '2vw',
        lineHeight: '8vh',
    };

    static cardStyles = {
        width: '35%',
        height: '150%',
        borderRadius: '5px',
        position: 'absolute',
        zIndex: '-1',
        top: '-60%',
    };

    static betStyles = {
        position: 'absolute',
        border: '1px solid black',
        backgroundColor: 'orange',
        borderRadius: '50%',
        width: '40%',
        height: '50%',
        top: '-15%',
        right: '-15%',
        fontSize: '1.7vw',
        lineHeight: '6vh',
    };

    constructor(props) {
        super(props);

        this.state = {
            hovered: false,
        };
    }

    getSeatProperties = () => ({
        style: {
            ...Seat.playerStyles,
            ...this.positionSeatStyles,
            backgroundColor: this.determineBackgroundColor(),
        },
        onClick: this.handleJoinClick,
        onMouseEnter: this.hoverOnSeat,
        onMouseLeave: this.hoverOnSeat,
    });

    positionSeatStyles = {
        left: this.props.left,
        right: this.props.right,
        top: this.props.top,
        bottom: this.props.bottom,
    };

    determineBackgroundColor = () => {
        if (this.props.player) {
            return 'green';
        } else if (this.state.hovered) {
            return 'gray';
        }

        return 'lightgray';
    };

    hoverOnSeat = () => {
        if (!this.props.player) {
            this.setState({ hovered: !this.state.hovered });
        }
    };

    handleJoinClick = () => {
        if (!this.props.player) {
            this.props.joinPlayer(this.props.seatNumber);
        }
    };

    render() {
        const { player } = this.props;
        const cards = player && player.cards.map(card => card || '0-0');

        return (
            <div {...this.getSeatProperties()}>
                { player && player.isPlaying && <div>
                    <img src={`../img/cards/${cards[0]}.svg`} style={{ ...Seat.cardStyles, left: '10%' }} alt={cards[0]} />
                    <img src={`../img/cards/${cards[1]}.svg`} style={{ ...Seat.cardStyles, right: '10%' }} alt={cards[1]} />
                </div>}
                <div>
                    {player ? `${player.playerName} - ${player.chips}` : 'Click to sit!'}
                </div>
                { player && player.bet !== 0 && <div style={Seat.betStyles}>
                    {player.bet}
                </div>}
            </div>
        );
    }
}
