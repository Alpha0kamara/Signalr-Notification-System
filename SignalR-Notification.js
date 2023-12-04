import { LitElement, html, css, property } from 'lit-element';
import { HubConnectionBuilder } from '@microsoft/signalr';

class MyNotification extends LitElement {
  @property({ type: String }) hubUrl = '';
  @property({ type: Array }) notifications = [];
  @property({ type: Boolean }) showNotifications = false;

  static styles = css`
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    // Create a new connection to the SignalR hub
    const connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .build();

    // Start the connection
    connection.start().catch(err => console.error(err.toString()));

    // Listen for messages
    connection.on('ReceiveMessage', (message) => {
      this.notifications.push(message);
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  render() {
    return html`
      <button class="material-symbols-outlined" @click="${this.toggleNotifications}">
        <!-- Your icon here -->
      </button>

      ${this.showNotifications
        ? html`
            <ul>
              ${this.notifications.map(
                (notification) => html`<li>${notification}</li>`
              )}
            </ul>
          `
        : ''}
    `;
  }
}

customElements.define('SignalR-Notification', MyNotification);