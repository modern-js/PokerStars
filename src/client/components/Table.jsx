import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Controllers from './Controllers';
import Spot from './Spot';

export default class Table extends Component {
    static propTypes = {
        match: PropTypes.shape({
            params: PropTypes.shape({
                id: PropTypes.string.isRequired,
            }).isRequired,
        }).isRequired,
        history: PropTypes.shape({
            push: PropTypes.func.isRequired,
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
        top: '8%',
        borderRadius: '30%/50%',
        border: '15px double black',
    };

    static spotsPositions = [
        ['5', '', '-5', '', '0', '0'],
        ['50', '', '-12', '', '-50', '0'],
        ['', '5', '-5', '', '0', '0'],
        ['', '-12', '50', '', '0', '-50'],
        ['5', '', '', '-5', '0', '0'],
        ['50', '', '', '-12', '-50', '0'],
        ['', '5', '', '-5', '0', '0'],
        ['-12', '', '50', '', '0', '-50'],
    ];

    constructor(props) {
        super(props);

        this.state = {
            table: null,
        };
    }

    componentDidMount() {
        axios.get(`http://localhost:6701/api/tables/${this.props.match.params.id}`)
            .then(res => res.data)
            .then(table => this.setState({ table }))
            .catch(() => this.props.history.push('/404'));
    }

    handleControllerPressed(action, betAmount) {

    };

    joinPlayer(spotNumber) {

    }

    render() {
        const { table } = this.state;

        if (!table) {
            return <div>Loading...</div>;
        }

        const spots = [];

        for (let i = 0; i < 8; i += 1) {
            const spotProps = {
                left: `${Table.spotsPositions[i][0]}%`,
                right: `${Table.spotsPositions[i][1]}%`,
                top: `${Table.spotsPositions[i][2]}%`,
                bottom: `${Table.spotsPositions[i][3]}%`,
                transform: `translate(${Table.spotsPositions[i][4]}%,${Table.spotsPositions[i][5]}%)`,
                player: table.players[i],
                joinPlayer: this.joinPlayer,
                spotNumber: i,
                key: i,
            };

            spots.push(<Spot {...spotProps} />);
        }


        return (
            <div>
                <div style={Table.tableStyles}>
                    {spots}
                </div>
                <Controllers maxBet={400} amountToCall={100} canCall={true} canRaise={true} handleAction={this.handleControllerPressed} />
            </div>
        );
    }
}