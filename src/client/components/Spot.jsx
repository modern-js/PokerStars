import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Spot extends Component {
    static propTypes = {
        left: PropTypes.string.isRequired,
        right: PropTypes.string.isRequired,
        top: PropTypes.string.isRequired,
        bottom: PropTypes.string.isRequired,
        transform: PropTypes.string.isRequired,
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
        overflow: 'hidden',
        padding: '1%',
        borderRadius: '50%',
        lineHeight: '5vh',
    };

    constructor(props) {
        super(props);

        this.state = {
            hovered: false,
        };
    }

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

    determineBackgroundColor = () => {
        if (this.props.player) {
            return 'green';
        } else if (this.state.hovered) {
            return 'gray';
        }

        return 'lightgray';
    };

    getSpotProperties = () => {
        return {
            style: {
                ...Spot.playerStyles,
                ...this.positionPlayerStyles,
                backgroundColor: this.determineBackgroundColor(),
            },
            onClick: this.handleJoinClick,
            onMouseEnter: this.hoverOnSpot,
            onMouseLeave: this.hoverOnSpot,
        };
    };

    positionPlayerStyles = {
        left: this.props.left,
        right: this.props.right,
        top: this.props.top,
        bottom: this.props.bottom,
        transform: this.props.transform,
    };

    render() {
        const { player } = this.props;

        return (
            <div>
                <div {...this.getSpotProperties()}>
                    {player ? `${player.name}\n${player.chipsCount}` : 'Click to sit!'}
                </div>
            </div>
        );
    }
}