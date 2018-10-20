import { default as React, Component } from 'react';
import Selector from './Selector';
import './SelectNarrative.css';

class SelectNarrative extends Component {
    constructor() {
        super();
        this.state = {
            selectedNarrative: ''
        };

        this.selectNarrative = this.selectNarrative.bind(this);
    }

    componentDidMount() {
        this.selectNarrative();
    }

    selectNarrative(event) {
        let narrative;
        let location;
        if (!event) {
            if (this.props.selectedNarrative) {
                narrative = this.props.selectedNarrative;
            } else {
                narrative = '';
            }
        } else {
            narrative = parseInt(event.target.value, 10);
            location = {
                pathname: `/${narrative}`,
            };

            this.props.history.push(location)
        }
        this.setState({selectedNarrative: narrative});
    }

    render() {
        return (
            <div id="selectNarrative" className="info">
                <h3>Narrative:</h3>
                <Selector
                    selectedItem={this.props.selectedNarrative}
                    list={this.props.narrativesList}
                    action={this.selectNarrative}/>
            </div>
        );
    }
}

export default SelectNarrative;
