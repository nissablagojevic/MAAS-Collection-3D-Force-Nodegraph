import {default as React, Component} from 'react';

export default class AccordionSection extends Component {
  constructor() {
    super();

    this.state = {
      isOpen: true,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    console.log(e);
    console.log(e.currentTarget);
  }


  render() {
    const title = this.props.title.replace(/\s+/g, '');

    return (
      <section>
        <div role="heading" aria-level="2">
          <button aria-expanded="true"
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
             className="Accordion-panel">
          {this.props.content}
        </div>
      </section>
    );
  }

}
