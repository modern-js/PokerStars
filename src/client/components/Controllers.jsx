import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Controllers extends Component {
    static controllersStyles = {
        bottom: '3%',
        right: '3%',
        position: 'absolute',
        border: '2px solid black',
    };

    static step = 10;

    static propTypes = {
        chips: PropTypes.number.isRequired,
        amountToCall: PropTypes.number.isRequired,
        previousBet: PropTypes.number.isRequired,
        handleAction: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            betValue: this.props.amountToCall + Controllers.step + this.props.previousBet,
        };
    }

    handleSliderChange = (e) => {
        this.setState({ betValue: Number.parseInt(e.target.value, 10) });
    };

    render() {
        const canRaise = this.props.chips > this.props.amountToCall;
        const canCheck = this.props.amountToCall === 0;
        const canCall = this.props.amountToCall > 0 && this.props.chips > 0;
        const amountCallable = this.props.chips >= this.props.amountToCall ?
            this.props.amountToCall :
            this.props.chips;

        const minBet = this.props.amountToCall + Controllers.step + this.props.previousBet;
        const maxBet = this.props.chips + this.props.previousBet;

        const raiseAmount = this.state.betValue - this.props.previousBet;

        return (
            <div style={Controllers.controllersStyles}>
                <div>
                    <input
                        disabled={!canRaise}
                        type="range"
                        value={this.state.betValue}
                        min={minBet}
                        max={maxBet}
                        step={Controllers.step}
                        onChange={this.handleSliderChange}
                    />

                    <span>{ this.state.betValue }</span>
                </div>
                <div>
                    <button
                        disabled={!canCheck}
                        onClick={() => { this.props.handleAction(1); }}
                    >Check</button>

                    <button
                        disabled={!canCall}
                        onClick={() => { this.props.handleAction(2); }}
                    >Call {canCall && amountCallable}</button>

                    <button
                        disabled={!canRaise}
                        onClick={() => { this.props.handleAction(3, raiseAmount); }}
                    >Raise {canRaise && `To ${this.state.betValue}`}</button>

                    <button onClick={() => { this.props.handleAction(4); }}>Fold</button>
                </div>
            </div>
        );
    }
}
