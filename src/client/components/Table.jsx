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
                <div>{ table.name }</div>
            </div>
        );
    }
}