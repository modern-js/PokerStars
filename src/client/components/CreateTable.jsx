import React from 'react';
import PropTypes from 'prop-types';

export default class CreateTable extends React.Component {
    static propTypes = {
        createTable: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            name: '',
            password: '',
        };
    }

    handleCreate = () => {
        this.props.createTable(this.state.name, this.state.password);
        this.setState({ name: '', password: '' });
    };

    render() {
        return (
            <div>
                <h3>Create new table</h3>
                <form>
                    <label htmlFor="name">Table name </label>
                    <input type="text" id="name" name="name" value={this.state.name} onChange={(e) => { this.setState({ name: e.target.value }); }} />
                    <br />
                    <label htmlFor="password"> Password </label>
                    <input type="password" id="password" name="password" value={this.state.password} onChange={(e) => { this.setState({ password: e.target.value }); }} />
                    <br />
                    <input type="button" value="Create" onClick={this.handleCreate} />
                </form>
            </div>);
    }
}
