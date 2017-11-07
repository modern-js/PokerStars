import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

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

    static playerStyles = {
        width: '16%',
        height: '12%',
        backgroundColor: 'green',
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
            table: null,
        };
    }

    componentDidMount() {
        axios.get(`http://localhost:6701/api/tables/${this.props.match.params.id}`)
            .then(res => res.data)
            .then(table => this.setState({ table }))
            .catch(() => this.props.history.push('/404'));
    }

    render() {
        const { table } = this.state;

        if (!table) {
            return <div>Loading...</div>;
        }

        return (
            <div>
                <div style={Table.tableStyles}>
                    <div style={{ ...Table.playerStyles, left: '5%', top: '-5%' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, left: '50%', top: '-12%', transform: 'translate(-50%, 0)' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, right: '5%', top: '-5%' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, right: '-12%', top: '50%', transform: 'translate(0, -50%)' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, left: '5%', bottom: '-5%' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, left: '50%', bottom: '-12%', transform: 'translate(-50%, 0)' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, right: '5%', bottom: '-5%' }}>asd<br />chips</div>
                    <div style={{ ...Table.playerStyles, left: '-12%', top: '50%', transform: 'translate(0, -50%)' }}>asd<br />chips</div>
                </div>
            </div>
        );
    }
}