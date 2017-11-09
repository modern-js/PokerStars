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

        return (
            <div {...this.getSeatProperties()}>
                { player && player.cards[0] && player.cards[1] && <div>
                    <img src={`../img/cards/${player.cards[0]}.svg`} style={{ ...Seat.cardStyles, left: '10%' }} alt={`../img/cards/${player.cards[0]}.svg`} />
                    <img src={`../img/cards/${player.cards[1]}.svg`} style={{ ...Seat.cardStyles, right: '10%' }} alt={`../img/cards/${player.cards[1]}.svg`} />
                </div>}
                <div>
                    {player ? `${player.playerName} - ${player.chips}` : 'Click to sit!'}
                </div>
            </div>
        );
    }
}
