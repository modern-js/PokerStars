import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Spot extends Component {
    static propTypes = {
        left: PropTypes.string.isRequired,
        right: PropTypes.string.isRequired,
        top: PropTypes.string.isRequired,
        bottom: PropTypes.string.isRequired,
        player: PropTypes.shape({
            name: PropTypes.string.isRequired,
            chipsCount: PropTypes.number.isRequired,
            cards: PropTypes.array.isRequired,
        }).isRequired,
        joinPlayer: PropTypes.func.isRequired,
        spotNumber: PropTypes.number.isRequired,
    };

    static playerStyles = {
        width: '16%',
        height: '12%',
        border: '2px solid black',
        textAlign: 'center',
        position: 'absolute',
        padding: '1%',
        borderRadius: '50%',
        lineHeight: '5vh',
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

    getSpotProperties = () => ({
        style: {
            ...Spot.playerStyles,
            ...this.positionSpotStyles,
            backgroundColor: this.determineBackgroundColor(),
        },
        onClick: this.handleJoinClick,
        onMouseEnter: this.hoverOnSpot,
        onMouseLeave: this.hoverOnSpot,
    });

    positionSpotStyles = {
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

    hoverOnSpot = () => {
        if (!this.props.player) {
            this.setState({ hovered: !this.state.hovered });
        }
    };

    handleJoinClick = () => {
        if (!this.props.player) {
            this.props.joinPlayer(this.props.spotNumber);
        }
    };

    render() {
        const { player } = this.props;

        return (
            <div {...this.getSpotProperties()}>
                <div>
                    <img src="../img/cards/2-1.svg" style={{ ...Spot.cardStyles, left: '10%' }} alt="card" />
                    <img src="../img/cards/2-2.svg" style={{ ...Spot.cardStyles, right: '10%' }} alt="card" />
                </div>
                <div>
                    {player ? `${player.name}\n${player.chipsCount}` : 'Click to sit!'}
                </div>
                <div>
                    
                </div>
            </div>
        );
    }
}
