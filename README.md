# API Endpoints Specification

## 1. User Management

### 1.1 Register User
- **Endpoint**: `POST /api/v1/users/register`
- **Request Body**:
    ```json
    {
        "name": "Simeon Tuyoleni",
        "email": "simeon.tuyoleni@example.com",
        "password": "your_password",
        "phone": "1234567890",
        "type_of_institution": "University",
        "affiliation": "NUST",
        "programming_language": "Python",
        "preferred_ide": "VS Code",
        "mentor_details": "Prof. Smith"
    }
    ```

### 1.2 User Login
- **Endpoint**: `POST /api/v1/users/login`
- **Request Body**:
    ```json
    {
        "email": "simeon.tuyoleni@example.com",
        "password": "your_password"
    }
    ```

### 1.3 Get User Profile
- **Endpoint**: `GET /api/v1/users/profile`
- **Response**: 
    ```json
    {
        "user_id": 1,
        "name": "Simeon Tuyoleni",
        "email": "simeon.tuyoleni@example.com"
        // ... other user details
    }
    ```

### 1.4 Update User Profile
- **Endpoint**: `PATCH /api/v1/users/profile/update`
- **Request Body**:
    ```json
    {
        "phone": "0987654321",
        "preferred_ide": "PyCharm"
    }
    ```

### 1.5 List All Users (Admin)
- **Endpoint**: `GET /api/v1/users/list`
- **Response**:
    ```json
    [
        {
            "user_id": 1,
            "name": "Simeon Tuyoleni",
            "email": "simeon.tuyoleni@example.com"
        }
        // ... other users
    ]
    ```

---

## 2. Competition Management

### 2.1 Create Competition
- **Endpoint**: `POST /api/v1/competitions`
- **Request Body**:
    ```json
    {
        "name": "Annual Programming Competition",
        "description": "A competition for programming enthusiasts.",
        "start_date": "2024-05-01",
        "end_date": "2024-05-02",
        "status": "upcoming",
        "category": "tertiary"
    }
    ```

### 2.2 Get All Competitions
- **Endpoint**: `GET /api/v1/competitions`
- **Response**:
    ```json
    [
        {
            "competition_id": 1,
            "name": "Annual Programming Competition",
            "description": "A competition for programming enthusiasts.",
            "start_date": "2024-05-01",
            "end_date": "2024-05-02",
            "status": "upcoming",
            "category": "tertiary"
        }
        // ... other competitions
    ]
    ```

### 2.3 Update Competition
- **Endpoint**: `PATCH /api/v1/competitions/:id`
- **Request Body**:
    ```json
    {
        "name": "Updated Competition Name",
        "description": "Updated description.",
        "start_date": "2024-06-01",
        "end_date": "2024-06-02",
        "status": "active",
        "category": "high_school"
    }
    ```

### 2.4 Delete Competition
- **Endpoint**: `DELETE /api/v1/competitions/:id`
- **Response**:
    ```json
    {
        "message": "Competition deleted successfully"
    }
    ```

---

## 3. Team & Registration Management

### 3.1 Create Team
- **Endpoint**: `POST /api/v1/teams/create`
- **Request Body**:
    ```json
    {
        "team_name": "Team A",
        "leader_id": 1,
        "school_name": "NUST"
    }
    ```

### 3.2 Get Team Details
- **Endpoint**: `GET /api/v1/teams/:teamId/details`
- **Response**:
    ```json
    {
        "team_id": 1,
        "team_name": "Team A",
        "leader_id": 1,
        "school_name": "NUST",
        "members": [
            {
                "user_id": 1,
                "name": "Simeon Tuyoleni"
            }
            // ... other team members
        ]
    }
    ```

### 3.3 Update Team
- **Endpoint**: `PATCH /api/v1/teams/:teamId/update`
- **Request Body**:
    ```json
    {
        "team_name": "Updated Team A"
    }
    ```

### 3.4 Register for Competition
- **Endpoint**: `POST /api/v1/registrations/register`
- **Request Body**:
    ```json
    {
        "competition_id": 1,
        "user_id": 1,
        "team_id": 1
    }
    ```

### 3.5 Deregister from Competition
- **Endpoint**: `DELETE /api/v1/registrations/:registrationId/deregister`
- **Response**:
    ```json
    {
        "message": "Deregistration successful."
    }
    ```

---

## 4. Messaging

### 4.1 Broadcast Message (Admin)
- **Endpoint**: `POST /api/v1/messages`
- **Request Body**:
    ```json
    {
        "sender_id": 2,
        "recipient_group": "all",
        "content": "Reminder: The competition starts next week!"
    }
    ```

### 4.2 Get Inbox Messages
- **Endpoint**: `GET /api/v1/messages/inbox`
- **Response**:
    ```json
    [
        {
            "message_id": 1,
            "sender_id": 2,
            "content": "Reminder: The competition starts next week!",
            "sent_date": "2024-04-15T10:00:00Z"
        }
        // ... other messages
    ]
    ```

### 4.3 Get Sent Messages (Admin)
- **Endpoint**: `GET /api/v1/messages/sent`
- **Response**:
    ```json
    [
        {
            "message_id": 1,
            "recipient_group": "all",
            "content": "Reminder: The competition starts next week!",
            "sent_date": "2024-04-15T10:00:00Z"
        }
        // ... other sent messages
    ]
    ```

---

## 5. Image and Video Handling

### 5.1 Upload Image or Video
- **Endpoint**: `POST /api/v1/files/upload`
- **Request Body**: (Multipart/form-data)
    - **file (file field)**: The image or video file to upload.
- **Response**:
    ```json
    {
        "message": "File uploaded successfully.",
        "file_id": 1,
        "url": "https://your-bucket.s3.amazonaws.com/image.jpg" // Or video.mp4
    }
    ```

---

## 6. Blog Management

### 6.1 Create Blog
- **Endpoint**: `POST /api/v1/blogs/create`
- **Request Body**:
    ```json
    {
        "title": "My First Blog",
        "content": "This is the content of my first blog.",
        "author_id": 1,
        "image_id": 1 // Optional
    }
    ```

### 6.2 Get All Blogs
- **Endpoint**: `GET /api/v1/blogs`
- **Response**:
    ```json
    [
        {
            "blog_id": 1,
            "title": "My First Blog",
            "content": "This is the content of my first blog.",
            "author_id": 1,
            "created_date": "2024-04-15T10:00:00Z",
            "image_url": "https://your-bucket.s3.amazonaws.com/image.jpg" // Optional
        }
        // ... other blogs
    ]
    ```

### 6.3 Get Blog Details
- **Endpoint**: `GET /api/v1/blogs/:blogId`
- **Response**:
    ```json
    {
        "blog": {
            "blog_id": 1,
            "title": "My First Blog",
            "content": "This is the content of my first blog.",
            "author_id": 1,
            "created_date": "2024-04-15T10:00:00Z",
            "image_url": "https://your-bucket.s3.amazonaws.com/image.jpg" // Optional
        },
        "comments": [
            {
                "comment_id": 1,
                "user_id": 1,
                "content": "Great blog!",
                "comment_date": "2024-04-15T10:00:00Z",
                "image_url": "https://your-bucket.s3.amazonaws.com/comment-image.jpg" // Optional
            }
            // ... other comments
        ]
    }
    ```

### 6.4 Update Blog
- **Endpoint**: `PATCH /api/v1/blogs/:blogId/update`
- **Request Body**:
    ```json
    {
        "title": "Updated Blog Title",
        "content": "Updated content.",
        "image_id": 2 // Optional
    }
    ```

### 6.5 Delete Blog
- **Endpoint**: `DELETE /api/v1/blogs/:blogId`
- **Response**:
    ```json
    {
        "message": "Blog deleted successfully."
    }
    ```
