import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Tables from './Tables';
import Table from './Table';

export default function App() {
    return (
        <BrowserRouter>
            <Switch>
                <Route exact path="/" component={Tables} />
                <Route exact path="/table/:id" component={Table} />
                <Route render={() => <div>Page not found</div>} />
            </Switch>
        </BrowserRouter>
    );
}
