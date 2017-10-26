import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import CreateTable from './CreateTable';
import Tables from './Tables';

export default function App() {
    return (
        <BrowserRouter>
            <Switch>
                <Route exact path="/" component={Tables} />
                <Route exact path="/:tableId" component={CreateTable} />
                <Route render={() => <div>Page not found</div>} />
            </Switch>
        </BrowserRouter>
    );
}
