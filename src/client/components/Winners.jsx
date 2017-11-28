import React, { Component } from 'react';
import PropTypes from 'prop-types';


export default class Winners extends Component {
    static propTypes = {
        winners: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            seatNumber: PropTypes.number.isRequired,
            chipsWon: PropTypes.number.isRequired,
            winningHandRank: PropTypes.number.isRequired,
            winningHand: PropTypes.arrayOf(PropTypes.string).isRequired,
        })).isRequired,
    };

    static popUpStyles = {
        position: 'absolute',
        top: '5%',
        left: '2%',
        border: '1px solid black',
        backgroundColor: 'lightgreen',
        borderRadius: '15px',
        padding: '1%',
        boxShadow: '5px 6px 10px black',
        width: '25%',
    };

    static imageStyles = {
        width: '12%',
        borderRadius: '5px',
        margin: '1%',
        boxShadow: '3px 3px 6px black',
    };

    static rankNames = {
        1: 'High Card',
        2: 'a Pair',
        3: 'Two Pairs',
        4: 'Three of a Kind',
        5: 'Straight',
        6: 'Flush',
        7: 'Full House',
        8: 'Four of a Kind',
        9: 'Straight Flush',
    };

    render() {
        const winners = this.props.winners.map((winner) => {
            const message = `${winner.name} won ${winner.chipsWon} chips with ${Winners.rankNames[winner.winningHandRank]}`;

            const images = winner.winningHand.map(card => (
                <img key={card} src={`../img/cards/${card}.svg`} style={Winners.imageStyles} alt={card} />
            ));

            return (
                <div key={winner.seatNumber}>
                    <span style={{ fontSize: '1.5vw' }}>{message}</span>
                    <div>{images}</div>
                </div>
            );
        });

        return (
            <div style={Winners.popUpStyles}>
                {winners}
            </div>
        );
    }
}
