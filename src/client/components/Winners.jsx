import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PopUp from './PopUp';


export default class Winners extends Component {
    static propTypes = {
        winners: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            seatNumber: PropTypes.number.isRequired,
            chipsWon: PropTypes.number.isRequired,
            winningHandRank: PropTypes.number,
            winningHand: PropTypes.arrayOf(PropTypes.string),
        })).isRequired,
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
            const message = winner.winningHandRank ?
                `${winner.name} won ${winner.chipsWon} chips with ${Winners.rankNames[winner.winningHandRank]}` :
                `${winner.name} won ${winner.chipsWon} chips`;

            const images = winner.winningHandRank && winner.winningHand.map(card => (
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
            <PopUp>
                {winners}
            </PopUp>
        );
    }
}
