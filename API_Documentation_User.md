# User Authentication and Event APIs Documentation

## 1. User Base APIs

### 1.1 Register User
- **Endpoint:** POST /user-profile/register
- **Description:** Registers a new user with provided details.
- **Request Body:**
  ```json
  {
    "first_name": "string",
    "middle_name": "string (optional)",
    "last_name": "string",
    "email": "string",
    "password": "string",
    "linkedin_url": "string (optional)",
    "role_id": "integer",
    "attendees_role": "string (optional)",
    "preference": "string (optional)",
    "photo": "file (optional, multipart/form-data)"
  }
  ```
- **Response:**
  - Success (201):
    ```json
    {
      "message": "User registered successfully",
      "userId": "integer"
    }
    ```

### 1.2 Login User
- **Endpoint:** POST /user-profile/login
- **Description:** Authenticates user and returns a JWT token.
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Login successful",
      "token": "JWT token string"
    }
    ```

### 1.3 Get User Roles
- **Endpoint:** GET /user-profile/roles
- **Description:** Retrieves all available user roles.
- **Response:**
  - Success (200):
    ```json
    {
      "roles": [
        "string"
      ]
    }
    ```

### 1.4 Get User Profile
- **Endpoint:** GET /user-profile
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves the profile information of the authenticated user.
- **Response:**
  - Success (200):
    ```json
    {
      "user": {
        "id": "integer",
        "first_name": "string",
        "middle_name": "string (nullable)",
        "last_name": "string",
        "username": "string",
        "email": "string",
        "status": "string",
        "role_id": "integer",
        "role_name": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "attendees_role": "string (nullable)",
        "linkedin_url": "string (nullable)",
        "block_status": "boolean",
        "preference": "string (nullable)",
        "photo": "string (base64 encoded image, nullable)"
      }
    }
    ```

### 1.5 Edit User Profile
- **Endpoint:** PUT /user-profile/edit
- **Middleware:** Requires authentication (userAuth)
- **Description:** Updates the authenticated user's profile. All fields are optional; only provide fields to update.
- **Request Body:**
  ```json
  {
    "first_name": "string (optional)",
    "middle_name": "string (optional)",
    "last_name": "string (optional)",
    "email": "string (optional)",
    "password": "string (optional)",
    "linkedin_url": "string (optional)",
    "role_id": "integer (optional)",
    "attendees_role": "string (optional)",
    "preference": "string (optional)",
    "photo": "file (optional, multipart/form-data)"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "User profile updated successfully"
    }
    ```

## 2. User Events APIs

### 2.1 Get Upcoming Events
- **Endpoint:** POST /user-events/upcoming-events
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves a list of upcoming events.
- **Request Body:**
  ```json
        {
            "latitude" : 15,
            "longitude" : 25
        }
  ```
- **Response:**
  - Success (200):
    ```json
    {
    "events": [
        {
            "id": 85,
            "name": "AR/VR Experience Days",
            "description": "Hands-on event with the latest in AR and VR tech.",
            "start_date_time": "2025-07-22T04:00:00.000Z",
            "end_date_time": "2025-07-22T09:30:00.000Z",
            "latitude": "52.52",
            "longitude": "13.405",
            "venue": "Berlin Expo Center",
            "web_page_url": "http://example.com/events/arvr-days",
            "banner": null,
            "status": "disable",
            "priority": null,
            "created_at": "2025-06-02T18:12:59.090Z",
            "updated_at": "2025-06-02T18:13:44.530Z",
            "is_registered": false,
            "check_in_available": false
        }
        ]
    }
    ```

### 2.2 Register for Event
- **Endpoint:** POST /user-events/register-event
- **Middleware:** Requires authentication (userAuth)
- **Description:** Registers the authenticated user for a specified event.
- **Request Body:**
  ```json
  {
    "event_id": "integer"
  }
  ```
- **Response:**
  - Success (201):
    ```json
    {
      "message": "Successfully registered for the event"
    }
    ```

### 2.3 Check In to Event
- **Endpoint:** POST /user-events/check-in
- **Middleware:** Requires authentication (userAuth)
- **Description:** Checks in the authenticated user to an event.
- **Request Body:**
  ```json
  {
    "event_id": "integer"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Successfully checked in to the event"
    }
    ```

### 2.4 Get Registered Events with Connections
- **Endpoint:** GET /user-events/registered-events
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves all events the user has registered for, along with connection information.
- **Response:**
  - Success (200):
    ```json
    {
    "events": [
    {
            "id": 78,
            "name": "Tech Innovators Summit",
            "description": "A summit showcasing the latest in tech innovation.",
            "start_date_time": "2025-04-10T03:30:00.000Z",
            "end_date_time": "2025-07-10T11:30:00.000Z",
            "latitude": "40.7128",
            "longitude": "-74.006",
            "venue": "Innovation Hall, NYC",
            "web_page_url": "http://example.com/events/innovators-summit",
            "banner": null,
            "status": "enable",
            "priority": null,
            "created_at": "2025-06-02T18:12:10.462Z",
            "updated_at": "2025-06-02T18:12:10.462Z",
            "is_registered": true,
            "total_connections": 2,
            "approved_requests": 2,
            "pending_requests": 0
        }
        ]
    }

    ```

### 2.5 Get Users from Shared Past Events
- **Endpoint:** GET /user-events/attended-users
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves users who attended the same past events as the authenticated user.
- **Response:**
  - Success (200):
    ```json
          {
          "attended_users": [
              {
                  "id": 145,
                  "first_name": "Vivek",
                  "last_name": "Singh",
                  "email": "vivek@mail.com",
                  "photo": null,
                  "linkedin_url": "vivek.com",
                  "role": "ceo"
              }
          ]
      }
    ```

## 3. User Connections APIs

### 3.1 Send Connection Request
- **Endpoint:** POST /user-connections/send-request
- **Middleware:** Requires authentication (userAuth)
- **Description:** Sends a connection request to another user.
- **Request Body:**
  ```json
  {
    "receiver_id": "integer"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Connection request sent successfully"
    }
    ```

### 3.2 Respond to Connection Request
- **Endpoint:** PUT /user-connections/respond/:userId
- **Middleware:** Requires authentication (userAuth)
- **Description:** Accepts or rejects a connection request from another user.
- **Parameters:** userId - ID of the user who sent the request
- **Request Body:**
  ```json
  {
    "action": "string (approved or rejected)"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Connection request accepted successfully"
    }
    ```

### 3.3 Get Pending Connection Requests
- **Endpoint:** GET /user-connections/pending-requests
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves all pending connection requests for the authenticated user.
- **Response:**
  - Success (200):
    ```json
    {
      "pending_requests": [
        {
          "request_id": "integer",
          "user_id": "integer",
          "first_name": "string",
          "last_name": "string",
          "attendees_role": "string",
          "photo": "string (base64 encoded image)",
          "created_at": "timestamp"
        }
      ]
    }
    ```

## 4. User Chat APIs (Currently Commented Out)

### 4.1 Get Approved Connections with Last Message
- **Endpoint:** GET /user-chat/chat-connections
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves all approved connections for the authenticated user, along with the last message in each chat.
- **Response:**
  - Success (200):
    ```json
    {
      "connections": [
        {
          "id": "integer",
          "first_name": "string",
          "last_name": "string",
          "email": "string",
          "photo": "string (base64 encoded image)",
          "linkedin_url": "string",
          "chat_id": "integer",
          "last_message": "string",
          "last_message_time": "timestamp"
        }
      ]
    }
    ```

### 4.2 Get Chat with User
- **Endpoint:** GET /user-chat/with/:peer_id
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves the chat between the authenticated user and another user.
- **Parameters:** peer_id - ID of the user to chat with
- **Response:**
  - Success (200):
    ```json
    {
      "chat_id": "integer",
      "messages": [
        {
          "sender_id": "integer",
          "content": "string",
          "sent_at": "timestamp"
        }
      ]
    }
    ```

### 4.3 Send Message to User
- **Endpoint:** POST /user-chat/send/:peer_id
- **Middleware:** Requires authentication (userAuth)
- **Description:** Sends a message to another user.
- **Parameters:** peer_id - ID of the user to send the message to
- **Request Body:**
  ```json
  {
    "content": "string"
  }
  ```
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Message sent successfully"
    }
    ```

### 4.4 Delete Chat with User
- **Endpoint:** DELETE /user-chat/delete/:peer_id
- **Middleware:** Requires authentication (userAuth)
- **Description:** Deletes the chat between the authenticated user and another user.
- **Parameters:** peer_id - ID of the user to delete the chat with
- **Response:**
  - Success (200):
    ```json
    {
      "message": "Chat deleted successfully"
    }
    ```