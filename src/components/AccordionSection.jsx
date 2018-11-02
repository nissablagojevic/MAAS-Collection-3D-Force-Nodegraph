import {default as React, Component} from 'react';

import './AccordionSection.css';

export default class AccordionSection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    console.log('accordion section');
    console.log(this.props);
  }

  handleClick(e) {
    console.log(e);
    console.log(e.currentTarget);
    this.setState({isOpen: !this.state.isOpen});
  }


  render() {
    const title = this.props.title.replace(/\s+/g, '');

    return (
      <section>
        <div role="heading" aria-level="2">
          <button aria-expanded={this.state.isOpen}
                  className="Accordion-trigger"
                  aria-controls={`${title}-panel`}
                  id={`${title}-heading`}
                  type="button"
                  onClick={this.handleClick}>
            <span className="Accordion-title">{this.props.title}</span>
            <span className="Accordion-icon"></span>
          </button>
        </div>
        <div id={`${title}-panel`}
             role="region"
             aria-labelledby={`${title}-heading`}
             className={this.state.isOpen ? 'Accordion-panel' : 'Accordion-panel hidden'}>
          {this.props.content}
        </div>
      </section>
    );
  }

}
