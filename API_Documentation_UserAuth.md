# User Authentication and Event APIs Documentation

## 1. Register User
- **Endpoint:** POST /register
- **Description:** Registers a new user with provided details.
- **Request Body:**
  ```json
  {
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "password": "string",
    "linkedin_url": "string (optional)",
    "role_id": "integer",
    "attendees_role": "string (optional)",
    "preference": "string (optional)"
  }
  ```
- **Response:**
  - Success (201):
    ```json
    {
      "message": "User registered",
      "userId": "integer"
    }
    ```

## 2. Login User
- **Endpoint:** POST /login
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

## 3. Get User Profile
- **Endpoint:** GET /profile
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves the profile information of the authenticated user.
- **Request Parameters:** None
- **Response:**
  - Success (200):
    ```json
    {
      "user": {
        "id": "integer",
        "first_name": "string",
        "middle_name": "string",
        "last_name": "string",
        "username": "string",
        "email": "string",
        "status": "string",
        "role_id": "integer",
        "role_name": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "attendees_role": "string",
        "linkedin_url": "string",
        "block_status": "boolean"
      }
    }
    ```

## 4. Get Upcoming Events
- **Endpoint:** GET /upcoming-events
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves a list of upcoming events starting after the current time.
- **Request Parameters:** None
- **Response:**
  - Success (200):
    ```json
    {
      "upcoming_events": [
        {
          "id": "integer",
          "name": "string",
          "description": "string",
          "start_date_time": "timestamp",
          "end_date_time": "timestamp",
          "latitude": "float",
          "longitude": "float",
          "venue": "string",
          "web_page_url": "string",
          "banner": "string",
          "priority": "integer"
        },
      ]
    }

## 5. Get Attended Events
- **Endpoint:** GET /attended-events
- **Middleware:** Requires authentication (userAuth)
- **Description:** Retrieves a list of events the authenticated user has attended.
- **Request Parameters:** None
- **Response:**
  - Success (200):
    ```json
    {
      "attended_events": [
        {
          "id": "integer",
          "name": "string",
          "description": "string",
          "start_date_time": "timestamp",
          "end_date_time": "timestamp",
          "latitude": "float",
          "longitude": "float",
          "venue": "string",
          "web_page_url": "string",
          "banner": "string",
          "priority": "integer"
        },
      ]
    }

## 6. Register for Event
- **Endpoint:** POST /register-event
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
    

## 7. Check Location
- **Endpoint:** POST /check-location
- **Middleware:** Requires authentication (userAuth)
- **Description:** Checks if the authenticated user is within 500 meters of the event location.
- **Request Body:**
  ```json
  {
    "event_id": "integer",
    "latitude": "float",
    "longitude": "float"
  }
  ```
- **Response:**
  - Success (200): User is within 500 meters
    ```json
    {
      "message": "✅ You are within 500 meters of the event. Would you like to mark attendance?"
    }
    ```

## 8. Mark Attendance
- **Endpoint:** POST /mark-attendance
- **Middleware:** Requires authentication (userAuth)
- **Description:** Marks attendance for the authenticated user for a specified event.
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
      "message": "Attendance marked successfully!"
    }
    ```
  -