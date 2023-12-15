import { LitElement, html, css } from "lit";
import { HubConnectionBuilder } from "@microsoft/signalr";

class NotificationComponent extends LitElement {
  static styles = css`
    .icon-button {
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 50%;
      padding: 10px;
      cursor: pointer;
      outline: none;
      transition: background 0.3s ease;
    }

    .icon-button:hover {
      background: #e0e0f0;
    }

    .icon-button svg {
      fill: #333;
      width: 24px;
      height: 24px;
    }

    ul {
      display: none;
      list-style-type: none;
      padding: 0;
      margin: 0;
    }

    ul.visible {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    ul.visible li {
      padding: 10px;
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
      max-width: 300px;
    }
  `;

  constructor() {
    super();
    this.notifications =
      JSON.parse(localStorage.getItem("notifications")) || [];
    this.isVisible = false;
    this.hasNewMessage = false;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.currentLoggedUserId = this.getAttribute("currentLoggedUserId");
    this.connectionUrl = this.getAttribute("connectionUrl");

    this.connection = new HubConnectionBuilder()
      .withUrl(this.connectionUrl)
      .build();
    this.connection
      .start()
      .then(() => {
        console.log("Connection started!");
        this.connection.on("ReceiveMessage", (reference, notificationKey) => {
          if (reference === this.currentLoggedUserId) {
            console.log("ReceiveMessage: ", reference, notificationKey);
            const newNotification = { reference, notificationKey };
            this.notifications = [...this.notifications, newNotification];
            localStorage.setItem(
              "notifications",
              JSON.stringify(this.notifications)
            );
            this.dispatchEvent(
              new CustomEvent("ReceiveMessage", { detail: newNotification })
            );
            this.hasNewMessage = true;
            this.requestUpdate();
          }
        });
      })
      .catch((e) => console.log("Connection failed: ", e));
  }

  async disconnectedCallback() {
    if (this.connection) {
      this.connection.off("ReceiveMessage");
      this.connection.stop();
    }
    super.disconnectedCallback();
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.hasNewMessage = false;
    this.requestUpdate();
  }

  deleteNotification(index) {
    const notification = this.notifications.splice(index, 1)[0];
    localStorage.setItem("notifications", JSON.stringify(this.notifications));
    this.requestUpdate();
    if (this.onNotificationDeleted) {
      this.onNotificationDeleted(notification);
    }
  }

  render() {
    return html`
      <button class="icon-button" @click="${this.toggleVisibility}">
        ${this.hasNewMessage
          ? html`
              <div style="position: relative; display: inline-block;">
                <!-- SVG for new message -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 0 24 24"
                  width="24px"
                  fill="#000000"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path
                    d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5a7.978 7.978 0 0 0-4-6.901V4a2 2 0 0 0-4 0v.099A7.978 7.978 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"
                  />
                </svg>
                <!-- Notification count -->
                <span
                  style="position: absolute; top: -5px; right: -10px; background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 12px; line-height: 1; min-width: 20px; text-align: center;"
                >
                  new
                </span>
              </div>
            `
          : html`
              <!-- SVG for no new message -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 0 24 24"
                width="24px"
                fill="#000000"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5a7.978 7.978 0 0 0-4-6.901V4a2 2 0 0 0-4 0v.099A7.978 7.978 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"
                />
              </svg>
            `}
      </button>
      <ul class="${this.isVisible ? "visible" : ""}">
        ${this.notifications.map(
          (notification, index) => html`
            <li>
              ${notification.reference}: ${notification.notificationKey}
              <button @click="${() => this.deleteNotification(index)}">
                Delete
              </button>
            </li>
          `
        )}
      </ul>
    `;
  }
}

customElements.define("notification-component", NotificationComponent);
export default NotificationComponent;
