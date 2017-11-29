import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class PopUp extends Component {
    static propTypes = {
        children: PropTypes.oneOfType([
            PropTypes.node,
            PropTypes.arrayOf(PropTypes.node),
        ]).isRequired,
        overrideStyles: PropTypes.objectOf(PropTypes.string),
    };

    static defaultProps = {
        overrideStyles: {},
    };

    static popUpStyles = {
        position: 'fixed',
        top: '5%',
        right: '2%',
        border: '1px solid black',
        backgroundColor: 'lightgreen',
        borderRadius: '15px',
        padding: '1%',
        boxShadow: '5px 6px 10px black',
        zIndex: '1',
        width: '25%',
    };

    render() {
        return (
            <div style={{ ...PopUp.popUpStyles, ...this.props.overrideStyles }}>
                { this.props.children }
            </div>
        );
    }
}