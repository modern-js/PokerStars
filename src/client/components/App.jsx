import React from 'react';
import CreateTable from './CreateTable';

export default function App() {
    return (
        <div>
            <CreateTable createTable={(name, password) => console.log(name, password)} />
        </div>);
}
