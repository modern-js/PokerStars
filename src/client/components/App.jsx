import React, { Component } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Lobby from './Lobby';
import Table from './Table';
import PopUp from './PopUp';
import * as socket from '../services/socket';

export default class App extends Component {
    constructor() {
        super();

        this.state = {
            errorMessage: null,
            errorTimeout: null,
        };
    }

    componentDidMount() {
        socket.subscribeForEvent('validationError', this.handleError);
    }

    componentWillUnmount() {
        socket.unsubscribeForEvent('validationError', this.handleError);
        clearTimeout(this.state.errorTimeout);
    }

    handleError = (data) => {
        const errorTimeout = setTimeout(() => {
            this.setState({ errorMessage: null });
        }, 5000);

        this.setState({
            errorMessage: data.message,
            errorTimeout,
        });
    };

    render() {
        return (
            <div>
                {this.state.errorMessage &&
                <PopUp overrideStyles={{ backgroundColor: 'red' }}>
                    <div>{this.state.errorMessage}</div>
                </PopUp>}

                <HashRouter>
                    <Switch>
                        <Route exact path="/" component={Lobby} />
                        <Route exact path="/table/:id" component={Table} />
                        <Route render={() => <div>Page not found</div>} />
                    </Switch>
                </HashRouter>
            </div>
        );
    }
}
