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
        maxBet: PropTypes.number.isRequired,
        amountToCall: PropTypes.number.isRequired,
        canCall: PropTypes.bool.isRequired,
        canRaise: PropTypes.bool.isRequired,
        handleAction: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            betValue: this.props.amountToCall + Controllers.step,
        };
    }

    render() {
        return (
            <div style={Controllers.controllersStyles}>
                <div>
                    <input type="range" value={this.state.betValue} min={this.props.amountToCall + Controllers.step} max={this.props.maxBet} step={Controllers.step} onChange={e => this.setState({ betValue: e.target.value })} />
                    <span>{ this.state.betValue }</span>
                </div>
                <div>
                    <button onClick={this.props.handleAction(0)}>Fold</button>
                    <button disabled={!this.props.canCall} onClick={this.props.handleAction(1)}>Call{this.props.canCall ? ` ${this.props.amountToCall}` : ''}</button>
                    <button disabled={!this.props.canRaise} onClick={this.props.handleAction(2, this.state.betValue)}>Raise To {this.props.canRaise ? ` ${this.state.betValue}` : ''}</button>
                </div>
            </div>
        );
    }
}