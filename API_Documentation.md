# API Documentation

## User API Endpoints

### 1. GET /users
- **Description**: Retrieves all users.
- **Input**: None.
- **Output**: 
```json
[
    {
        "id": 56,
        "first_name": "Manu",
        "middle_name": null,
        "last_name": "Dsdoe",
        "username": null,
        "email": "jsdhn.doe@example.com",
        "password_hash": "Decryption Error",
        "photo": {
            "type": "Buffer",
            "data": [
                117,
                114,
                108,
                95,
                116,
                111,
                95,
                112,
                104,
                111,
                116,
                111
            ]
        },
        "role_id": 1,
        "status": "active",
        "created_at": "2025-03-20T12:43:55.074Z",
        "updated_at": "2025-03-20T12:45:07.110Z",
        "attendees_role": "Developer",
        "linkedin_url": "https://www.linkedin.com/in/johndoe",
        "block_status": "unblocked"
    },
]
```

### 2. GET /users/stats
- **Description**: Retrieves user statistics.
- **Input**: None.
- **Output**: 
```json
{
    "data": [
        {
            "user_id": 65,
            "first_name": "Johdghdffsfn",
            "last_name": "Dodczshgffe",
            "total_attended_events": "0",
            "total_connections": "0"
        },
    ]
}
```

### 3. GET /users/count
- **Description**: Retrieves the count of users.
- **Input**: Optional query parameter `year`. could be current/previous
- **Output**: 
```json
{
  "year": 2025,
  "data": [
    {
      "month": 1,
      "total_users": 20
    }
  ]
}
```

### 4. GET /users/block-status
- **Description**: Retrieves the block status of all users.
- **Input**: None.
- **Output**: 
```json
{
  "message": "Users fetched successfully.",
  "users": [
    {
      "user_id": 1,
      "user_name": "John Doe",
      "block_status": "unblocked"
    }
  ]
}
```

### 5. PUT /users/block-status
- **Description**: Sets the block status for users.
- **Input**: JSON body with `id` and `block_status`.
- **Example Input**: 
```json
{
  "id": 1,
  "block_status": "blocked"
}
```
- **Output**: 
```json
{
  "message": "User 1 is now blocked.",
  "new_status": "blocked"
}
```

### 6. POST /users
- **Description**: Creates a new user.
- **Input**: JSON body with user details.
- **Example Input**: 
```json
{
  "first_name": "Jane",
  "middle_name": "Smith", //optional
  "last_name": "Doe",
  "username": "janesmith",  //optional
  "email": "jane.doe@example.com",
  "password": "securepassword",
  "role_id": 1, //(1-> admin, 2-> moderator 3->user)
  "attendees_role": "Developer",
  "photo": "https://example.com/jane_doe.jpg",  //optional
  "linkedin_url": "https://linkedin.com/in/janedoe"
}
```
- **Output**: Created user object.
```json
{
  "id": 2,
  "first_name": "Jane",
  "middle_name": "Smith", 
  "last_name": "Doe",
  "username": "janesmith", 
  "email": "jane.doe@example.com",
  "password": "securepassword",
  "role_id": 1,
  "attendees_role": "Developer",
  "photo": "https://example.com/jane_doe.jpg",
  "linkedin_url": "https://linkedin.com/in/janedoe"
}
```

### 7. GET /users/connections/:userId
- **Description**: Retrieves connections for a user in attended events.
- **Input**: URL parameter `userId`.
- **Output**: 
```json
{
  "user_id": 1,
  "events": [
    {
      "event_id": 1,
      "total_connections": 5
    }
  ]
}
```

### 8. GET /users/:userId/:eventId/connections
- **Description**: Retrieves event connections for a specific user and event.
- **Input**: URL parameters `userId` and `eventId`.
- **Output**: 
```json
{
  "user_id": 1,
  "event_id": 1,
  "connections": [
    {
      "user_id": 2,
      "first_name": "Alice",
      "last_name": "Smith"
    }
  ]
}
```

### 9. GET /users/:id
- **Description**: Retrieves a user by ID.
- **Input**: URL parameter `id`.
- **Output**: 
```json
{
  "id": 2,
  "first_name": "Jane",
  "middle_name": "Smith", 
  "last_name": "Doe",
  "username": "janesmith", 
  "email": "jane.doe@example.com",
  "password": "securepassword",
  "role_id": 1,
  "attendees_role": "Developer",
  "photo": "https://example.com/jane_doe.jpg",
  "linkedin_url": "https://linkedin.com/in/janedoe"
}
```

### 10. PUT /users/:id
- **Description**: Updates a user by ID.
- **Input**: URL parameter `id` and JSON body with updated user details.
- **Example Input**: 
```json
{
  "id": 2,
  "first_name": "Jane",
  "middle_name": "Smith", 
  "last_name": "Doe",
  "username": "janesmith", 
  "email": "jane.doe@example.com",
  "password": "securepassword",
  "role_id": 1,
  "attendees_role": "Developer",
  "photo": "https://example.com/jane_doe.jpg",
  "linkedin_url": "https://linkedin.com/in/janedoe"
  // all are optional
}
```
- **Output**: Updated user object.
```json
{
 "id": 2,
  "first_name": "Jane",
  "middle_name": "Smith", 
  "last_name": "Doe",
  "username": "janesmith", 
  "email": "jane.doe@example.com",
  "password": "securepassword",
  "role_id": 1,
  "attendees_role": "Developer",
  "photo": "https://example.com/jane_doe.jpg",
  "linkedin_url": "https://linkedin.com/in/janedoe"
}
```

### 11. DELETE /users/:id
- **Description**: Deletes a user by ID.
- **Input**: URL parameter `id`.
- **Output**: 
```json
{
  "message": "User deleted successfully"
}
```

## Event API Endpoints

### 1. POST /create
- **Description**: Creates a new event.
- **Input**: JSON body with event details.
- **Example Input**: 
```json
{
  "name": "Sample Event",
  "description": "This is a sample event.",
  "start_date_time": "2023-10-01T10:00:00Z",
  "end_date_time": "2023-10-01T12:00:00Z",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "venue": "Sample Venue",
  "web_page_url": "http://example.com",
  "banner": "http://example.com/banner.jpg",
  "priority": 1,
  "status": "active"
}
```
- **Output**: Created event object.
```json
{
  "message": "Event created successfully",
  "event": {
    "id": 1,
    "name": "Sample Event",
    "description": "This is a sample event."
  }
}
```

### 2. GET /all
- **Description**: Retrieves all events.
- **Input**: None.
- **Output**: Array of event objects.
```json
[
  {
    "id": 1,
    "name": "Sample Event",
    "description": "This is a sample event.",
    "start_date_time": "2023-10-01T10:00:00Z",
    "end_date_time": "2023-10-01T12:00:00Z",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "venue": "Sample Venue",
    "web_page_url": "http://example.com",
    "banner": "http://example.com/banner.jpg",
    "priority": 1,
    "status": "active"
  }
]
```

### 3. GET /count
- **Description**: Retrieves the count of events.
- **Input**: Optional query parameter `year`.
- **Output**: Count of events.
```json
{
  "year": 2023,
  "data": [
    {
      "month": 1,
      "total_events": 5
    }
  ]
}
```

### 4. GET /connections
- **Description**: Retrieves a list of event connections.
- **Input**: None.
- **Output**: Array of event connection objects.
```json
{
  "message": "Event connections fetched successfully.",
  "events": [
    {
      "event_id": 1,
      "event_name": "Sample Event",
      "total_connections": 10
    }
  ]
}
```

### 5. GET /:id
- **Description**: Retrieves an event by ID.
- **Input**: URL parameter `id`.
- **Output**: Event object.
```json
{
  "id": 1,
  "name": "Sample Event",
  "description": "This is a sample event.",
  "start_date_time": "2023-10-01T10:00:00Z",
  "end_date_time": "2023-10-01T12:00:00Z",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "venue": "Sample Venue",
  "web_page_url": "http://example.com",
  "banner": "http://example.com/banner.jpg",
  "priority": 1,
  "status": "active"
}
```

### 6. PUT /:id
- **Description**: Updates an event by ID.
- **Input**: URL parameter `id` and JSON body with updated event details.
- **Example Input**: 
```json
{
  "name": "Sample Event",
  "description": "This is a sample event.",
  "start_date_time": "2023-10-01T10:00:00Z",
  "end_date_time": "2023-10-01T12:00:00Z",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "venue": "Sample Venue",
  "web_page_url": "http://example.com",
  "banner": "http://example.com/banner.jpg",
  "priority": 1,
  "status": "active"
  //all are optional
}
```
- **Output**: Updated event object.
```json
{
  "message": "Event updated successfully",
  "event": {
    "id": 1,
    "name": "Sample Event",
    "description": "This is a sample event.",
    "start_date_time": "2023-10-01T10:00:00Z",
    "end_date_time": "2023-10-01T12:00:00Z",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "venue": "Sample Venue",
    "web_page_url": "http://example.com",
    "banner": "http://example.com/banner.jpg",
    "priority": 1,
    "status": "active"
  }
}
```

### 7. DELETE /:id
- **Description**: Deletes an event by ID.
- **Input**: URL parameter `id`.
- **Output**: Confirmation message.
```json
{
  "message": "Event deleted successfully"
}
```

### 8. PUT /toggle/:id
- **Description**: Toggles registration for an event.
- **Input**: URL parameter `id` and JSON body with `status`.
- **Example Input**: 
```json
{
  "status": "disabled"
}
```
- **Output**: Confirmation message.
```json
{
  "message": "Event registration disabled",
  "event": {
    "id": 1,
    "status": "disabled"
  }
}
```

### 9. GET /attendees/:event_id
- **Description**: Retrieves attendees for a specific event.
- **Input**: URL parameter `event_id`.
- **Output**: Array of attendee objects.
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com"
  }
]
```

### 10. GET /analytics/:event_id
- **Description**: Retrieves analytics for a specific event.
- **Input**: URL parameter `event_id`.
- **Output**: Event analytics.
```json
{
  "event_id": 1,
  "total_registrations": 100,
  "total_check_ins": 80
}
```

## Connections API Endpoints

### 1. GET /all
- **Description**: Retrieves all connections.
- **Input**: None.
- **Output**: Array of connection objects.
```json
[
  {
    "connection_id": 1,
    "user1_id": 1,
    "user1_first_name": "John",
    "user1_last_name": "Doe",
    "user1_role": "Attendee",
    "user2_id": 2,
    "user2_first_name": "Jane",
    "user2_last_name": "Smith",
    "user2_role": "Attendee",
    "status": "accepted",
    "created_at": "2023-10-01 10:00:00"
  }
]
``` 

### 2. GET /ranking
- **Description**: Retrieves the ranking of user connections.
- **Input**: None.
- **Output**: Array of user connection ranking objects.
```json
[
  {
    "user_id": 1,
    "full_name": "John Doe",
    "total_connections": 10
  }
]
```

### 3. GET /count
- **Description**: Retrieves the count of connections.
- **Input**: Optional query parameter `year`.
- **Output**: Count of connections.
```json
{
  "year": 2023,
  "data": [
    {
      "month": 1,
      "total_connections": 50
    }
  ]
}
```



