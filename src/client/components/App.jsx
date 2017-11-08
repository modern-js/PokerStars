import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Lobby from './Lobby';
import Table from './Table';

export default function App() {
    return (
        <HashRouter>
            <Switch>
                <Route exact path="/" component={Lobby} />
                <Route exact path="/table/:id" component={Table} />
                <Route render={() => <div>Page not found</div>} />
            </Switch>
        </HashRouter>
    );
}
