import { LitElement, html, css } from 'lit';
import { HubConnectionBuilder } from '@microsoft/signalr';

class NotificationComponent extends LitElement {
  static styles = css`
  .icon-button {
    background: #f0f0f0; /* light gray background */
    border: 1px solid #ccc; /* gray border */
    border-radius: 50%; /* make it round */
    padding: 10px; /* space around the icon */
    cursor: pointer;
    outline: none;
    transition: background 0.3s ease; /* transition for hover effect */
  }

  .icon-button:hover {
    background: #e0e0e0; /* slightly darker gray when hovered */
  }

  .icon-button svg {
    fill: #333; /* icon color */
    width: 24px;
    height: 24px;
  }
  ul {
    display: none;
    list-style-type: none; /* remove bullet points */
    padding: 0; /* remove padding */
    margin: 0; /* remove margin */
  }

  ul.visible {
    display: flex; /* use Flexbox */
    flex-direction: column; /* stack items vertically */
    gap: 10px; /* space between items */
  }

  ul.visible li {
    padding: 10px; /* space inside each item */
  background: #f0f0f0; /* light gray background */
  border: 1px solid #ccc; /* gray border */
  border-radius: 5px; /* rounded corners */
  max-width: 300px; /* maximum width */
  }
  `;

  constructor() {
    super();
    this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    this.isVisible = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.currentLoggedUserId = this.getAttribute('currentLoggedUserId');
    this.connectionUrl = this.getAttribute('connectionUrl');

    this.connection = new HubConnectionBuilder().withUrl(this.connectionUrl).build();
    this.connection.start()
      .then(() => {
        console.log('Connection started!');
        this.connection.on('ReceiveMessage', (reference, notificationKey) => {
          if (reference === this.currentLoggedUserId) {
            const newNotification = { reference, notificationKey };
            this.notifications = [...this.notifications, newNotification];
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
            this.dispatchEvent(new CustomEvent('ReceiveMessage', { detail: newNotification }));
          }
        });
      })
      .catch(e => console.log('Connection failed: ', e));
  }

  async disconnectedCallback() {
    if (this.connection) {
      this.connection.off('ReceiveMessage');
      this.connection.stop();
    }
    super.disconnectedCallback();
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.requestUpdate();
  }

  deleteNotification(index) {
    const notification = this.notifications.splice(index, 1)[0];
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
    this.requestUpdate();
    if(this.onNotificationDeleted) {
      this.onNotificationDeleted(notification);
    };
  }

  render() {
    return html`
      <button class="icon-button" @click="${this.toggleVisibility}">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5a8 8 0 0 0-16 0v5h4v1H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-3v-1h4z"/>
        </svg>
      </button>
      <ul class="${this.isVisible ? 'visible' : ''}">
        ${this.notifications.map((notification, index) => html`
          <li>
            ${notification.reference}: ${notification.notificationKey}
            <button @click="${() => this.deleteNotification(index)}">Delete</button>
          </li>
        `)}
      </ul>
    `;
  }
}

customElements.define('notification-component', NotificationComponent);
export default NotificationComponent;